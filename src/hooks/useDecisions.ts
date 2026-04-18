import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type DecisionStatus = "pending" | "applied" | "dismissed";
export type DecisionAction =
  | "scale_budget" | "pause_campaign" | "refresh_creative" | "test_audience"
  | "adjust_bid" | "create_team_task" | "generate_brief" | "alert_only";

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
  payload: Record<string, any>;
  result: Record<string, any>;
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
    try {
      const { data, error } = await supabase.functions.invoke("interpret-metrics", { body: {} });
      if (error) {
        const msg = (error as any)?.context?.error || error.message;
        toast.error(msg || "Falha ao gerar decisões");
        return;
      }
      if ((data as any)?.error) { toast.error((data as any).error); return; }
      setExecutiveRead((data as any)?.executive_read || "");
      toast.success(`${(data as any)?.decisions?.length || 0} decisões geradas`);
      await fetchAll();
    } finally { setGenerating(false); }
  };

  const seedMocks = async () => {
    setSeeding(true);
    try {
      const { data, error } = await supabase.functions.invoke("seed-mock-metrics", { body: {} });
      if (error || (data as any)?.error) {
        toast.error(((data as any)?.error) || error?.message || "Falha no seeder");
        return;
      }
      toast.success(`Mock pronto: ${(data as any).metrics_inserted} métricas em ${(data as any).campaigns_created || 4} campanhas`);
    } finally { setSeeding(false); }
  };

  const apply = async (id: string) => {
    setApplyingId(id);
    try {
      const { data, error } = await supabase.functions.invoke("apply-decision", { body: { decision_id: id } });
      if (error || (data as any)?.error) {
        toast.error(((data as any)?.error) || error?.message || "Falha ao aplicar");
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
