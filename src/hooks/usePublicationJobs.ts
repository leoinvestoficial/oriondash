import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyDNA } from "@/hooks/useCompanyDNA";
import { toast } from "sonner";
import { createOperationalMemoryFromEvent } from "@/lib/operationalMemory";
import {
  getPublicationProvider,
  type PublicationAutonomyLevel,
  type PublicationChannel,
  type PublicationStatus,
  type PublicationType,
} from "@/lib/publicationProviders";
import {
  requiresApprovalForPolicy,
  validatePublicationSchedule,
  type PublicationPolicyLike,
} from "@/lib/publicationRules";

export interface PublicationJob {
  id: string;
  company_id: string | null;
  user_id: string;
  source_type: string;
  source_id: string | null;
  orchestration_id: string | null;
  campaign_id: string | null;
  approval_id: string | null;
  channel: PublicationChannel;
  publication_type: PublicationType;
  title: string;
  copy: string | null;
  caption: string | null;
  creative_asset_url: string | null;
  creative_asset_id: string | null;
  scheduled_at: string | null;
  published_at: string | null;
  status: PublicationStatus;
  autonomy_level: PublicationAutonomyLevel;
  requires_approval: boolean;
  approved_by: string | null;
  approved_at: string | null;
  external_platform: string | null;
  external_post_id: string | null;
  external_campaign_id: string | null;
  error_message: string | null;
  policy_snapshot: Record<string, unknown>;
  data_origin: "real" | "imported" | "inferred" | "estimated" | "demo" | "mock" | "unknown";
  created_at: string;
  updated_at: string;
}

export interface PublicationPolicy {
  id: string;
  company_id: string | null;
  channel: PublicationChannel;
  publication_type: PublicationType;
  autonomy_level_allowed: PublicationAutonomyLevel;
  requires_approval: boolean;
  approval_role_required: string | null;
  max_daily_posts: number | null;
  max_daily_budget: number | null;
  allowed_time_windows: unknown[];
  blocked_words: string[];
  required_brand_checks: string[];
  created_by?: string;
}

export interface CreatePublicationJobInput {
  source_type: string;
  source_id?: string | null;
  orchestration_id?: string | null;
  campaign_id?: string | null;
  channel: PublicationChannel;
  publication_type: PublicationType;
  title: string;
  copy?: string | null;
  caption?: string | null;
  creative_asset_url?: string | null;
  creative_asset_id?: string | null;
  scheduled_at?: string | null;
  autonomy_level?: PublicationAutonomyLevel;
  requires_approval?: boolean;
  data_origin?: PublicationJob["data_origin"];
}

const statusLabel: Record<PublicationStatus, string> = {
  draft: "rascunho",
  awaiting_approval: "aguardando aprovação",
  approved: "aprovada",
  scheduled: "agendada",
  publishing: "publicando",
  published: "publicada",
  failed: "falhou",
  canceled: "cancelada",
  expired: "expirada",
};

