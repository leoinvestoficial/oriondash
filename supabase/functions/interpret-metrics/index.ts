import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é o Orion, diretor de marketing operando como motor de decisão.

Sua missão: ler as métricas recentes (CTR, CPC, CPM, CPA, ROAS, gasto, conversões) por campanha, comparar com tendência histórica e devolver DECISÕES ACIONÁVEIS — não relatórios.

Regras de ouro:
- Cada decisão deve ser específica e justificada por DADO concreto. Ex: "CTR caiu 32% em 7 dias → fadiga criativa".
- Tipos de ação válidos: scale_budget, pause_campaign, refresh_creative, test_audience, adjust_bid, create_team_task, generate_brief, alert_only.
- Severidade alta = perdendo dinheiro AGORA. Média = oportunidade clara. Baixa = experimentação.
- Para create_team_task, o título da tarefa deve ser concreto e operacional (ex: "Gravar 3 UGCs no formato X com hook Y para campanha Z").
- Tom: direto, sem floreios. Português do Brasil.
- Devolva no MÁXIMO 6 decisões priorizadas por impacto.`;

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
      supabase.from("campaigns").select("id, name, platform, status, objective, budget_daily").eq("user_id", userId).limit(20),
      supabase.from("campaign_metrics").select("campaign_id, date, spend, impressions, clicks, conversions, revenue, ctr, cpc, cpa, roas").eq("user_id", userId).order("date", { ascending: false }).limit(200),
    ]);

    if (!campaigns || campaigns.length === 0) {
      return new Response(JSON.stringify({ error: "Nenhuma campanha encontrada. Use o seeder de mock ou conecte uma plataforma de ads." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Aggregate per campaign: last 7 days vs previous 7 days
    const byCampaign: Record<string, any[]> = {};
    (metrics || []).forEach((m: any) => {
      (byCampaign[m.campaign_id] ||= []).push(m);
    });

    const campaignSummaries = campaigns.map((c: any) => {
      const rows = (byCampaign[c.id] || []).slice().sort((a, b) => (a.date < b.date ? 1 : -1));
      const last7 = rows.slice(0, 7);
      const prev7 = rows.slice(7, 14);
      const sum = (arr: any[], k: string) => arr.reduce((s, r) => s + (Number(r[k]) || 0), 0);
      const avg = (arr: any[], k: string) => (arr.length ? sum(arr, k) / arr.length : 0);
      const pctChange = (a: number, b: number) => (b > 0 ? ((a - b) / b) * 100 : null);
      return {
        id: c.id, name: c.name, platform: c.platform, status: c.status,
        objective: c.objective, budget_daily: c.budget_daily,
        last7: {
          spend: sum(last7, "spend"), revenue: sum(last7, "revenue"),
          conversions: sum(last7, "conversions"), avg_ctr: avg(last7, "ctr"),
          avg_cpc: avg(last7, "cpc"), avg_cpa: avg(last7, "cpa"), avg_roas: avg(last7, "roas"),
        },
        prev7: {
          spend: sum(prev7, "spend"), revenue: sum(prev7, "revenue"),
          conversions: sum(prev7, "conversions"), avg_ctr: avg(prev7, "ctr"),
          avg_cpc: avg(prev7, "cpc"), avg_cpa: avg(prev7, "cpa"), avg_roas: avg(prev7, "roas"),
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

Gere as decisões via tool call \`generate_decisions\`.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_decisions",
            description: "Devolve decisões priorizadas baseadas nas métricas.",
            parameters: {
              type: "object",
              properties: {
                executive_read: { type: "string", description: "Leitura geral em 1-2 frases." },
                decisions: {
                  type: "array",
                  minItems: 1, maxItems: 6,
                  items: {
                    type: "object",
                    properties: {
                      action_type: {
                        type: "string",
                        enum: ["scale_budget", "pause_campaign", "refresh_creative", "test_audience", "adjust_bid", "create_team_task", "generate_brief", "alert_only"],
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
                          delta_pct: { type: "number", description: "Para scale/adjust: % de mudança sugerido." },
                          new_budget: { type: "number" },
                          task_assignee_role: { type: "string", description: "Ex: 'designer', 'social_media', 'copywriter'." },
                          task_steps: { type: "array", items: { type: "string" } },
                          brief_focus: { type: "string" },
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
          },
        }],
        tool_choice: { type: "function", function: { name: "generate_decisions" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições atingido. Tente novamente." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const t = await aiResponse.text();
      console.error("AI error:", aiResponse.status, t);
      return new Response(JSON.stringify({ error: "Falha ao interpretar métricas." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiData = await aiResponse.json();
    const tc = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!tc?.function?.arguments) {
      console.error("No tool call:", JSON.stringify(aiData));
      return new Response(JSON.stringify({ error: "Resposta da IA inválida." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const parsed = JSON.parse(tc.function.arguments);

    // Persist decisions
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
