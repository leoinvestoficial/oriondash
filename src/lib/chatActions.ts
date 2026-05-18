import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface OrionAction {
  type:
    | "create_task"
    | "create_approval"
    | "create_brief"
    | "log_event"
    | "update_task"
    | "create_campaign"
    | "create_funnel"
    | "create_goal"
    | "create_crm_opportunity"
    | "create_calendar_event";
  data: Record<string, any>;
  summary: string;
}

const ACTION_REGEX = /:::action\s*\n```json\n([\s\S]*?)\n```\s*\n:::/g;

export function parseActions(content: string): { cleanContent: string; actions: OrionAction[] } {
  const actions: OrionAction[] = [];
  const cleanContent = content.replace(ACTION_REGEX, (_, json) => {
    try {
      const parsed = JSON.parse(json);
      if (parsed.type && parsed.data) {
        actions.push(parsed as OrionAction);
        return ""; // Remove action block from visible text
      }
    } catch { /* ignore parse errors */ }
    return "";
  });
  return { cleanContent: cleanContent.trim(), actions };
}

export async function executeAction(action: OrionAction, userId: string, companyDnaId?: string): Promise<boolean> {
  try {
    switch (action.type) {
      case "create_task": {
        // Try to find assignee by name if provided
        let assigneeId = null;
        if (action.data.assignee_name && companyDnaId) {
          const { data: members } = await supabase
            .from("team_members")
            .select("id, name")
            .eq("company_dna_id", companyDnaId);
          const match = members?.find(m => 
            m.name.toLowerCase().includes(action.data.assignee_name.toLowerCase())
          );
          if (match) assigneeId = match.id;
        }

        const { error } = await supabase.from("tasks").insert({
          user_id: userId,
          company_dna_id: companyDnaId || null,
          title: action.data.title,
          description: action.data.description || null,
          assignee_id: assigneeId,
          due_date: action.data.due_date || null,
          priority: action.data.priority || "medium",
          category: action.data.category || null,
          created_by_ai: true,
          ai_context: action.data.ai_context || null,
        });
        if (error) throw error;
        toast.success(`✅ Tarefa criada: ${action.data.title}`);
        return true;
      }

      case "create_approval": {
        const { error } = await supabase.from("approvals").insert({
          user_id: userId,
          title: action.data.title,
          description: action.data.description,
          reasoning: action.data.reasoning || "",
          impact: action.data.impact || "",
          level: action.data.level || "simple",
          category: action.data.category || "campaign",
          supporting_data: action.data.supporting_data || [],
        });
        if (error) throw error;
        toast.success(`📋 Aprovação criada: ${action.data.title}`);
        return true;
      }

      case "create_brief": {
        const { error } = await supabase.from("creative_briefs").insert({
          user_id: userId,
          title: action.data.title,
          brief_type: action.data.brief_type || "creative",
          content: action.data.content || {},
          campaign_id: action.data.campaign_id || null,
        });
        if (error) throw error;
        toast.success(`🎨 Brief criado: ${action.data.title}`);
        return true;
      }

      case "log_event": {
        const { error } = await supabase.from("business_events").insert({
          user_id: userId,
          company_dna_id: companyDnaId || null,
          event_type: action.data.event_type || "insight",
          title: action.data.title,
          description: action.data.description || null,
          event_data: action.data.event_data || {},
          source: "orion_chat",
        });
        if (error) throw error;
        toast.success(`📝 Evento registrado: ${action.data.title}`);
        return true;
      }

      case "update_task": {
        const updates: { status?: string; priority?: string; due_date?: string } = {};
        if (action.data.status) updates.status = action.data.status;
        if (action.data.priority) updates.priority = action.data.priority;
        if (action.data.due_date) updates.due_date = action.data.due_date;

        if (action.data.task_id) {
          const { error } = await supabase.from("tasks").update(updates).eq("id", action.data.task_id);
          if (error) throw error;
        } else if (action.data.title) {
          const { data: tasks } = await supabase
            .from("tasks")
            .select("id, title")
            .eq("user_id", userId)
            .ilike("title", `%${action.data.title}%`)
            .limit(1);
          if (tasks?.[0]) {
            const { error } = await supabase.from("tasks").update(updates).eq("id", tasks[0].id);
            if (error) throw error;
          }
        }
        toast.success(`✏️ Tarefa atualizada`);
        return true;
      }

      case "create_campaign": {
        const { error } = await supabase.from("campaigns").insert({
          user_id: userId,
          name: action.data.name || action.data.title,
          platform: action.data.platform || "meta",
          objective: action.data.objective || "awareness",
          status: action.data.status || "draft",
          budget_daily: action.data.budget_daily ? Number(action.data.budget_daily) : null,
          budget_total: action.data.budget_total ? Number(action.data.budget_total) : null,
          start_date: action.data.start_date || null,
          end_date: action.data.end_date || null,
        });
        if (error) throw error;
        toast.success(`📢 Campanha criada: ${action.data.name || action.data.title}`);
        return true;
      }

      case "create_funnel": {
        // marketing_funnels table — no funnel_type column, use metadata
        const { data: funnel, error: funnelError } = await supabase
          .from("marketing_funnels" as never)
          .insert({
            user_id: userId,
            name: action.data.name || action.data.title,
            description: action.data.description || null,
            status: action.data.status || "draft",
            metadata: { funnel_type: action.data.funnel_type || "marketing" },
          })
          .select("id")
          .single();
        if (funnelError) throw funnelError;

        // Insert nodes/steps if provided
        const funnelId = (funnel as { id: string } | null)?.id;
        if (Array.isArray(action.data.steps) && funnelId) {
          const nodes = action.data.steps.map((step: { type?: string; title: string; description?: string; data?: Record<string, unknown> }, idx: number) => ({
            user_id: userId,
            funnel_id: funnelId,
            node_type: step.type || "step",
            title: step.title,
            description: step.description || null,
            step_order: idx,
            position: { x: 0, y: idx * 150 },
            data: step.data || {},
            status: "draft",
          }));
          await supabase.from("funnel_nodes").insert(nodes);
        }
        toast.success(`🔀 Funil criado: ${action.data.name || action.data.title}`);
        return true;
      }

      case "create_goal": {
        // strategic_goals table — columns: goal_type, time_horizon, owner_role (no priority/deadline/category)
        const { error } = await supabase
          .from("strategic_goals" as never)
          .insert({
            user_id: userId,
            title: action.data.title,
            description: action.data.description || null,
            goal_type: action.data.category || action.data.goal_type || "growth",
            target_metric: action.data.target_metric || null,
            target_value: action.data.target_value ? Number(action.data.target_value.replace(/[^\d.]/g, "")) : null,
            current_value: action.data.current_value ? Number(action.data.current_value.replace(/[^\d.]/g, "")) : null,
            time_horizon: action.data.time_horizon || "quarter",
            status: action.data.status || "active",
            owner_role: action.data.owner_role || null,
          });
        if (error) throw error;
        toast.success(`🎯 Meta criada: ${action.data.title}`);
        return true;
      }

      case "create_crm_opportunity": {
        // crm_opportunities — columns: rationale, recommended_channel, expected_revenue, expected_margin (no priority/description)
        const { error } = await supabase.from("crm_opportunities").insert({
          user_id: userId,
          opportunity_type: action.data.opportunity_type || "repurchase",
          title: action.data.title,
          rationale: action.data.description || action.data.rationale || null,
          expected_revenue: action.data.expected_revenue ? Number(action.data.expected_revenue) : 0,
          expected_margin: 0,
          recommended_channel: action.data.recommended_channel || null,
          recommended_message: action.data.recommended_message || null,
          status: "open",
        });
        if (error) throw error;
        toast.success(`💡 Oportunidade CRM criada: ${action.data.title}`);
        return true;
      }

      case "create_calendar_event": {
        // content_calendar columns: channel (not platform), copy_text (not copy), hashtags as TEXT
        const { error } = await supabase.from("content_calendar").insert({
          user_id: userId,
          title: action.data.title,
          content_type: action.data.content_type || "post",
          channel: action.data.platform || action.data.channel || "instagram",
          scheduled_date: action.data.scheduled_date || new Date().toISOString().split("T")[0],
          status: "draft",
          campaign_id: action.data.campaign_id || null,
          copy_text: action.data.copy || action.data.copy_text || null,
          hashtags: Array.isArray(action.data.hashtags)
            ? action.data.hashtags.join(" ")
            : action.data.hashtags || null,
          ai_generated: true,
        });
        if (error) throw error;
        toast.success(`📅 Conteúdo agendado: ${action.data.title}`);
        return true;
      }

      default:
        return false;
    }
  } catch (e) {
    console.error("Action execution error:", e);
    toast.error(`Erro ao executar ação: ${action.summary || action.type}`);
    return false;
  }
}
