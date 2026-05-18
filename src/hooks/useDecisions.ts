import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type DecisionStatus = "pending" | "applied" | "dismissed";
export type DecisionAction =
  | "scale_budget" | "pause_campaign" | "refresh_creative" | "test_audience"
  | "audience_split_test" | "creative_ab_test"
  | "adjust_bid" | "create_team_task" | "generate_brief" | "alert_only";

export interface AudienceVariant {
  name: string;
  hypothesis: string;
  targeting: string;
  budget_share_pct?: number;
}
export interface CreativeVariant {
  name: string;
  format: string;
  hook: string;
  angle: string;
  cta?: string;
}
export interface MetricsSnapshot {
  spend?: number;
  revenue?: number;
  conversions?: number;
  cpc?: number;
  cpa?: number;
  ctr?: number;
  roas?: number;
  roi_pct?: number;
  [k: string]: unknown;
}

export interface DecisionRecord {
  id: string;
  action_type: DecisionAction;
  title: string;
  rationale: string;
  evidence: string;
  expected_impact: string;
  severity: "alta" | "media" | "baixa";
  status: DecisionStatus;
  campaign_id: string | null;
  payload: {
    metrics_snapshot?: MetricsSnapshot;
    audience_variants?: AudienceVariant[];
    creative_variants?: CreativeVariant[];
    task_steps?: string[];
    [k: string]: unknown;
  };
  result: Record<string, unknown>;
  created_at: string;
  applied_at: string | null;
}

export const useDecisions = () => {
  const { user } = useAuth();
  const [decisions, setDecisions] = useState<DecisionRecord[]>([]);
  const [executiveRead, setExecutiveRead] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  interface InterpretMetricsResponse {
    error?: string;
    executive_read?: string;
    decisions?: unknown[];
  }

  interface SeedResponse {
    error?: string;
    metrics_inserted?: number;
    campaigns_created?: number;
  }

  interface ApplyResponse {
    error?: string;
  }

  const fetchAll = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const { data, error } = await supabase
      .from("ai_decisions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) console.error(error);
    setDecisions((data as unknown as DecisionRecord[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const generate = async () => {
    setGenerating(true);
    const slowNotice = window.setTimeout(() => {
      toast.info("A leitura de métricas está demorando mais que o normal. O Orion continua tentando concluir.");
    }, 12000);
    try {
      const invoke = supabase.functions.invoke("interpret-metrics", { body: {} });
      const timeout = new Promise<never>((_, reject) => {
        window.setTimeout(() => reject(new Error("Tempo limite ao gerar decisões. Tente novamente em instantes.")), 150000);
      });
      const { data, error } = await Promise.race([invoke, timeout]);
      if (error) {
        const msg = (error as { context?: { error?: string } })?.context?.error || error.message;
        toast.error(msg || "Falha ao gerar decisões");
        return;
      }
      if ((data as InterpretMetricsResponse)?.error) { toast.error((data as InterpretMetricsResponse).error); return; }
      setExecutiveRead((data as InterpretMetricsResponse)?.executive_read || "");
      toast.success(`${(data as InterpretMetricsResponse)?.decisions?.length || 0} decisões geradas`);
      await fetchAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao gerar decisões");
    } finally {
      window.clearTimeout(slowNotice);
      setGenerating(false);
    }
  };

  const seedMocks = async () => {
    setSeeding(true);
    try {
      const { data, error } = await supabase.functions.invoke("seed-mock-metrics", { body: {} });
      if (error || (data as SeedResponse)?.error) {
        toast.error(((data as SeedResponse)?.error) || error?.message || "Falha no seeder");
        return;
      }
      toast.success(`Mock pronto: ${(data as SeedResponse).metrics_inserted} métricas em ${(data as SeedResponse).campaigns_created || 4} campanhas`);
    } finally { setSeeding(false); }
  };

  const apply = async (id: string) => {
    setApplyingId(id);
    try {
      const { data, error } = await supabase.functions.invoke("apply-decision", { body: { decision_id: id } });
      if (error || (data as ApplyResponse)?.error) {
        toast.error(((data as ApplyResponse)?.error) || error?.message || "Falha ao aplicar");
        return;
      }
      toast.success("Decisão aplicada");
      await fetchAll();
    } finally { setApplyingId(null); }
  };

  const dismiss = async (id: string) => {
    const { error } = await supabase.from("ai_decisions").update({ status: "dismissed" }).eq("id", id);
    if (error) { toast.error("Falha ao descartar"); return; }
    toast.success("Decisão descartada");
    await fetchAll();
  };

  return { decisions, executiveRead, loading, generating, seeding, applyingId, generate, seedMocks, apply, dismiss, refetch: fetchAll };
};
