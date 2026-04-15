import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface OrionAction {
  type: "create_task" | "create_approval" | "create_brief" | "log_event" | "update_task";
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

      default:
        return false;
    }
  } catch (e) {
    console.error("Action execution error:", e);
    toast.error(`Erro ao executar ação: ${action.summary || action.type}`);
    return false;
  }
}
