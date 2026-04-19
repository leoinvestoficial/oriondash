import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface MemoryRecord {
  id: string;
  memory_type: string;
  source: string;
  title: string;
  summary: string | null;
  content: string | null;
  tags: string[];
  importance: number;
  reference_table: string | null;
  reference_id: string | null;
  raw_data: Record<string, any>;
  occurred_at: string;
  created_at: string;
}

export interface BrainContext {
  company: string;
  latest_metrics: any;
  latest_diagnostic: any;
  pending_decisions: any[];
  recent_decisions: any[];
  important_memory: any[];
}

export const useBrain = () => {
  const { user } = useAuth();
  const [memories, setMemories] = useState<MemoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [briefing, setBriefing] = useState<string>("");
  const [context, setContext] = useState<BrainContext | null>(null);
  const [generatingBriefing, setGeneratingBriefing] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  const fetchMemories = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    let q = supabase.from("business_memory").select("*").eq("user_id", user.id).order("occurred_at", { ascending: false }).limit(100);
    if (filter !== "all") q = q.eq("memory_type", filter);
    const { data, error } = await q;
    if (error) console.error(error);
    setMemories((data as unknown as MemoryRecord[]) ?? []);
    setLoading(false);
  }, [user, filter]);

  useEffect(() => { fetchMemories(); }, [fetchMemories]);

  const ingest = async (input: { memory_type?: string; title: string; content?: string; tags?: string[]; importance?: number; source?: string }) => {
    setIngesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("ingest-memory", { body: input });
      if (error || (data as any)?.error) { toast.error((data as any)?.error || error?.message || "Falha ao salvar"); return; }
      toast.success("Memória registrada");
      await fetchMemories();
    } finally { setIngesting(false); }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("business_memory").delete().eq("id", id);
    if (error) { toast.error("Falha ao remover"); return; }
    toast.success("Removido");
    await fetchMemories();
  };

  const refreshBriefing = async (query?: string) => {
    setGeneratingBriefing(true);
    try {
      const { data, error } = await supabase.functions.invoke("brain-context", { body: { mode: "summary", query: query ?? "" } });
      if (error || (data as any)?.error) { toast.error((data as any)?.error || error?.message || "Falha"); return; }
      setBriefing((data as any).briefing ?? "");
      setContext((data as any).context ?? null);
    } finally { setGeneratingBriefing(false); }
  };

  return { memories, loading, ingest, ingesting, remove, briefing, context, refreshBriefing, generatingBriefing, filter, setFilter, refetch: fetchMemories };
};
