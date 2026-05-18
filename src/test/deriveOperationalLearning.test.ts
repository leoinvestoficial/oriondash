import { describe, expect, it } from "vitest";
import { deriveOperationalLearning } from "@/lib/deriveOperationalLearning";

const now = new Date("2026-05-13T12:00:00.000Z");

describe("deriveOperationalLearning", () => {
  it("derives approval blockers from pending approvals", () => {
    const learnings = deriveOperationalLearning({
      now,
      approvals: [
        { id: "a1", title: "Aprovar criativo 1", status: "pending", category: "creative" },
        { id: "a2", title: "Aprovar verba", status: "pending", category: "budget" },
      ],
    });

    expect(learnings.some((learning) => learning.raw_data.learning_type === "approval_blocker")).toBe(true);
    expect(learnings.find((learning) => learning.raw_data.learning_type === "approval_blocker")?.raw_data.source_count).toBe(2);
  });

  it("derives finance-target warning when margin or break-even is missing", () => {
    const learnings = deriveOperationalLearning({
      now,
      finance: { targetCpa: 35, targetRoas: 2, estimatedMargin: null, breakEvenCpa: null },
    });

    expect(learnings.map((learning) => learning.raw_data.learning_type)).toContain("finance_targets_missing");
  });

  it("deduplicates learnings by title and period", () => {
    const learnings = deriveOperationalLearning({
      now,
      approvals: [
        { id: "a1", title: "Aprovar criativo", status: "pending", category: "creative" },
      ],
      finance: { targetCpa: null, targetRoas: null, estimatedMargin: null, breakEvenCpa: null },
    });

    const keys = learnings.map((learning) => `${learning.title}-${learning.raw_data.period_start}-${learning.raw_data.period_end}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
