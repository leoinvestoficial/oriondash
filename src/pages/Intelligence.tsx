import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHelpBanner } from "@/components/help/PageHelpBanner";
import { PAGE_HELP } from "@/lib/pageHelp";
import { toast } from "sonner";
import { AlertTriangle, BarChart3, Radio, Plus, Radar, ShieldAlert } from "lucide-react";
import { useIntelligenceSummary } from "@/hooks/useIntelligenceSummary";

const Intelligence = () => {
  const { user } = useAuth();
  const { topCompetitor, topSignal, largestGap, loading } = useIntelligenceSummary();
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [signals, setSignals] = useState<any[]>([]);
  const [benchmarks, setBenchmarks] = useState<any[]>([]);
  const [competitorForm, setCompetitorForm] = useState({ name: "", website: "", category: "", positioning: "", strengths: "", weaknesses: "", notes: "" });
  const [signalForm, setSignalForm] = useState({ title: "", signal_type: "trend", summary: "", urgency: "medium", recommended_action: "", source: "" });
  const [benchmarkForm, setBenchmarkForm] = useState({ channel: "meta", metric_name: "roas", metric_value: "", benchmark_value: "", gap_summary: "", notes: "" });

  const fetchAll = async () => {
    if (!user) return;
    const [cRes, sRes, bRes] = await Promise.all([
      supabase.from("competitor_profiles").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("market_signals").select("*").eq("user_id", user.id).order("observed_at", { ascending: false }),
      supabase.from("benchmark_snapshots").select("*").eq("user_id", user.id).order("snapshot_date", { ascending: false }),
    ]);
    setCompetitors(cRes.data || []);
    setSignals(sRes.data || []);
    setBenchmarks(bRes.data || []);
  };

  useEffect(() => { fetchAll(); }, [user]);

  const executiveRead = useMemo(() => {
    const topThreat = topCompetitor?.weaknesses ? `Ataque explorável em ${topCompetitor.name}: ${topCompetitor.weaknesses}` : null;
    const urgentSignal = topSignal ? `${topSignal.title} — ${topSignal.recommended_action || topSignal.summary}` : null;
    const benchmarkRisk = largestGap ? `${largestGap.channel}: ${largestGap.gap_summary || `${largestGap.metric_name} abaixo da referência`}` : null;
    return { topThreat, urgentSignal, benchmarkRisk };
  }, [topCompetitor, topSignal, largestGap]);

  const createCompetitor = async () => {
    if (!user || !competitorForm.name.trim()) return;
    const { error } = await supabase.from("competitor_profiles").insert({ user_id: user.id, ...competitorForm });
    if (error) return toast.error("Erro ao salvar concorrente");
    toast.success("Concorrente salvo");
    setCompetitorForm({ name: "", website: "", category: "", positioning: "", strengths: "", weaknesses: "", notes: "" });
    fetchAll();
  };

  const createSignal = async () => {
    if (!user || !signalForm.title.trim() || !signalForm.summary.trim()) return;
    const { error } = await supabase.from("market_signals").insert({ user_id: user.id, ...signalForm });
    if (error) return toast.error("Erro ao salvar sinal");
    toast.success("Sinal salvo");
    setSignalForm({ title: "", signal_type: "trend", summary: "", urgency: "medium", recommended_action: "", source: "" });
    fetchAll();
  };

  const createBenchmark = async () => {
    if (!user || !benchmarkForm.channel || !benchmarkForm.metric_name) return;
    const { error } = await supabase.from("benchmark_snapshots").insert({
      user_id: user.id,
      channel: benchmarkForm.channel,
      metric_name: benchmarkForm.metric_name,
      metric_value: benchmarkForm.metric_value ? Number(benchmarkForm.metric_value) : null,
      benchmark_value: benchmarkForm.benchmark_value ? Number(benchmarkForm.benchmark_value) : null,
      gap_summary: benchmarkForm.gap_summary || null,
      notes: benchmarkForm.notes || null,
    });
    if (error) return toast.error("Erro ao salvar benchmark");
    toast.success("Benchmark salvo");
    setBenchmarkForm({ channel: "meta", metric_name: "roas", metric_value: "", benchmark_value: "", gap_summary: "", notes: "" });
    fetchAll();
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-display text-foreground">Intelligence</h1>
            <p className="text-sm text-muted-foreground">Concorrentes, sinais e benchmarks com leitura executiva.</p>
          </div>
        </div>

        <PageHelpBanner content={PAGE_HELP.intelligence} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[
            { title: "Principal ameaça", text: executiveRead.topThreat || "Sem ameaça mapeada", icon: ShieldAlert },
            { title: "Sinal mais urgente", text: executiveRead.urgentSignal || "Sem sinal urgente", icon: Radio },
            { title: "Gap mais relevante", text: executiveRead.benchmarkRisk || "Sem gap relevante", icon: AlertTriangle },
          ].map(({ title, text, icon: Icon }) => (
            <div key={title} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Icon className="w-4 h-4 text-primary" /></div>
                <h2 className="text-sm font-medium text-foreground">{title}</h2>
              </div>
              <p className="text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <section className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2"><Radar className="w-4 h-4 text-primary" /><h2 className="text-heading text-foreground">Concorrentes</h2></div>
            <div className="space-y-2">
              <Input value={competitorForm.name} onChange={(e) => setCompetitorForm((p) => ({ ...p, name: e.target.value }))} placeholder="Nome do concorrente" className="bg-background" />
              <Input value={competitorForm.website} onChange={(e) => setCompetitorForm((p) => ({ ...p, website: e.target.value }))} placeholder="Website" className="bg-background" />
              <Input value={competitorForm.category} onChange={(e) => setCompetitorForm((p) => ({ ...p, category: e.target.value }))} placeholder="Categoria" className="bg-background" />
              <Input value={competitorForm.positioning} onChange={(e) => setCompetitorForm((p) => ({ ...p, positioning: e.target.value }))} placeholder="Posicionamento" className="bg-background" />
              <Textarea value={competitorForm.strengths} onChange={(e) => setCompetitorForm((p) => ({ ...p, strengths: e.target.value }))} placeholder="Forças" rows={2} className="bg-background resize-none" />
              <Textarea value={competitorForm.weaknesses} onChange={(e) => setCompetitorForm((p) => ({ ...p, weaknesses: e.target.value }))} placeholder="Fraquezas" rows={2} className="bg-background resize-none" />
              <Button onClick={createCompetitor} className="w-full orion-gradient text-primary-foreground gap-2"><Plus className="w-4 h-4" />Adicionar concorrente</Button>
            </div>
            <div className="space-y-2 max-h-[28rem] overflow-auto pr-1">
              {competitors.map((item) => <div key={item.id} className="rounded-lg border border-border bg-background p-3"><p className="text-sm font-medium text-foreground">{item.name}</p><p className="text-xs text-muted-foreground">{item.positioning || item.category || "Sem posicionamento"}</p><p className="text-xs text-muted-foreground mt-1">{item.weaknesses || item.strengths || "Sem leitura estratégica ainda"}</p></div>)}
            </div>
          </section>

          <section className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2"><Radio className="w-4 h-4 text-primary" /><h2 className="text-heading text-foreground">Sinais de mercado</h2></div>
            <div className="space-y-2">
              <Input value={signalForm.title} onChange={(e) => setSignalForm((p) => ({ ...p, title: e.target.value }))} placeholder="Título do sinal" className="bg-background" />
              <div className="grid grid-cols-2 gap-2">
                <Select value={signalForm.signal_type} onValueChange={(v) => setSignalForm((p) => ({ ...p, signal_type: v }))}><SelectTrigger className="bg-background"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="trend">Tendência</SelectItem><SelectItem value="risk">Risco</SelectItem><SelectItem value="opportunity">Oportunidade</SelectItem></SelectContent></Select>
                <Select value={signalForm.urgency} onValueChange={(v) => setSignalForm((p) => ({ ...p, urgency: v }))}><SelectTrigger className="bg-background"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Baixa</SelectItem><SelectItem value="medium">Média</SelectItem><SelectItem value="high">Alta</SelectItem></SelectContent></Select>
              </div>
              <Textarea value={signalForm.summary} onChange={(e) => setSignalForm((p) => ({ ...p, summary: e.target.value }))} placeholder="Resumo do sinal" rows={3} className="bg-background resize-none" />
              <Textarea value={signalForm.recommended_action} onChange={(e) => setSignalForm((p) => ({ ...p, recommended_action: e.target.value }))} placeholder="Ação recomendada" rows={2} className="bg-background resize-none" />
              <Input value={signalForm.source} onChange={(e) => setSignalForm((p) => ({ ...p, source: e.target.value }))} placeholder="Fonte" className="bg-background" />
              <Button onClick={createSignal} className="w-full orion-gradient text-primary-foreground gap-2"><Plus className="w-4 h-4" />Adicionar sinal</Button>
            </div>
            <div className="space-y-2 max-h-[28rem] overflow-auto pr-1">
              {signals.map((item) => <div key={item.id} className="rounded-lg border border-border bg-background p-3"><div className="flex items-center justify-between gap-2"><p className="text-sm font-medium text-foreground">{item.title}</p><span className="text-[10px] text-primary">{item.urgency}</span></div><p className="text-xs text-muted-foreground mt-1">{item.summary}</p><p className="text-xs text-muted-foreground mt-1">{item.recommended_action || "Sem ação sugerida"}</p></div>)}
            </div>
          </section>

          <section className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" /><h2 className="text-heading text-foreground">Benchmarks</h2></div>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Input value={benchmarkForm.channel} onChange={(e) => setBenchmarkForm((p) => ({ ...p, channel: e.target.value }))} placeholder="Canal" className="bg-background" />
                <Input value={benchmarkForm.metric_name} onChange={(e) => setBenchmarkForm((p) => ({ ...p, metric_name: e.target.value }))} placeholder="Métrica" className="bg-background" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input value={benchmarkForm.metric_value} onChange={(e) => setBenchmarkForm((p) => ({ ...p, metric_value: e.target.value }))} placeholder="Valor atual" className="bg-background" />
                <Input value={benchmarkForm.benchmark_value} onChange={(e) => setBenchmarkForm((p) => ({ ...p, benchmark_value: e.target.value }))} placeholder="Benchmark" className="bg-background" />
              </div>
              <Textarea value={benchmarkForm.gap_summary} onChange={(e) => setBenchmarkForm((p) => ({ ...p, gap_summary: e.target.value }))} placeholder="Resumo do gap" rows={2} className="bg-background resize-none" />
              <Button onClick={createBenchmark} className="w-full orion-gradient text-primary-foreground gap-2"><Plus className="w-4 h-4" />Adicionar benchmark</Button>
            </div>
            <div className="space-y-2 max-h-[28rem] overflow-auto pr-1">
              {benchmarks.map((item) => <div key={item.id} className="rounded-lg border border-border bg-background p-3"><p className="text-sm font-medium text-foreground">{item.channel} · {item.metric_name}</p><p className="text-xs text-muted-foreground">Atual {item.metric_value ?? "—"} vs benchmark {item.benchmark_value ?? "—"}</p><p className="text-xs text-muted-foreground mt-1">{item.gap_summary || "Sem resumo"}</p></div>)}
            </div>
          </section>
        </div>

        {loading && <p className="text-sm text-muted-foreground">Carregando intelligence…</p>}
      </div>
    </AppLayout>
  );
};

export default Intelligence;
