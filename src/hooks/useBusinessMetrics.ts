import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface BusinessMetricsSnapshot {
  id?: string;
  avg_ticket?: number | null;
  avg_margin_pct?: number | null;
  cac_current?: number | null;
  ltv_estimated?: number | null;
  payback_months?: number | null;
  monthly_traffic?: number | null;
  conversion_rate_pct?: number | null;
  avg_roas?: number | null;
  monthly_revenue?: number | null;
  perceived_bottlenecks?: string | null;
  current_tools?: string | null;
  team_size?: number | null;
  notes?: string | null;
}

export const useBusinessMetrics = (companyDnaId?: string | null) => {
  const { user } = useAuth();
  const [latest, setLatest] = useState<BusinessMetricsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLatest = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const { data, error } = await supabase
      .from("business_metrics")
      .select("*")
      .eq("user_id", user.id)
      .order("snapshot_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) console.error("business_metrics fetch error", error);
    setLatest(data ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchLatest(); }, [fetchLatest]);

  const saveSnapshot = async (snapshot: BusinessMetricsSnapshot) => {
    if (!user) return;
    const payload = {
      user_id: user.id,
      company_dna_id: companyDnaId ?? null,
      ...snapshot,
    };
    const { error } = await supabase.from("business_metrics").insert(payload);
    if (error) {
      toast.error("Erro ao salvar métricas");
      console.error(error);
      return;
    }
    toast.success("Métricas registradas");
    await fetchLatest();
  };

  return { latest, loading, saveSnapshot, refetch: fetchLatest };
};
