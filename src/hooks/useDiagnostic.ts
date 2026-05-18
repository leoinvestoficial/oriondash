import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type AreaKey = "trafego" | "criativo" | "copy" | "oferta" | "branding" | "funil";
export type AreaStatus = "verde" | "amarelo" | "vermelho" | "desconhecido";

export interface AreaScore {
  score: number;
  status: AreaStatus;
  insight: string;
}

export interface Bottleneck {
  title: string;
  area: AreaKey;
  severity: "alta" | "media" | "baixa";
  hypothesis: string;
  evidence: string;
  action: string;
}

export interface Recommendation {
  title: string;
  rationale: string;
}

export interface DiagnosticRecord {
  id: string;
  user_id: string;
  score: number;
  area_scores: Record<AreaKey, AreaScore>;
  bottlenecks: Bottleneck[];
  executive_summary: string;
  recommendations: Recommendation[];
  model_used: string;
  created_at: string;
}

export const useDiagnostic = () => {
  const { user } = useAuth();
  const [latest, setLatest] = useState<DiagnosticRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchLatest = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const { data, error } = await supabase
      .from("diagnostics")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) console.error("diagnostic fetch error", error);
    setLatest((data as unknown as DiagnosticRecord) ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchLatest(); }, [fetchLatest]);

  const generate = async () => {
    if (!user) return;
    setGenerating(true);
    const slowNotice = window.setTimeout(() => {
      toast.info("O diagnóstico ainda está sendo gerado. Você pode aguardar; se passar muito tempo, tente novamente.");
    }, 12000);
    try {
      const invoke = supabase.functions.invoke("diagnose-business", { body: {} });
      const timeout = new Promise<never>((_, reject) => {
        window.setTimeout(() => reject(new Error("Tempo limite ao gerar diagnóstico. Tente novamente em instantes.")), 90000);
      });
      const { data, error } = await Promise.race([invoke, timeout]);
      if (error) {
        const msg = (error as any)?.context?.error || error.message || "Falha ao gerar diagnóstico";
        toast.error(msg);
        console.error(error);
        return;
      }
      if ((data as any)?.error) {
        toast.error((data as any).error);
        return;
      }
      toast.success("Diagnóstico gerado");
      await fetchLatest();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao gerar diagnóstico");
    } finally {
      window.clearTimeout(slowNotice);
      setGenerating(false);
    }
  };

  return { latest, loading, generating, generate, refetch: fetchLatest };
};
