import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { embed, vectorToPgString } from "../_shared/embeddings.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

async function enrichWithAI(title: string, content: string, memory_type: string) {
  if (!content || content.length < 30) {
    return { summary: content?.slice(0, 200) || title, tags: [memory_type], importance: 3 };
  }
  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você organiza a memória de uma empresa. Resuma em 1-2 frases objetivas, gere 3-6 tags curtas em minúsculas (ex: 'meta-ads','criativo','funil','cac') e atribua importância 1-5 (5 = decisão estratégica/crise; 3 = padrão; 1 = trivial)." },
          { role: "user", content: `Tipo: ${memory_type}\nTítulo: ${title}\nConteúdo: ${content.slice(0, 4000)}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "store_memory",
            description: "Estrutura a memória",
            parameters: {
              type: "object",
              properties: {
                summary: { type: "string" },
                tags: { type: "array", items: { type: "string" } },
                importance: { type: "integer", minimum: 1, maximum: 5 },
              },
              required: ["summary", "tags", "importance"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "store_memory" } },
      }),
    });
    if (!resp.ok) throw new Error(`AI ${resp.status}`);
    const data = await resp.json();
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) throw new Error("no tool call");
    return JSON.parse(args);
  } catch (e) {
    console.error("enrich error", e);
    return { summary: content.slice(0, 200), tags: [memory_type], importance: 3 };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json();
    const {
      memory_type = "note",
      source = "manual",
      title,
      content = "",
      tags: providedTags,
      importance: providedImportance,
      reference_table = null,
      reference_id = null,
      raw_data = {},
      occurred_at,
      skip_ai = false,
    } = body;

    if (!title) return new Response(JSON.stringify({ error: "title required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const enriched = skip_ai
      ? { summary: content.slice(0, 200), tags: providedTags || [memory_type], importance: providedImportance || 3 }
      : await enrichWithAI(title, content, memory_type);

    const { data: dna } = await supabase.from("company_dna").select("id").eq("user_id", userData.user.id).maybeSingle();

    // F1: gerar embedding (title + summary) pra retrieval semântico em chat-v2.
    // Falha aqui não derruba a request — a memória ainda é gravada sem embedding.
    // Backfill posterior pode preencher.
    let embeddingPg: string | null = null;
    try {
      const embedText = `${title}\n${enriched.summary || ""}\n${content || ""}`.slice(0, 8000);
      const e = await embed(embedText);
      embeddingPg = vectorToPgString(e.vector);
    } catch (embedErr) {
      console.error("embed failed, gravando sem embedding:", embedErr instanceof Error ? embedErr.message : embedErr);
    }

    const { data: inserted, error } = await supabase.from("business_memory").insert({
      user_id: userData.user.id,
      company_dna_id: dna?.id ?? null,
      memory_type, source, title,
      summary: enriched.summary,
      content,
      tags: providedTags ?? enriched.tags,
      importance: providedImportance ?? enriched.importance,
      reference_table, reference_id, raw_data,
      occurred_at: occurred_at ?? new Date().toISOString(),
      embedding: embeddingPg,
    }).select().single();

    if (error) throw error;
    return new Response(JSON.stringify({ success: true, memory: inserted }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("ingest-memory error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
