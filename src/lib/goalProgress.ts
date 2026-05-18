import type { DashboardMetrics } from "@/hooks/useDashboardMetrics";

export interface GoalProgressInput {
  target_metric: string | null;
  target_value: number | null;
}

export interface GoalProgressResult {
  currentValue: number | null;
  progressPct: number | null;
  metricLabel: string | null;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const getGoalProgress = (
  goal: GoalProgressInput,
  metrics: DashboardMetrics | null,
): GoalProgressResult => {
  if (!goal.target_metric || goal.target_value === null || !metrics) {
    return { currentValue: null, progressPct: null, metricLabel: goal.target_metric };
  }

  const metric = goal.target_metric.toLowerCase();
  let currentValue: number | null = null;

  if (metric.includes("roas") || metric.includes("roi")) currentValue = metrics.overallRoas;
  else if (metric.includes("cac") || metric.includes("cpa")) currentValue = metrics.overallCpa;
  else if (metric.includes("lead") || metric.includes("convers")) currentValue = metrics.totalConversions;
  else if (metric.includes("receita") || metric.includes("revenue")) currentValue = metrics.totalRevenue;
  else if (metric.includes("ctr")) currentValue = metrics.overallCtr;

  if (currentValue === null) {
    return { currentValue: null, progressPct: null, metricLabel: goal.target_metric };
  }

  const lowerIsBetter = metric.includes("cac") || metric.includes("cpa");
  const progressPct = lowerIsBetter
    ? clamp((goal.target_value / Math.max(currentValue, 0.0001)) * 100, 0, 200)
    : clamp((currentValue / Math.max(goal.target_value, 0.0001)) * 100, 0, 200);

  return {
    currentValue,
    progressPct,
    metricLabel: goal.target_metric,
  };
};
