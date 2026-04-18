import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é o Orion, um diretor de marketing sênior fazendo um diagnóstico estratégico profundo de um negócio.

Sua missão: analisar todos os dados disponíveis (Company DNA, métricas de negócio, criativos, posicionamento) e devolver um diagnóstico CIRÚRGICO no formato exigido.

Princípios:
- Seja ESPECÍFICO. Nunca dê conselhos genéricos tipo "melhore seu funil".
- Aponte hipóteses concretas baseadas nos dados ("CAC R$80 com ticket R$197 e payback de 3 meses sugere que o gargalo NÃO é aquisição, é retenção").
- Se faltam dados em uma área, marque score como "unknown" (50) e explique no insight.
- Tom: direto, consultivo, sem floreios. Como um sócio falando com outro sócio.
- Tudo em português do Brasil.

Áreas a avaliar (cada uma com score 0-100, status verde/amarelo/vermelho/desconhecido):
1. trafego - aquisição paga e orgânica
2. criativo - qualidade dos anúncios e fadiga
3. copy - mensagem, hooks, headlines
4. oferta - proposta de valor, preço, garantia
5. branding - posicionamento, diferenciação, percepção
6. funil - jornada do visitante até o cliente

Para cada gargalo (top 3), forneça hipótese, evidência (qual dado sustenta) e ação recomendada.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    // Gather all context
    const [{ data: dna }, { data: metrics }, { data: creatives }] = await Promise.all([
      supabase.from("company_dna").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("business_metrics").select("*").eq("user_id", userId).order("snapshot_date", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("creative_uploads").select("file_name, asset_kind, performance_label, copy_text, notes").eq("user_id", userId).limit(20),
    ]);

    if (!dna) {
      return new Response(JSON.stringify({ error: "Complete o onboarding antes de gerar o diagnóstico." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userPrompt = `# DADOS DO NEGÓCIO

## Company DNA
${JSON.stringify(dna.dna_data, null, 2)}

## Métricas de Negócio (snapshot mais recente)
${metrics ? JSON.stringify(metrics, null, 2) : "NENHUMA MÉTRICA REGISTRADA AINDA"}

## Criativos enviados (${creatives?.length || 0})
${creatives && creatives.length > 0 ? JSON.stringify(creatives, null, 2) : "Nenhum criativo enviado"}

---

Agora gere o diagnóstico completo via tool call \`generate_diagnostic\`.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_diagnostic",
              description: "Devolve o diagnóstico estruturado de marketing.",
              parameters: {
                type: "object",
                properties: {
                  score: { type: "integer", minimum: 0, maximum: 100, description: "Score geral 0-100" },
                  executive_summary: { type: "string", description: "Resumo executivo de 2-3 frases, direto." },
                  area_scores: {
                    type: "object",
                    properties: {
                      trafego: {
                        type: "object",
                        properties: {
                          score: { type: "integer", minimum: 0, maximum: 100 },
                          status: { type: "string", enum: ["verde", "amarelo", "vermelho", "desconhecido"] },
                          insight: { type: "string" },
                        },
                        required: ["score", "status", "insight"],
                        additionalProperties: false,
                      },
                      criativo: {
                        type: "object",
                        properties: {
                          score: { type: "integer", minimum: 0, maximum: 100 },
                          status: { type: "string", enum: ["verde", "amarelo", "vermelho", "desconhecido"] },
                          insight: { type: "string" },
                        },
                        required: ["score", "status", "insight"],
                        additionalProperties: false,
                      },
                      copy: {
                        type: "object",
                        properties: {
                          score: { type: "integer", minimum: 0, maximum: 100 },
                          status: { type: "string", enum: ["verde", "amarelo", "vermelho", "desconhecido"] },
                          insight: { type: "string" },
                        },
                        required: ["score", "status", "insight"],
                        additionalProperties: false,
                      },
                      oferta: {
                        type: "object",
                        properties: {
                          score: { type: "integer", minimum: 0, maximum: 100 },
                          status: { type: "string", enum: ["verde", "amarelo", "vermelho", "desconhecido"] },
                          insight: { type: "string" },
                        },
                        required: ["score", "status", "insight"],
                        additionalProperties: false,
                      },
                      branding: {
                        type: "object",
                        properties: {
                          score: { type: "integer", minimum: 0, maximum: 100 },
                          status: { type: "string", enum: ["verde", "amarelo", "vermelho", "desconhecido"] },
                          insight: { type: "string" },
                        },
                        required: ["score", "status", "insight"],
                        additionalProperties: false,
                      },
                      funil: {
                        type: "object",
                        properties: {
                          score: { type: "integer", minimum: 0, maximum: 100 },
                          status: { type: "string", enum: ["verde", "amarelo", "vermelho", "desconhecido"] },
                          insight: { type: "string" },
                        },
                        required: ["score", "status", "insight"],
                        additionalProperties: false,
                      },
                    },
                    required: ["trafego", "criativo", "copy", "oferta", "branding", "funil"],
                    additionalProperties: false,
                  },
                  bottlenecks: {
                    type: "array",
                    description: "Top 3 gargalos prioritários ordenados por impacto.",
                    minItems: 1,
                    maxItems: 3,
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Título curto do gargalo" },
                        area: { type: "string", enum: ["trafego", "criativo", "copy", "oferta", "branding", "funil"] },
                        severity: { type: "string", enum: ["alta", "media", "baixa"] },
                        hypothesis: { type: "string", description: "Hipótese concreta" },
                        evidence: { type: "string", description: "Qual dado sustenta a hipótese" },
                        action: { type: "string", description: "Próxima ação recomendada" },
                      },
                      required: ["title", "area", "severity", "hypothesis", "evidence", "action"],
                      additionalProperties: false,
                    },
                  },
                  recommendations: {
                    type: "array",
                    description: "3-5 recomendações estratégicas amplas, fora dos gargalos.",
                    minItems: 3,
                    maxItems: 5,
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        rationale: { type: "string" },
                      },
                      required: ["title", "rationale"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["score", "executive_summary", "area_scores", "bottlenecks", "recommendations"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_diagnostic" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione fundos em Settings > Workspace > Usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const txt = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, txt);
      return new Response(JSON.stringify({ error: "Falha ao gerar diagnóstico." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      console.error("No tool call in response:", JSON.stringify(aiData));
      return new Response(JSON.stringify({ error: "Resposta da IA inválida." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const diagnostic = JSON.parse(toolCall.function.arguments);

    const { data: saved, error: saveErr } = await supabase
      .from("diagnostics")
      .insert({
        user_id: userId,
        company_dna_id: dna.id,
        business_metrics_id: metrics?.id ?? null,
        score: diagnostic.score,
        area_scores: diagnostic.area_scores,
        bottlenecks: diagnostic.bottlenecks,
        executive_summary: diagnostic.executive_summary,
        recommendations: diagnostic.recommendations,
        raw_response: aiData,
        model_used: "google/gemini-2.5-pro",
      })
      .select()
      .single();

    if (saveErr) {
      console.error("Save diagnostic error:", saveErr);
      return new Response(JSON.stringify({ error: "Diagnóstico gerado mas falhou ao salvar.", diagnostic }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ diagnostic: saved }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("diagnose-business error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
