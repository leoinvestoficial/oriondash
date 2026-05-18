import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface OutcomeRecord {
  id: string;
  summary: string | null;
  expected_metric: string | null;
  observed_metric: string | null;
  outcome_status: string;
  notes: string | null;
}

export interface OutcomeLearningSummary {
  validatedCount: number;
  invalidatedCount: number;
  pendingReviewCount: number;
  latestValidated: OutcomeRecord | null;
  latestInvalidated: OutcomeRecord | null;
  hasData: boolean;
}

const emptySummary: OutcomeLearningSummary = {
  validatedCount: 0,
  invalidatedCount: 0,
  pendingReviewCount: 0,
  latestValidated: null,
  latestInvalidated: null,
  hasData: false,
};

export const useOutcomeLearningSummary = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<OutcomeLearningSummary>(emptySummary);
  const [loading, setLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    if (!user) {
      setSummary(emptySummary);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("decision_outcomes" as never)
      .select("id, summary, expected_metric, observed_metric, outcome_status, notes")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const outcomes = (data as OutcomeRecord[] | null) ?? [];
    const validated = outcomes.filter((item) => item.outcome_status === "validated");
    const invalidated = outcomes.filter((item) => item.outcome_status === "invalidated");
    const pending = outcomes.filter((item) => item.outcome_status === "pending_review");

    setSummary({
      validatedCount: validated.length,
      invalidatedCount: invalidated.length,
      pendingReviewCount: pending.length,
      latestValidated: validated[0] ?? null,
      latestInvalidated: invalidated[0] ?? null,
      hasData: outcomes.length > 0,
    });
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { summary, loading, refetch: fetchSummary };
};
