// deno-lint-ignore-file
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { token } = await req.json();
    if (!token) throw new Error("Token obrigatório");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Não autenticado");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("Usuário inválido");

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: invite, error: invErr } = await admin
      .from("company_invites")
      .select("*")
      .eq("token", token)
      .maybeSingle();

    if (invErr || !invite) throw new Error("Convite não encontrado");
    if (invite.status !== "pending") throw new Error("Convite já utilizado ou revogado");
    if (new Date(invite.expires_at).getTime() < Date.now()) throw new Error("Convite expirado");

    // Cria role
    await admin.from("user_roles").upsert(
      {
        user_id: user.id,
        company_dna_id: invite.company_dna_id,
        role: invite.role,
      },
      { onConflict: "user_id,company_dna_id,role" }
    );

    // Marca invite como aceito
    await admin
      .from("company_invites")
      .update({
        status: "accepted",
        accepted_by: user.id,
        accepted_at: new Date().toISOString(),
      })
      .eq("id", invite.id);

    // Cria team_member opcional
    await admin.from("team_members").insert({
      user_id: invite.invited_by,
      company_dna_id: invite.company_dna_id,
      name: invite.full_name || user.email?.split("@")[0] || "Funcionário",
      email: invite.email,
      role: invite.role,
    }).then(() => {}).catch(() => {});

    return new Response(
      JSON.stringify({ success: true, company_dna_id: invite.company_dna_id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
