import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
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

    const { decision_id } = await req.json();
    if (!decision_id) {
      return new Response(JSON.stringify({ error: "decision_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: decision, error: dErr } = await supabase
      .from("ai_decisions")
      .select("*, campaigns(name, platform)")
      .eq("id", decision_id)
      .eq("user_id", userId)
      .maybeSingle();

    if (dErr || !decision) {
      return new Response(JSON.stringify({ error: "Decisão não encontrada." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (decision.status !== "pending") {
      return new Response(JSON.stringify({ error: `Decisão já está ${decision.status}.` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const result: Record<string, any> = { steps: [] };
    const payload = decision.payload || {};
    const campaignName = (decision as any).campaigns?.name || "campanha";

    switch (decision.action_type) {
      case "scale_budget":
      case "adjust_bid": {
        if (decision.campaign_id && payload.new_budget) {
          const { error } = await supabase
            .from("campaigns")
            .update({ budget_daily: payload.new_budget })
            .eq("id", decision.campaign_id)
            .eq("user_id", userId);
          if (error) throw error;
          result.steps.push(`Orçamento diário atualizado para R$${payload.new_budget}`);
        }
        await supabase.from("tasks").insert({
          user_id: userId,
          title: `Confirmar na plataforma: ${decision.title}`,
          description: `${decision.rationale}\n\nEvidência: ${decision.evidence}\nImpacto esperado: ${decision.expected_impact}`,
          priority: decision.severity === "alta" ? "high" : "medium",
          status: "todo",
          category: "performance",
          created_by_ai: true,
          ai_context: `Decision ${decision.id}`,
        });
        result.steps.push("Tarefa criada para o time aplicar na plataforma de ads.");
        break;
      }
      case "pause_campaign": {
        if (decision.campaign_id) {
          const { error } = await supabase
            .from("campaigns")
            .update({ status: "paused" })
            .eq("id", decision.campaign_id)
            .eq("user_id", userId);
          if (error) throw error;
          result.steps.push(`Campanha "${campaignName}" marcada como pausada.`);
        }
        await supabase.from("tasks").insert({
          user_id: userId,
          title: `Pausar imediatamente: ${campaignName}`,
          description: `${decision.rationale}\n\nEvidência: ${decision.evidence}`,
          priority: "high",
          status: "todo",
          category: "performance",
          created_by_ai: true,
          ai_context: `Decision ${decision.id}`,
        });
        result.steps.push("Tarefa de pausa enviada ao time.");
        break;
      }
      case "refresh_creative":
      case "generate_brief": {
        const { data: brief, error: bErr } = await supabase
          .from("creative_briefs")
          .insert({
            user_id: userId,
            campaign_id: decision.campaign_id,
            title: decision.title,
            brief_type: decision.action_type === "refresh_creative" ? "creative_refresh" : "general",
            status: "pending",
            content: {
              focus: payload.brief_focus || decision.rationale,
              evidence: decision.evidence,
              expected_impact: decision.expected_impact,
              steps: payload.task_steps || [],
              source_decision: decision.id,
            },
          })
          .select()
          .single();
        if (bErr) throw bErr;
        result.brief_id = brief.id;
        result.steps.push("Brief criativo gerado no Estúdio.");

        await supabase.from("tasks").insert({
          user_id: userId,
          title: decision.title,
          description: [
            decision.rationale,
            "",
            payload.task_steps?.length ? "Passos:\n" + payload.task_steps.map((s: string, i: number) => `${i + 1}. ${s}`).join("\n") : "",
          ].filter(Boolean).join("\n"),
          priority: decision.severity === "alta" ? "high" : "medium",
          status: "todo",
          category: payload.task_assignee_role || "creative",
          created_by_ai: true,
          ai_context: `Decision ${decision.id} → Brief ${brief.id}`,
        });
        result.steps.push("Tarefa atribuída ao time criativo.");
        break;
      }
      case "test_audience":
      case "create_team_task": {
        const { data: task, error: tErr } = await supabase
          .from("tasks")
          .insert({
            user_id: userId,
            title: decision.title,
            description: [
              decision.rationale,
              `\nEvidência: ${decision.evidence}`,
              `Impacto esperado: ${decision.expected_impact}`,
              payload.task_steps?.length ? "\nPassos:\n" + payload.task_steps.map((s: string, i: number) => `${i + 1}. ${s}`).join("\n") : "",
            ].filter(Boolean).join("\n"),
            priority: decision.severity === "alta" ? "high" : decision.severity === "baixa" ? "low" : "medium",
            status: "todo",
            category: payload.task_assignee_role || "marketing",
            created_by_ai: true,
            ai_context: `Decision ${decision.id}`,
          })
          .select()
          .single();
        if (tErr) throw tErr;
        result.task_id = task.id;
        result.steps.push("Tarefa criada e atribuída ao time.");
        break;
      }
      case "alert_only":
      default: {
        result.steps.push("Decisão registrada como alerta. Nenhuma ação automática aplicada.");
        break;
      }
    }

    const { error: updErr } = await supabase
      .from("ai_decisions")
      .update({ status: "applied", applied_at: new Date().toISOString(), result })
      .eq("id", decision.id);
    if (updErr) throw updErr;

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("apply-decision error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
