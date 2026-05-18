import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é o Orion, diretor de marketing operando como motor de decisão.

Sua missão: ler as métricas recentes (CTR, CPC, CPM, CPA, ROAS, ROI, gasto, conversões) por campanha, comparar com tendência histórica e devolver DECISÕES ACIONÁVEIS — não relatórios.

Regras de ouro:
- Cada decisão DEVE incluir um bloco \`metrics_snapshot\` com TODOS os números relevantes da campanha alvo (cpc, cpa, ctr, roas, roi, spend, revenue, conversions). Sem isso o frontend não consegue exibir contexto.
- Tipos de ação válidos: scale_budget, pause_campaign, refresh_creative, test_audience, audience_split_test, creative_ab_test, adjust_bid, create_team_task, generate_brief, alert_only.
- ANÁLISE DE PÚBLICO: sempre que CPA estiver subindo, ROAS caindo ou CTR fraco, gere PELO MENOS UMA decisão do tipo \`audience_split_test\` ou \`test_audience\` com 2-3 segmentações concretas pra testar (idade, interesses, lookalike, comportamento, geo). Use o conhecimento do DNA (público ideal, persona) pra propor variantes plausíveis.
- TESTE DE CRIATIVOS: quando houver fadiga (CTR -20% em 7d ou frequência alta), gere uma decisão \`creative_ab_test\` com 2-3 variações de criativo descritas (hook, formato, ângulo).
- Severidade alta = perdendo dinheiro AGORA. Média = oportunidade clara. Baixa = experimentação.
- Para create_team_task, o título da tarefa deve ser concreto e operacional (ex: "Gravar 3 UGCs no formato X com hook Y para campanha Z").
- Tom: direto, sem floreios. Português do Brasil.
- Devolva no MÁXIMO 8 decisões priorizadas por impacto, e SEMPRE inclua ao menos 1 análise de público quando houver dados suficientes.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const [{ data: dna }, { data: diagnostic }, { data: campaigns }, { data: metrics }] = await Promise.all([
      supabase.from("company_dna").select("dna_data, company_name").eq("user_id", userId).maybeSingle(),
      supabase.from("diagnostics").select("score, executive_summary, bottlenecks").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("campaigns").select("id, name, platform, status, objective, budget_daily, targeting").eq("user_id", userId).limit(20),
      supabase.from("campaign_metrics").select("campaign_id, date, spend, impressions, clicks, conversions, revenue, ctr, cpc, cpa, roas").eq("user_id", userId).order("date", { ascending: false }).limit(200),
    ]);

    if (!campaigns || campaigns.length === 0) {
      return new Response(JSON.stringify({ error: "Nenhuma campanha encontrada. Use o seeder de mock ou conecte uma plataforma de ads." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const byCampaign: Record<string, any[]> = {};
    (metrics || []).forEach((m: any) => { (byCampaign[m.campaign_id] ||= []).push(m); });

    const campaignSummaries = campaigns.map((c: any) => {
      const rows = (byCampaign[c.id] || []).slice().sort((a, b) => (a.date < b.date ? 1 : -1));
      const last7 = rows.slice(0, 7);
      const prev7 = rows.slice(7, 14);
      const sum = (arr: any[], k: string) => arr.reduce((s, r) => s + (Number(r[k]) || 0), 0);
      const avg = (arr: any[], k: string) => (arr.length ? sum(arr, k) / arr.length : 0);
      const pctChange = (a: number, b: number) => (b > 0 ? ((a - b) / b) * 100 : null);
      const spendL = sum(last7, "spend");
      const revL = sum(last7, "revenue");
      return {
        id: c.id, name: c.name, platform: c.platform, status: c.status,
        objective: c.objective, budget_daily: c.budget_daily, targeting: c.targeting,
        last7: {
          spend: spendL, revenue: revL,
          conversions: sum(last7, "conversions"),
          avg_ctr: avg(last7, "ctr"), avg_cpc: avg(last7, "cpc"),
          avg_cpa: avg(last7, "cpa"), avg_roas: avg(last7, "roas"),
          roi_pct: spendL > 0 ? ((revL - spendL) / spendL) * 100 : null,
        },
        prev7: {
          spend: sum(prev7, "spend"), revenue: sum(prev7, "revenue"),
          conversions: sum(prev7, "conversions"),
          avg_ctr: avg(prev7, "ctr"), avg_cpc: avg(prev7, "cpc"),
          avg_cpa: avg(prev7, "cpa"), avg_roas: avg(prev7, "roas"),
        },
        deltas: {
          ctr_pct: pctChange(avg(last7, "ctr"), avg(prev7, "ctr")),
          cpc_pct: pctChange(avg(last7, "cpc"), avg(prev7, "cpc")),
          cpa_pct: pctChange(avg(last7, "cpa"), avg(prev7, "cpa")),
          roas_pct: pctChange(avg(last7, "roas"), avg(prev7, "roas")),
        },
      };
    });

    const userPrompt = `# CONTEXTO DO NEGÓCIO
${dna ? JSON.stringify({ company: dna.company_name, dna: dna.dna_data }, null, 2) : "Sem DNA"}

