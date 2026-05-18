import type { PublicationAutonomyLevel, PublicationChannel, PublicationStatus, PublicationType } from "@/lib/publicationProviders";

export interface PublicationTimeWindow {
  start: string;
  end: string;
}

export interface PublicationPolicyLike {
  channel?: PublicationChannel;
  publication_type?: PublicationType;
  autonomy_level_allowed?: PublicationAutonomyLevel;
  requires_approval?: boolean;
  max_daily_posts?: number | null;
  max_daily_budget?: number | null;
  allowed_time_windows?: PublicationTimeWindow[] | unknown[];
  blocked_words?: string[];
  required_brand_checks?: string[];
}

export const VALID_PUBLICATION_TRANSITIONS: Record<PublicationStatus, PublicationStatus[]> = {
  draft: ["awaiting_approval", "canceled"],
  awaiting_approval: ["approved", "canceled"],
  approved: ["scheduled", "canceled"],
  scheduled: ["publishing", "canceled"],
  publishing: ["published", "failed"],
  published: [],
  failed: ["draft", "canceled"],
  canceled: [],
  expired: ["draft", "canceled"],
};

export const isPaidPublication = (channel: PublicationChannel, publicationType: PublicationType) =>
  publicationType === "paid_ad" || channel === "meta_ads" || channel === "google_ads";

export const requiresApprovalForPolicy = (
  channel: PublicationChannel,
  publicationType: PublicationType,
  autonomy: PublicationAutonomyLevel,
  policy?: PublicationPolicyLike,
) => {
  if (isPaidPublication(channel, publicationType)) return true;
  if (policy?.requires_approval != null) return Boolean(policy.requires_approval);
  return autonomy === "insight_only" || autonomy === "assisted_execution";
};

export const canTransitionPublicationStatus = (from: PublicationStatus, to: PublicationStatus) =>
  VALID_PUBLICATION_TRANSITIONS[from]?.includes(to) ?? false;

const timeToMinutes = (value: string) => {
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
};

export const isInsideAllowedWindow = (scheduledAt: Date, windows?: PublicationPolicyLike["allowed_time_windows"]) => {
  const parsedWindows = (Array.isArray(windows) ? windows : []) as PublicationTimeWindow[];
  if (parsedWindows.length === 0) return true;
  const currentMinutes = scheduledAt.getHours() * 60 + scheduledAt.getMinutes();

  return parsedWindows.some((window) => {
    const start = timeToMinutes(window.start);
    const end = timeToMinutes(window.end);
    if (start == null || end == null) return false;
    if (start <= end) return currentMinutes >= start && currentMinutes <= end;
    return currentMinutes >= start || currentMinutes <= end;
  });
};

export interface ScheduleValidationInput {
  status: PublicationStatus;
  scheduledAt: string | null;
  requiresApproval: boolean;
  policy?: PublicationPolicyLike;
  dailyScheduledCount?: number;
  now?: Date;
}

export function validatePublicationSchedule(input: ScheduleValidationInput): { ok: boolean; reason?: string } {
  if (input.requiresApproval && input.status !== "approved") {
    return { ok: false, reason: "A publicação precisa de aprovação antes de ser agendada." };
  }
  if (!canTransitionPublicationStatus(input.status, "scheduled")) {
    return { ok: false, reason: `Transição inválida: ${input.status} -> scheduled.` };
  }
  if (!input.scheduledAt) {
    return { ok: false, reason: "Defina um horário de agendamento." };
  }

  const scheduled = new Date(input.scheduledAt);
  const now = input.now ?? new Date();
  if (Number.isNaN(scheduled.getTime())) return { ok: false, reason: "Horário de agendamento inválido." };
  if (scheduled <= now) return { ok: false, reason: "O agendamento precisa estar no futuro." };
  if (!isInsideAllowedWindow(scheduled, input.policy?.allowed_time_windows)) {
    return { ok: false, reason: "Horário fora da janela permitida pela política." };
  }
  const maxDailyPosts = input.policy?.max_daily_posts;
  if (maxDailyPosts != null && maxDailyPosts > 0 && (input.dailyScheduledCount ?? 0) >= maxDailyPosts) {
    return { ok: false, reason: "Limite diário de publicações atingido para esta política." };
  }
  return { ok: true };
}

export const parseTimeWindows = (value: string): PublicationTimeWindow[] =>
  value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [start, end] = entry.split("-").map((part) => part.trim());
      return { start, end };
    })
    .filter((entry) => timeToMinutes(entry.start) != null && timeToMinutes(entry.end) != null);

export const formatTimeWindows = (windows?: unknown[]) =>
  ((windows || []) as PublicationTimeWindow[]).map((window) => `${window.start}-${window.end}`).join(", ");
