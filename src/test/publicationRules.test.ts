import { describe, expect, it } from "vitest";
import {
  canTransitionPublicationStatus,
  requiresApprovalForPolicy,
  validatePublicationSchedule,
} from "@/lib/publicationRules";

describe("publication rules", () => {
  it("blocks scheduling before approval when approval is required", () => {
    const result = validatePublicationSchedule({
      status: "awaiting_approval",
      scheduledAt: "2026-05-15T12:00:00.000Z",
      requiresApproval: true,
      now: new Date("2026-05-14T12:00:00.000Z"),
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toContain("aprovação");
  });

  it("blocks scheduling in the past", () => {
    const result = validatePublicationSchedule({
      status: "approved",
      scheduledAt: "2026-05-13T12:00:00.000Z",
      requiresApproval: true,
      now: new Date("2026-05-14T12:00:00.000Z"),
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toContain("futuro");
  });

  it("blocks scheduling outside allowed windows", () => {
    const result = validatePublicationSchedule({
      status: "approved",
      scheduledAt: "2026-05-15T22:00:00.000Z",
      requiresApproval: true,
      policy: { allowed_time_windows: [{ start: "09:00", end: "18:00" }] },
      now: new Date("2026-05-14T12:00:00.000Z"),
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toContain("janela");
  });

  it("blocks daily limit", () => {
    const result = validatePublicationSchedule({
      status: "approved",
      scheduledAt: "2026-05-15T12:00:00.000Z",
      requiresApproval: true,
      policy: { max_daily_posts: 2 },
      dailyScheduledCount: 2,
      now: new Date("2026-05-14T12:00:00.000Z"),
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toContain("Limite diário");
  });

  it("requires approval for paid publications regardless of policy", () => {
    expect(requiresApprovalForPolicy("meta_ads", "paid_ad", "partial_automation", { requires_approval: false })).toBe(true);
  });

  it("does not allow invalid transitions", () => {
    expect(canTransitionPublicationStatus("draft", "published")).toBe(false);
    expect(canTransitionPublicationStatus("awaiting_approval", "scheduled")).toBe(false);
    expect(canTransitionPublicationStatus("approved", "scheduled")).toBe(true);
  });
});
