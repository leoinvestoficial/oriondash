import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyDNA } from "@/hooks/useCompanyDNA";
import { toast } from "sonner";
import { createOperationalMemoryFromEvent } from "@/lib/operationalMemory";

export type OrchestrationStatus =
  | "detected"
  | "prepared"
  | "awaiting_approval"
  | "approved"
  | "in_progress"
  | "executed"
  | "monitoring"
  | "completed"
  | "rejected"
  | "ignored";

export type AutonomyLevel = "insight_only" | "assisted_execution" | "partial_automation" | "limited_autonomy";

export interface ActionOrchestration {
  id: string;
  company_id: string | null;
  user_id: string;
  title: string;
  description: string | null;
  source_type: string;
  source_id: string | null;
  detected_signal: string | null;
  hypothesis: string | null;
  recommended_action: string | null;
  financial_impact_estimate: string | null;
  urgency: "alta" | "media" | "baixa";
  confidence_score: number;
  autonomy_level: AutonomyLevel;
  status: OrchestrationStatus;
  assigned_to: string | null;
  due_date: string | null;
  created_artifacts: unknown[];
  related_campaign_id: string | null;
  related_task_id: string | null;
  related_approval_id: string | null;
  result_summary: string | null;
  learning_summary: string | null;
  rejection_reason?: string | null;
  data_origin?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateOrchestrationInput {
  title: string;
  description?: string;
  source_type?: string;
  source_id?: string;
  detected_signal?: string;
  hypothesis?: string;
  recommended_action?: string;
  financial_impact_estimate?: string;
  urgency?: "alta" | "media" | "baixa";
  confidence_score?: number;
  autonomy_level?: AutonomyLevel;
  status?: OrchestrationStatus;
  related_campaign_id?: string | null;
  related_task_id?: string | null;
  related_approval_id?: string | null;
  data_origin?: string;
}

export const useActionOrchestrations = () => {
  const { user } = useAuth();
  const { dna } = useCompanyDNA();
  const [orchestrations, setOrchestrations] = useState<ActionOrchestration[]>([]);
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("action_orchestrations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      setAvailable(false);
      setOrchestrations([]);
    } else {
      setAvailable(true);
      setOrchestrations((data as ActionOrchestration[]) || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const create = async (input: CreateOrchestrationInput) => {
    if (!user) return null;
    const payload = {
      company_id: dna?.id ?? null,
      user_id: user.id,
      title: input.title,
      description: input.description ?? null,
      source_type: input.source_type ?? "central_orion",
      source_id: input.source_id ?? null,
      detected_signal: input.detected_signal ?? null,
      hypothesis: input.hypothesis ?? null,
      recommended_action: input.recommended_action ?? null,
      financial_impact_estimate: input.financial_impact_estimate ?? null,
      urgency: input.urgency ?? "media",
      confidence_score: input.confidence_score ?? 65,
      autonomy_level: input.autonomy_level ?? "assisted_execution",
      status: input.status ?? "prepared",
      related_campaign_id: input.related_campaign_id ?? null,
      related_task_id: input.related_task_id ?? null,
      related_approval_id: input.related_approval_id ?? null,
      data_origin: input.data_origin ?? "inferred",
    };

    const { data, error } = await (supabase as any)
      .from("action_orchestrations")
      .insert(payload)
      .select()
      .single();

    if (error) {
      setAvailable(false);
      toast.error("Orquestração ainda não está disponível no banco remoto");
      return null;
    }
    await createOperationalMemoryFromEvent({
      company_id: dna?.id ?? null,
      user_id: user.id,
      memory_type: "orchestration_learning",
      title: "Orquestração preparada",
      description: `O Orion preparou a orquestração: ${input.title}.`,
      source_type: input.source_type ?? "central_orion",
      source_id: (data as ActionOrchestration).id,
      campaign_id: input.related_campaign_id ?? null,
      confidence_score: input.confidence_score ?? 65,
      tags: ["orchestration", input.urgency ?? "media"],
    });
    toast.success("Orquestração preparada");
    await fetchAll();
    return data as ActionOrchestration;
  };

  const updateStatus = async (id: string, status: OrchestrationStatus, rejectionReason?: string) => {
    const { error } = await (supabase as any)
      .from("action_orchestrations")
      .update({ status, rejection_reason: rejectionReason ?? null })
      .eq("id", id);

    if (error) {
      toast.error("Erro ao atualizar orquestração");
      return;
    }
    if (user && (status === "ignored" || status === "completed" || status === "in_progress")) {
      await createOperationalMemoryFromEvent({
        company_id: dna?.id ?? null,
        user_id: user.id,
        memory_type: "orchestration_learning",
        title: status === "ignored" ? "Orquestração ignorada" : "Status de orquestração atualizado",
        description: status === "ignored"
          ? `A orquestração foi ignorada. Motivo: ${rejectionReason || "não informado"}.`
          : `A orquestração mudou para ${status}.`,
        source_type: "action_orchestration",
        source_id: id,
        tags: ["orchestration", status],
      });
    }
    toast.success(status === "ignored" ? "Orquestração ignorada" : "Status atualizado");
    await fetchAll();
  };

  const ignore = (id: string, reason?: string) => updateStatus(id, "ignored", reason);

  const createTask = async (orchestration: ActionOrchestration) => {
    if (!user) return null;
    const priorityMap: Record<ActionOrchestration["urgency"], string> = { alta: "high", media: "medium", baixa: "low" };
    const due = new Date();
    due.setDate(due.getDate() + (orchestration.urgency === "alta" ? 1 : orchestration.urgency === "media" ? 3 : 5));
    const description = [
      `Motivo: ${orchestration.hypothesis || orchestration.description || "Orquestração preparada pelo Orion."}`,
      `Evidência: ${orchestration.detected_signal || "Sinal operacional registrado."}`,
      `Impacto financeiro: ${orchestration.financial_impact_estimate || "Impacto em validação."}`,
      `Origem: ${orchestration.source_type}${orchestration.source_id ? `/${orchestration.source_id}` : ""}`,
      `Orchestration ID: ${orchestration.id}`,
    ].join("\n\n");

    const { data, error } = await supabase.from("tasks").insert({
      user_id: user.id,
      company_dna_id: dna?.id ?? orchestration.company_id,
      title: orchestration.recommended_action || orchestration.title,
      description,
      status: "todo",
      priority: priorityMap[orchestration.urgency],
      due_date: orchestration.due_date || due.toISOString().split("T")[0],
      category: "orchestration",
      created_by_ai: true,
      ai_context: JSON.stringify({ orchestration_id: orchestration.id, source_type: orchestration.source_type, source_id: orchestration.source_id }),
    }).select("id").single();

    if (error) {
      toast.error("Erro ao criar tarefa da orquestração");
      return null;
    }

    await (supabase as any)
      .from("action_orchestrations")
      .update({ related_task_id: data.id, status: "in_progress" })
      .eq("id", orchestration.id);

    await createOperationalMemoryFromEvent({
      company_id: dna?.id ?? orchestration.company_id,
      user_id: user.id,
      memory_type: "orchestration_learning",
      title: "Orquestração transformada em tarefa",
      description: `A orquestração "${orchestration.title}" virou uma tarefa de execução.`,
      source_type: "action_orchestration",
      source_id: orchestration.id,
      campaign_id: orchestration.related_campaign_id,
      confidence_score: orchestration.confidence_score,
      tags: ["task_created", "assisted_execution"],
    });

    toast.success("Tarefa criada a partir da orquestração");
    await fetchAll();
    return data.id as string;
  };

  const requestApproval = async (orchestration: ActionOrchestration) => {
    if (!user) return null;
    const approvalType = orchestration.recommended_action?.toLowerCase().includes("verba")
      ? "budget"
      : orchestration.recommended_action?.toLowerCase().includes("criativo")
        ? "creative"
        : "strategy";

    const extendedPayload = {
      user_id: user.id,
      company_id: dna?.id ?? orchestration.company_id,
      title: `Aprovar: ${orchestration.title}`,
      description: orchestration.description || orchestration.recommended_action || orchestration.title,
      reasoning: orchestration.hypothesis || "Orquestração preparada pelo Orion.",
      impact: orchestration.financial_impact_estimate || "Impacto em validação.",
      level: orchestration.urgency === "alta" ? "priority" : "simple",
      category: approvalType,
      approval_type: approvalType,
      related_entity_type: "action_orchestration",
      related_entity_id: orchestration.id,
      requested_by: user.id,
      status: "pending",
      supporting_data: {
        orchestration_id: orchestration.id,
        source_type: orchestration.source_type,
        source_id: orchestration.source_id,
        confidence_score: orchestration.confidence_score,
        autonomy_level: orchestration.autonomy_level,
      },
    };

    let { data, error } = await (supabase as any).from("approvals").insert(extendedPayload).select("id").single();
    if (error) {
      const basePayload = {
        user_id: user.id,
        title: extendedPayload.title,
        description: extendedPayload.description,
        reasoning: extendedPayload.reasoning,
        impact: extendedPayload.impact,
        level: extendedPayload.level,
        category: approvalType,
        status: "pending",
        supporting_data: extendedPayload.supporting_data,
      };
      const fallback = await supabase.from("approvals").insert(basePayload).select("id").single();
      data = fallback.data;
      error = fallback.error;
    }

    if (error || !data?.id) {
      toast.error("Erro ao solicitar aprovação");
      return null;
    }

    await (supabase as any)
      .from("action_orchestrations")
      .update({ related_approval_id: data.id, status: "awaiting_approval" })
      .eq("id", orchestration.id);

    await createOperationalMemoryFromEvent({
      company_id: dna?.id ?? orchestration.company_id,
      user_id: user.id,
      memory_type: "approval_learning",
      title: "Orquestração enviada para aprovação",
      description: `A orquestração "${orchestration.title}" agora aguarda aprovação.`,
      source_type: "action_orchestration",
      source_id: orchestration.id,
      campaign_id: orchestration.related_campaign_id,
      confidence_score: orchestration.confidence_score,
      tags: ["approval_requested", approvalType],
    });

    toast.success("Aprovação solicitada");
    await fetchAll();
    return data.id as string;
  };

  return { orchestrations, loading, available, create, updateStatus, ignore, createTask, requestApproval, refetch: fetchAll };
};
