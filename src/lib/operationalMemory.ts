import { supabase } from "@/integrations/supabase/client";

export type OperationalMemoryType =
  | "decision_learning"
  | "orchestration_learning"
  | "campaign_learning"
  | "approval_learning"
  | "publication_learning"
  | "budget_learning"
  | "creative_learning"
  | "funnel_learning"
  | "general_learning"
  | "winning_creative"
  | "failed_creative"
  | "winning_copy"
  | "failed_copy"
  | "audience_learning"
  | "offer_learning"
  | "agency_learning";

export interface OperationalMemoryEvent {
  company_id?: string | null;
  user_id: string;
  memory_type: OperationalMemoryType;
  title: string;
  description?: string;
  source_type: string;
  source_id?: string | null;
  campaign_id?: string | null;
  creative_id?: string | null;
  audience_id?: string | null;
  offer_id?: string | null;
  channel?: string | null;
  result_metric?: string | null;
  result_value?: number | null;
  confidence_score?: number;
  tags?: string[];
}

export async function createOperationalMemoryFromEvent(input: OperationalMemoryEvent) {
  if (!input.source_id) return { skipped: true, available: true };

  const existing = await (supabase as any)
    .from("operational_memory")
    .select("id")
    .eq("user_id", input.user_id)
    .eq("source_type", input.source_type)
    .eq("source_id", input.source_id)
    .eq("memory_type", input.memory_type)
    .maybeSingle();

  if (existing.error) return { skipped: true, available: false };
  if (existing.data?.id) return { skipped: true, available: true };

  const { error } = await (supabase as any).from("operational_memory").insert({
    company_id: input.company_id ?? null,
    user_id: input.user_id,
    memory_type: input.memory_type,
    title: input.title,
    description: input.description ?? null,
    source_type: input.source_type,
    source_id: input.source_id,
    campaign_id: input.campaign_id ?? null,
    creative_id: input.creative_id ?? null,
    audience_id: input.audience_id ?? null,
    offer_id: input.offer_id ?? null,
    channel: input.channel ?? null,
    result_metric: input.result_metric ?? null,
    result_value: input.result_value ?? null,
    confidence_score: input.confidence_score ?? 65,
    tags: input.tags ?? [],
    created_by: input.user_id,
  });

  if (error) return { skipped: true, available: false };
  return { skipped: false, available: true };
}