# ÚLTIMO DIAGNÓSTICO
${diagnostic ? JSON.stringify(diagnostic, null, 2) : "Nenhum diagnóstico recente"}

# CAMPANHAS — ÚLTIMOS 7 DIAS vs ANTERIORES
${JSON.stringify(campaignSummaries, null, 2)}

Gere as decisões via tool call \`generate_decisions\`. Lembre: incluir metrics_snapshot, e quando aplicável audience_variants ou creative_variants.`;

    const aiResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 8192,
        system: SYSTEM_PROMPT,
        messages: [
          { role: "user", content: userPrompt },
        ],
        tools: [{
          name: "generate_decisions",
          description: "Devolve decisões priorizadas baseadas nas métricas, com snapshot de números e variantes de teste quando aplicável.",
          input_schema: {
              type: "object",
              properties: {
                executive_read: { type: "string", description: "Leitura geral em 1-2 frases." },
                decisions: {
                  type: "array",
                  minItems: 1, maxItems: 8,
                  items: {
                    type: "object",
                    properties: {
                      action_type: {
                        type: "string",
                        enum: ["scale_budget", "pause_campaign", "refresh_creative", "test_audience", "audience_split_test", "creative_ab_test", "adjust_bid", "create_team_task", "generate_brief", "alert_only"],
                      },
                      campaign_id: { type: "string", description: "ID da campanha alvo (ou string vazia)." },
                      title: { type: "string" },
                      rationale: { type: "string" },
                      evidence: { type: "string" },
                      expected_impact: { type: "string" },
                      severity: { type: "string", enum: ["alta", "media", "baixa"] },
                      payload: {
                        type: "object",
                        properties: {
                          delta_pct: { type: "number" },
                          new_budget: { type: "number" },
                          task_assignee_role: { type: "string" },
                          task_steps: { type: "array", items: { type: "string" } },
                          brief_focus: { type: "string" },
                          metrics_snapshot: {
                            type: "object",
                            description: "Snapshot completo dos KPIs no momento da decisão.",
                            properties: {
                              spend: { type: "number" },
                              revenue: { type: "number" },
                              conversions: { type: "number" },
                              cpc: { type: "number" },
                              cpa: { type: "number" },
                              ctr: { type: "number" },
                              roas: { type: "number" },
                              roi_pct: { type: "number" },
                            },
                            additionalProperties: true,
                          },
                          audience_variants: {
                            type: "array",
                            description: "2-3 segmentações de público pra testar quando action_type=test_audience ou audience_split_test.",
                            items: {
                              type: "object",
                              properties: {
                                name: { type: "string" },
                                hypothesis: { type: "string" },
                                targeting: { type: "string", description: "Idade, interesses, comportamento, lookalike, geo, etc." },
                                budget_share_pct: { type: "number" },
                              },
                              required: ["name", "hypothesis", "targeting"],
                              additionalProperties: false,
                            },
                          },
                          creative_variants: {
                            type: "array",
                            description: "2-3 variações de criativo pra testar quando action_type=creative_ab_test ou refresh_creative.",
                            items: {
                              type: "object",
                              properties: {
                                name: { type: "string" },
                                format: { type: "string", description: "video curto, carrossel, estatico, UGC, etc." },
                                hook: { type: "string" },
                                angle: { type: "string" },
                                cta: { type: "string" },
                              },
                              required: ["name", "format", "hook", "angle"],
                              additionalProperties: false,
                            },
                          },
                        },
                        additionalProperties: true,
                      },
                    },
                    required: ["action_type", "campaign_id", "title", "rationale", "evidence", "expected_impact", "severity", "payload"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["executive_read", "decisions"],
              additionalProperties: false,
          },
        }],
        tool_choice: { type: "tool", name: "generate_decisions" },
      }),
    });

    if (!aiResponse.ok) {
      const t = await aiResponse.text();
      console.error("Anthropic error:", aiResponse.status, t);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit da Anthropic. Tente novamente." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ error: "Falha ao interpretar métricas." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiData = await aiResponse.json();
    const toolUseBlock = (aiData.content ?? []).find((b: { type: string }) => b.type === "tool_use");
    if (!toolUseBlock?.input) {
      console.error("No tool_use block:", JSON.stringify(aiData));
      return new Response(JSON.stringify({ error: "Resposta da IA inválida." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const parsed = toolUseBlock.input;

    const validCampaignIds = new Set(campaigns.map((c: any) => c.id));
    const inserts = (parsed.decisions || []).map((d: any) => ({
      user_id: userId,
      diagnostic_id: diagnostic?.id ?? null,
      campaign_id: validCampaignIds.has(d.campaign_id) ? d.campaign_id : null,
      action_type: d.action_type,
      title: d.title,
      rationale: d.rationale,
      evidence: d.evidence,
      expected_impact: d.expected_impact,
      severity: d.severity,
      payload: d.payload || {},
    }));

    const { data: saved, error: insErr } = await supabase
      .from("ai_decisions")
      .insert(inserts)
      .select();

    if (insErr) {
      console.error("Insert decisions error:", insErr);
      return new Response(JSON.stringify({ error: "Falha ao salvar decisões.", parsed }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ executive_read: parsed.executive_read, decisions: saved }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("interpret-metrics error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
