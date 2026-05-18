import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface CompetitorLite {
  id: string;
  name: string;
  positioning: string | null;
  key_offer: string | null;
  threat_level: string;
  status: string;
}

interface SignalLite {
  id: string;
  title: string;
  implication: string | null;
  recommended_action: string | null;
  urgency: string;
  status: string;
}

interface BenchmarkLite {
  id: string;
  channel: string;
  metric_name: string;
  benchmark_value: number | null;
  current_value: number | null;
  gap_summary: string | null;
}

export interface IntelligenceSummary {
  activeCompetitorsCount: number;
  openSignalsCount: number;
  benchmarkCount: number;
  topCompetitor: CompetitorLite | null;
  topSignal: SignalLite | null;
  largestGap: BenchmarkLite | null;
  hasData: boolean;
}

const emptySummary: IntelligenceSummary = {
  activeCompetitorsCount: 0,
  openSignalsCount: 0,
  benchmarkCount: 0,
  topCompetitor: null,
  topSignal: null,
  largestGap: null,
  hasData: false,
};

export const useIntelligenceSummary = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState<IntelligenceSummary>(emptySummary);
  const [loading, setLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    if (!user) {
      setSummary(emptySummary);
      setLoading(false);
      return;
    }

    const [competitorsRes, signalsRes, benchmarksRes] = await Promise.all([
      supabase.from("competitor_profiles" as never).select("id, name, positioning, key_offer, threat_level, status").eq("user_id", user.id),
      supabase.from("market_signals" as never).select("id, title, implication, recommended_action, urgency, status").eq("user_id", user.id),
      supabase.from("benchmark_snapshots" as never).select("id, channel, metric_name, benchmark_value, current_value, gap_summary").eq("user_id", user.id),
    ]);

    const competitors = (competitorsRes.data as CompetitorLite[] | null) ?? [];
    const signals = (signalsRes.data as SignalLite[] | null) ?? [];
    const benchmarks = (benchmarksRes.data as BenchmarkLite[] | null) ?? [];

    const topCompetitor =
      competitors.find((item) => item.status === "active" && item.threat_level === "high")
      || competitors.find((item) => item.status === "active")
      || competitors[0]
      || null;
    const topSignal =
      signals.find((item) => item.status === "open" && item.urgency === "high")
      || signals.find((item) => item.status === "open")
      || signals[0]
      || null;
    const largestGap =
      [...benchmarks]
        .filter((item) => item.benchmark_value !== null && item.current_value !== null)
        .sort((left, right) => {
          const leftGap = Math.abs((left.current_value || 0) - (left.benchmark_value || 0));
          const rightGap = Math.abs((right.current_value || 0) - (right.benchmark_value || 0));
          return rightGap - leftGap;
        })[0]
      || null;

    setSummary({
      activeCompetitorsCount: competitors.filter((item) => item.status === "active").length,
      openSignalsCount: signals.filter((item) => item.status === "open").length,
      benchmarkCount: benchmarks.length,
      topCompetitor,
      topSignal,
      largestGap,
      hasData: competitors.length > 0 || signals.length > 0 || benchmarks.length > 0,
    });
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { summary, loading, refetch: fetchSummary };
};