export const usePublicationJobs = () => {
  const { user } = useAuth();
  const { dna } = useCompanyDNA();
  const [jobs, setJobs] = useState<PublicationJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(true);

  const logAction = useCallback(async (job: PublicationJob, action: string, statusFrom?: string | null, statusTo?: string | null, details?: Record<string, unknown>, errorMessage?: string | null) => {
    if (!user) return;
    await (supabase as any).from("publication_logs").insert({
      company_id: job.company_id,
      user_id: user.id,
      publication_job_id: job.id,
      action,
      status_from: statusFrom ?? null,
      status_to: statusTo ?? null,
      channel: job.channel,
      details: details ?? {},
      error_message: errorMessage ?? null,
    });
  }, [user]);

  const fetchAll = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("publication_jobs")
      .select("*")
      .eq("user_id", user.id)
      .order("scheduled_at", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      setAvailable(false);
      setJobs([]);
    } else {
      setAvailable(true);
      setJobs(((data || []) as PublicationJob[]).map((job) => ({
        ...job,
        policy_snapshot: (job.policy_snapshot || {}) as Record<string, unknown>,
      })));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const resolvePolicy = useCallback(async (input: Pick<CreatePublicationJobInput, "channel" | "publication_type" | "autonomy_level" | "requires_approval">): Promise<Partial<PublicationPolicy>> => {
    if (!user) return {};
    const { data } = await (supabase as any)
      .from("publication_policies")
      .select("*")
      .eq("created_by", user.id)
      .eq("channel", input.channel)
      .eq("publication_type", input.publication_type)
      .maybeSingle();

    if (data) return data as PublicationPolicy;
    const autonomy = input.autonomy_level ?? "assisted_execution";
    return {
      channel: input.channel,
      publication_type: input.publication_type,
      autonomy_level_allowed: autonomy,
      requires_approval: input.requires_approval ?? requiresApprovalForPolicy(input.channel, input.publication_type, autonomy),
      blocked_words: [],
      required_brand_checks: ["brand_voice", "blocked_words"],
      allowed_time_windows: [],
    };
  }, [user]);

  const getDailyScheduledCount = useCallback(async (job: PublicationJob) => {
    if (!job.scheduled_at || !user) return 0;
    const scheduled = new Date(job.scheduled_at);
    const start = new Date(scheduled);
    start.setHours(0, 0, 0, 0);
    const end = new Date(scheduled);
    end.setHours(23, 59, 59, 999);
    const { count } = await (supabase as any)
      .from("publication_jobs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("channel", job.channel)
      .gte("scheduled_at", start.toISOString())
      .lte("scheduled_at", end.toISOString())
      .in("status", ["scheduled", "publishing", "published"]);
    return count ?? 0;
  }, [user]);

  const requestApproval = useCallback(async (job: PublicationJob) => {
    if (!user) return null;
    const approvalPayload = {
      user_id: user.id,
      company_id: job.company_id,
      title: `Aprovar publicação: ${job.title}`,
      description: job.caption || job.copy || "Publicação preparada pelo Orion.",
      reasoning: `Publicação assistida para ${job.channel} criada a partir de ${job.source_type}.`,
      impact: "Autorizar publicação/agendamento com rastreabilidade e política registrada.",
      level: job.publication_type === "paid_ad" ? "priority" : "simple",
      category: "publication",
      approval_type: "publication",
      related_entity_type: "publication_job",
      related_entity_id: job.id,
      requested_by: user.id,
      status: "pending",
      supporting_data: {
        publication_job_id: job.id,
        channel: job.channel,
        publication_type: job.publication_type,
        scheduled_at: job.scheduled_at,
        autonomy_level: job.autonomy_level,
        policy_snapshot: job.policy_snapshot,
        data_origin: job.data_origin,
      },
    };

    let { data, error } = await (supabase as any).from("approvals").insert(approvalPayload).select("id").single();
    if (error) {
      const fallback = await supabase.from("approvals").insert({
        user_id: user.id,
        title: approvalPayload.title,
        description: approvalPayload.description,
        reasoning: approvalPayload.reasoning,
        impact: approvalPayload.impact,
        level: approvalPayload.level,
        category: "publication",
        status: "pending",
        supporting_data: approvalPayload.supporting_data,
      }).select("id").single();
      data = fallback.data;
      error = fallback.error;
    }
    if (error || !data?.id) {
      toast.error("Erro ao solicitar aprovação da publicação");
      return null;
    }
    await (supabase as any).from("publication_jobs").update({ approval_id: data.id, status: "awaiting_approval" }).eq("id", job.id);
    await logAction(job, "approval_requested", job.status, "awaiting_approval", { approval_id: data.id });
    return data.id as string;
  }, [logAction, user]);

  const createDraft = useCallback(async (input: CreatePublicationJobInput) => {
    if (!user) return null;
    const policy = await resolvePolicy(input);
    const autonomy = input.autonomy_level ?? "assisted_execution";
    const requiresApproval = input.requires_approval ?? requiresApprovalForPolicy(input.channel, input.publication_type, autonomy, policy);
    const status: PublicationStatus = requiresApproval ? "awaiting_approval" : "draft";
    const payload = {
      company_id: dna?.id ?? null,
      user_id: user.id,
      source_type: input.source_type,
      source_id: input.source_id ?? null,
      orchestration_id: input.orchestration_id ?? null,
      campaign_id: input.campaign_id ?? null,
      channel: input.channel,
      publication_type: input.publication_type,
      title: input.title,
      copy: input.copy ?? null,
      caption: input.caption ?? input.copy ?? null,
      creative_asset_url: input.creative_asset_url ?? null,
      creative_asset_id: input.creative_asset_id ?? null,
      scheduled_at: input.scheduled_at ?? null,
      status,
      autonomy_level: autonomy,
      requires_approval: requiresApproval,
      policy_snapshot: policy,
      data_origin: input.data_origin ?? "mock",
    };

    const { data, error } = await (supabase as any).from("publication_jobs").insert(payload).select().single();
    if (error) {
      setAvailable(false);
      toast.error("Publicação assistida ainda não está disponível no banco");
      return null;
    }

    const job = data as PublicationJob;
    const provider = getPublicationProvider(job.channel);
    const providerResult = await provider.createDraft(job);
    await (supabase as any).from("publication_jobs").update({
      external_platform: providerResult.external_platform ?? null,
      external_post_id: providerResult.external_post_id ?? null,
      data_origin: providerResult.data_origin,
    }).eq("id", job.id);

    await logAction(job, "created_draft", null, status, { provider: providerResult.external_platform, policy_snapshot: policy });
    await createOperationalMemoryFromEvent({
      company_id: dna?.id ?? null,
      user_id: user.id,
      memory_type: "publication_learning",
      title: "Publicação preparada",
      description: `O Orion preparou a publicação "${job.title}" para ${job.channel}. Status: ${statusLabel[status]}.`,
      source_type: "publication_job",
      source_id: job.id,
      campaign_id: job.campaign_id,
      confidence_score: 70,
      tags: ["publication", status, job.channel, providerResult.data_origin],
    });

    if (requiresApproval) await requestApproval(job);
    toast.success(requiresApproval ? "Publicação preparada e enviada para aprovação" : "Publicação preparada como rascunho");
    await fetchAll();
    return job;
  }, [dna?.id, fetchAll, logAction, requestApproval, resolvePolicy, user]);

  const schedule = useCallback(async (job: PublicationJob) => {
    if (!user) return;
    const policy = job.policy_snapshot as PublicationPolicyLike;
    const dailyScheduledCount = await getDailyScheduledCount(job);
    const validation = validatePublicationSchedule({
      status: job.status,
      scheduledAt: job.scheduled_at,
      requiresApproval: job.requires_approval,
      policy,
      dailyScheduledCount,
    });
    if (!validation.ok) {
      await logAction(job, "schedule_blocked", job.status, job.status, { reason: validation.reason, policy_snapshot: policy });
      toast.error(validation.reason || "Agendamento bloqueado pela política");
      return;
    }
    const provider = getPublicationProvider(job.channel);
    const result = await provider.schedule(job);
    if (!result.ok) {
      await (supabase as any).from("publication_jobs").update({ status: "failed", error_message: result.error_message ?? "Falha no provider" }).eq("id", job.id);
      await logAction(job, "schedule_failed", job.status, "failed", { provider: result.external_platform }, result.error_message);
      toast.error("Falha ao agendar publicação");
      await fetchAll();
      return;
    }
    await (supabase as any).from("publication_jobs").update({
      status: "scheduled",
      external_platform: result.external_platform ?? job.external_platform,
      external_post_id: result.external_post_id ?? job.external_post_id,
      data_origin: result.data_origin,
      error_message: null,
    }).eq("id", job.id);
    await logAction(job, "scheduled", job.status, "scheduled", { provider: result.external_platform, data_origin: result.data_origin });
    await createOperationalMemoryFromEvent({
      company_id: job.company_id,
      user_id: user.id,
      memory_type: "publication_learning",
      title: "Publicação agendada",
      description: `A publicação "${job.title}" foi agendada em modo ${result.data_origin}.`,
      source_type: "publication_job",
      source_id: job.id,
      campaign_id: job.campaign_id,
      tags: ["publication", "scheduled", job.channel, result.data_origin],
    });
    toast.success(result.data_origin === "mock" ? "Publicação agendada em modo mock" : "Publicação agendada");
    await fetchAll();
  }, [fetchAll, getDailyScheduledCount, logAction, user]);

  const cancel = useCallback(async (job: PublicationJob) => {
    const provider = getPublicationProvider(job.channel);
    const result = await provider.cancel(job);
    await (supabase as any).from("publication_jobs").update({ status: "canceled" }).eq("id", job.id);
    await logAction(job, "canceled", job.status, "canceled", { provider: result.external_platform });
    toast.success("Publicação cancelada");
    await fetchAll();
  }, [fetchAll, logAction]);

  return { jobs, loading, available, createDraft, requestApproval, schedule, cancel, refetch: fetchAll };
};
