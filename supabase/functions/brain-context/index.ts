import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BRAIN_SYSTEM = "Você é o cérebro contínuo de uma operação de marketing. Produza um briefing de big picture em até 6 bullets curtos: estado atual, riscos, oportunidades e próximas ações sugeridas. Português direto, sem floreio.";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const userId = userData.user.id;

    const { mode = "summary", query = "" } = await req.json().catch(() => ({}));

    const [dnaR, metricsR, diagR, decisionsR, memoryR] = await Promise.all([
      supabase.from("company_dna").select("company_name, business_context, dna_data").eq("user_id", userId).maybeSingle(),
      supabase.from("business_metrics").select("*").eq("user_id", userId).order("snapshot_date", { ascending: false }).limit(1),
      supabase.from("diagnostics").select("score, executive_summary, area_scores, bottlenecks, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(1),
      supabase.from("ai_decisions").select("title, status, severity, action_type, created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(10),
      supabase.from("business_memory").select("memory_type, title, summary, tags, importance, occurred_at").eq("user_id", userId).order("importance", { ascending: false }).order("occurred_at", { ascending: false }).limit(40),
    ]);

    const dna = dnaR.data;
    const metrics = metricsR.data?.[0];
    const diagnostic = diagR.data?.[0];
    const decisions = decisionsR.data ?? [];
    const memory = memoryR.data ?? [];

    const contextBlock = {
      company: dna?.company_name ?? "—",
      dna_summary: dna?.dna_data ?? null,
      business_context: dna?.business_context ?? null,
      latest_metrics: metrics ?? null,
      latest_diagnostic: diagnostic ?? null,
      pending_decisions: decisions.filter((d: any) => d.status === "pending").slice(0, 5),
      recent_decisions: decisions.slice(0, 5),
      important_memory: memory.slice(0, 20),
    };

    if (mode === "raw") {
      return new Response(JSON.stringify({ context: contextBlock }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // mode === 'summary' → IA produz briefing executivo
    if (!ANTHROPIC_API_KEY) {
      // Fallback sem IA: retorna só o contexto bruto
      return new Response(JSON.stringify({ context: contextBlock, briefing: null }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const userContent = [
      `Empresa: ${contextBlock.company}`,
      `Métricas mais recentes: ${JSON.stringify(metrics ?? {})}`,
      `Diagnóstico atual: score ${diagnostic?.score ?? "—"} — ${diagnostic?.executive_summary ?? "sem diagnóstico"}`,
      `Decisões pendentes: ${contextBlock.pending_decisions.map((d: any) => `[${d.severity}] ${d.title}`).join(" | ") || "nenhuma"}`,
      `Memória importante (top 20): ${memory.slice(0, 20).map((m: any) => `(${m.memory_type}) ${m.title} — ${m.summary ?? ""}`).join(" || ")}`,
      query ? `Pergunta foco: ${query}` : "",
    ].filter(Boolean).join("\n\n");

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: BRAIN_SYSTEM,
        messages: [{ role: "user", content: userContent }],
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      console.error("Anthropic brain-context error:", resp.status, txt);
      // Graceful: return context without briefing
      return new Response(JSON.stringify({ context: contextBlock, briefing: null }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await resp.json();
    const briefing = data.content?.[0]?.text ?? "";

    return new Response(JSON.stringify({ context: contextBlock, briefing }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("brain-context error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
