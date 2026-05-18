import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  FileText, RefreshCw, TrendingUp, TrendingDown, Target,
  Sparkles, Loader2, CalendarDays, CheckCircle2, AlertTriangle,
} from "lucide-react";

interface ExecutiveReport {
  id: string;
  period_start: string;
  period_end: string;
  headline: string;
  summary: string;
  decisions_applied: number;
  top_win: string | null;
  top_loss: string | null;
  next_priority: string | null;
  created_at: string;
}

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

const ExecutiveReport = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<ExecutiveReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const fetchReports = async () => {
    if (!user) return;
    const { data, error } = await (supabase as any)
      .from("executive_reports")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(12);
    if (error) { toast.error("Erro ao carregar relatórios"); return; }
    const list = data || [];
    setReports(list);
    if (!selected && list.length > 0) setSelected(list[0].id);
    setLoading(false);
  };

  useEffect(() => { fetchReports(); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGenerate = async () => {
    setGenerating(true);
    toast.loading("Gerando relatório executivo…", { id: "exec-report" });
    const { data, error } = await supabase.functions.invoke("generate-executive-report", { body: {} });
    setGenerating(false);
    if (error || data?.error) {
      toast.error("Erro ao gerar relatório", { id: "exec-report" });
      return;
    }
    toast.success(data.updated ? "Relatório atualizado!" : "Relatório gerado!", { id: "exec-report" });
    await fetchReports();
    if (data.id) setSelected(data.id);
  };

  const current = reports.find((r) => r.id === selected);

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-28 bg-card border border-border rounded-xl" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-display text-foreground">Relatório Executivo</h1>
            <p className="text-sm text-muted-foreground">
              Resumo semanal automático — o que mudou, o que funcionou e qual é a próxima prioridade.
            </p>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="orion-gradient text-primary-foreground gap-2"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {generating ? "Gerando…" : "Gerar relatório"}
          </Button>
        </div>

        {reports.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-16 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-heading text-foreground mb-2">Nenhum relatório ainda</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
              Clique em "Gerar relatório" para criar um resumo executivo da última semana com IA.
            </p>
            <Button onClick={handleGenerate} disabled={generating} className="orion-gradient text-primary-foreground gap-2">
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Gerar primeiro relatório
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar: history */}
            <div className="lg:col-span-1 space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider px-1 mb-3">Histórico</p>
              {reports.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelected(r.id)}
                  className={cn(
                    "w-full text-left px-3 py-3 rounded-lg border transition-all",
                    selected === r.id
                      ? "border-primary/40 bg-primary/5 text-foreground"
                      : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/20"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <CalendarDays className="w-3 h-3 shrink-0" />
                    <span className="text-xs font-medium">
                      {fmtDate(r.period_start)} – {fmtDate(r.period_end)}
                    </span>
                  </div>
                  <p className="text-[11px] line-clamp-2 leading-relaxed">{r.headline}</p>
                </button>
              ))}
            </div>

            {/* Main: report detail */}
            {current && (
              <div className="lg:col-span-3 space-y-5">
                {/* Headline */}
                <div className="bg-card border border-border rounded-xl p-5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <CalendarDays className="w-3 h-3" />
                    {fmtDate(current.period_start)} – {fmtDate(current.period_end)}
                    <span className="mx-1">·</span>
                    <RefreshCw className="w-3 h-3" />
                    Gerado em {new Date(current.created_at).toLocaleDateString("pt-BR")}
                  </div>
                  <h2 className="text-lg font-semibold text-foreground mb-3">{current.headline}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">{current.summary}</p>
                </div>

                {/* KPI strip */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                    <div>
                      <p className="text-xl font-bold text-foreground">{current.decisions_applied}</p>
                      <p className="text-xs text-muted-foreground">Decisões aplicadas</p>
                    </div>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-foreground mb-1">Maior vitória</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {current.top_win || "Não identificada"}
                      </p>
                    </div>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
                    <TrendingDown className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-foreground mb-1">Principal problema</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {current.top_loss || "Nenhum identificado"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Next priority */}
                {current.next_priority && (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 flex items-start gap-3">
                    <Target className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-1">Próxima prioridade</p>
                      <p className="text-sm text-muted-foreground">{current.next_priority}</p>
                    </div>
                  </div>
                )}

                {/* Notice if AI unavailable */}
                {!current.top_win && !current.next_priority && (
                  <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 text-sm text-muted-foreground">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-yellow-500" />
                    Relatório gerado sem IA (modo offline). Configure LOVABLE_API_KEY para análise completa.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default ExecutiveReport;
