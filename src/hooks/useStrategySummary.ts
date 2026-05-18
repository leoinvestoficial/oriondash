import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface StrategicGoalSummary {
  id: string;
  title: string;
  status: string;
  target_metric: string | null;
  target_value: number | null;
  owner_role: string | null;
}

interface MarketingHypothesisSummary {
  id: string;
  title: string;
  status: string;
  priority: string;
  channel: string | null;
  audience: string | null;
  created_by_ai: boolean;
}

interface DecisionOutcomeSummary {
  id: string;
  outcome_status: string;
}

export interface StrategySummary {
  activeGoalsCount: number;
  backlogHypothesesCount: number;
  aiHypothesesCount: number;
  pendingOutcomeReviews: number;
  topGoal: StrategicGoalSummary | null;
  topHypothesis: MarketingHypothesisSummary | null;
  hasAnyStrategyData: boolean;
}

const emptySummary: StrategySummary = {
  activeGoalsCount: 0,
  backlogHypothesesCount: 0,
  aiHypothesesCount: 0,
  pendingOutcomeReviews: 0,
  topGoal: null,
  topHypothesis: null,
  hasAnyStrategyData: false,
};

export const useStrategySummary = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<StrategySummary>(emptySummary);
  const [loading, setLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    if (!user) {
      setSummary(emptySummary);
      setLoading(false);
      return;
    }

    const [goalsRes, hypothesesRes, outcomesRes] = await Promise.all([
      supabase
        .from("strategic_goals" as never)
        .select("id, title, status, target_metric, target_value, owner_role")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("marketing_hypotheses" as never)
        .select("id, title, status, priority, channel, audience, created_by_ai")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("decision_outcomes" as never)
        .select("id, outcome_status")
        .eq("user_id", user.id),
    ]);

    const goals = (goalsRes.data as StrategicGoalSummary[] | null) ?? [];
    const hypotheses = (hypothesesRes.data as MarketingHypothesisSummary[] | null) ?? [];
    const outcomes = (outcomesRes.data as DecisionOutcomeSummary[] | null) ?? [];

    const activeGoals = goals.filter((goal) => goal.status === "active");
    const backlogHypotheses = hypotheses.filter((hypothesis) => hypothesis.status === "backlog");
    const pendingReviews = outcomes.filter((outcome) => outcome.outcome_status === "pending_review");

    const prioritizedHypotheses = [...backlogHypotheses].sort((left, right) => {
      const priorityWeight = { high: 0, medium: 1, low: 2 };
      return (
        (priorityWeight[left.priority as keyof typeof priorityWeight] ?? 3) -
        (priorityWeight[right.priority as keyof typeof priorityWeight] ?? 3)
      );
    });

    setSummary({
      activeGoalsCount: activeGoals.length,
      backlogHypothesesCount: backlogHypotheses.length,
      aiHypothesesCount: hypotheses.filter((hypothesis) => hypothesis.created_by_ai).length,
      pendingOutcomeReviews: pendingReviews.length,
      topGoal: activeGoals[0] ?? goals[0] ?? null,
      topHypothesis: prioritizedHypotheses[0] ?? hypotheses[0] ?? null,
      hasAnyStrategyData: goals.length > 0 || hypotheses.length > 0 || outcomes.length > 0,
    });
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { summary, loading, refetch: fetchSummary };
};
