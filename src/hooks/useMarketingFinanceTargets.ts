import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyDNA } from "@/hooks/useCompanyDNA";
import { toast } from "sonner";

export interface MarketingFinanceTarget {
  id: string;
  company_id: string | null;
  user_id: string;
  period_start: string;
  period_end: string;
  monthly_budget: number | null;
  daily_budget: number | null;
  target_cac: number | null;
  target_cpa: number | null;
  target_roas: number | null;
  estimated_margin: number | null;
  break_even_cpa: number | null;
}

export interface FinanceTargetInput {
  monthly_budget?: number | null;
  target_cac?: number | null;
  target_cpa?: number | null;
  target_roas?: number | null;
  estimated_margin?: number | null;
  break_even_cpa?: number | null;
  period_start?: string;
  period_end?: string;
}

const currentMonthPeriod = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    period_start: start.toISOString().split("T")[0],
    period_end: end.toISOString().split("T")[0],
  };
};

export const useMarketingFinanceTargets = () => {
  const { user } = useAuth();
  const { dna } = useCompanyDNA();
  const [target, setTarget] = useState<MarketingFinanceTarget | null>(null);
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(true);

  const fetchLatest = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("marketing_finance_targets")
      .select("*")
      .eq("user_id", user.id)
      .order("period_start", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      setAvailable(false);
      setTarget(null);
    } else {
      setAvailable(true);
      setTarget((data as MarketingFinanceTarget) ?? null);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchLatest(); }, [fetchLatest]);

  const save = async (input: FinanceTargetInput) => {
    if (!user) return false;
    const period = currentMonthPeriod();
    const payload = {
      company_id: dna?.id ?? null,
      user_id: user.id,
      period_start: input.period_start || target?.period_start || period.period_start,
      period_end: input.period_end || target?.period_end || period.period_end,
      monthly_budget: input.monthly_budget ?? null,
      daily_budget: input.monthly_budget ? input.monthly_budget / 30 : null,
      channel_budget: {},
      campaign_budget: {},
      target_cac: input.target_cac ?? null,
      target_cpa: input.target_cpa ?? null,
      target_roas: input.target_roas ?? null,
      estimated_margin: input.estimated_margin ?? null,
      break_even_cpa: input.break_even_cpa ?? null,
    };

    const query = target?.id
      ? (supabase as any).from("marketing_finance_targets").update(payload).eq("id", target.id).select().single()
      : (supabase as any).from("marketing_finance_targets").insert(payload).select().single();

    const { data, error } = await query;
    if (error) {
      setAvailable(false);
      toast.error("Metas financeiras dependem da migration operacional aplicada.");
      return false;
    }
    setAvailable(true);
    setTarget(data as MarketingFinanceTarget);
    toast.success("Metas financeiras salvas");
    return true;
  };

  return { target, loading, available, save, refetch: fetchLatest };
};
