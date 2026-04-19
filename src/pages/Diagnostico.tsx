import { useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, RefreshCw, AlertTriangle, TrendingUp, Lightbulb, Target, Megaphone, Palette, FileText, Tag, Filter } from "lucide-react";
import { useDiagnostic, type AreaKey, type AreaStatus } from "@/hooks/useDiagnostic";
import { useNavigate } from "react-router-dom";
import { PageHelpBanner } from "@/components/help/PageHelpBanner";
import { PAGE_HELP } from "@/lib/pageHelp";

const AREA_META: Record<AreaKey, { label: string; icon: typeof Target }> = {
  trafego: { label: "Tráfego", icon: Megaphone },
  criativo: { label: "Criativo", icon: Palette },
  copy: { label: "Copy", icon: FileText },
  oferta: { label: "Oferta", icon: Tag },
  branding: { label: "Branding", icon: Target },
  funil: { label: "Funil", icon: Filter },
};

const statusToToken = (status: AreaStatus) => {
  switch (status) {
    case "verde": return { bg: "bg-orion-success/10", border: "border-orion-success/40", text: "text-orion-success", dot: "bg-orion-success" };
    case "amarelo": return { bg: "bg-orion-warning/10", border: "border-orion-warning/40", text: "text-orion-warning", dot: "bg-orion-warning" };
    case "vermelho": return { bg: "bg-destructive/10", border: "border-destructive/40", text: "text-destructive", dot: "bg-destructive" };
    default: return { bg: "bg-muted/40", border: "border-border", text: "text-muted-foreground", dot: "bg-muted-foreground" };
  }
};

const severityToToken = (s: "alta" | "media" | "baixa") => {
  if (s === "alta") return { label: "Alta", cls: "bg-destructive/15 text-destructive border-destructive/40" };
  if (s === "media") return { label: "Média", cls: "bg-orion-warning/15 text-orion-warning border-orion-warning/40" };
  return { label: "Baixa", cls: "bg-orion-info/15 text-orion-info border-orion-info/40" };
};

const ScoreGauge = ({ score }: { score: number }) => {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const colorVar = score >= 70 ? "--orion-success" : score >= 40 ? "--orion-warning" : "--destructive";

  return (
    <div className="relative w-44 h-44 flex items-center justify-center">
      <svg className="w-44 h-44 -rotate-90" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={radius} stroke="hsl(var(--muted))" strokeWidth="10" fill="none" />
        <circle
          cx="80"
          cy="80"
          r={radius}
          stroke={`hsl(var(${colorVar}))`}
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-xs text-muted-foreground font-mono">SCORE</p>
        <p className="text-5xl font-medium text-foreground">{score}</p>
        <p className="text-xs text-muted-foreground">/ 100</p>
      </div>
    </div>
  );
};

const Diagnostico = () => {
  const { latest, loading, generating, generate } = useDiagnostic();
  const navigate = useNavigate();

  const generatedAt = useMemo(() => {
    if (!latest) return "";
    return new Date(latest.created_at).toLocaleString("pt-BR");
  }, [latest]);

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto py-10 px-6">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl orion-gradient flex items-center justify-center text-primary-foreground">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground font-mono">DIAGNÓSTICO ORION</p>
              <h1 className="text-display text-foreground">Score de Marketing</h1>
              {latest && (
                <p className="text-xs text-muted-foreground mt-1">
                  Gerado em {generatedAt} · modelo {latest.model_used}
                </p>
              )}
            </div>
          </div>
          <Button
            onClick={generate}
            disabled={generating}
            className="orion-gradient text-primary-foreground orion-glow hover:opacity-90"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${generating ? "animate-spin" : ""}`} />
            {latest ? "Regenerar diagnóstico" : "Gerar diagnóstico"}
          </Button>
        </div>

        <PageHelpBanner content={PAGE_HELP.diagnostico} />

        {loading && (
          <Card className="p-8 bg-card border-border text-center">
            <div className="w-8 h-8 mx-auto rounded-lg orion-gradient animate-pulse-glow" />
            <p className="text-sm text-muted-foreground mt-3">Carregando diagnóstico…</p>
          </Card>
        )}

        {!loading && !latest && (
          <Card className="p-10 bg-card border-border text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-orion-violet/10 flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-orion-violet-light" />
            </div>
            <h2 className="text-heading text-foreground mb-2">Pronto para o primeiro diagnóstico</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
              O Orion vai cruzar seu Company DNA, métricas e criativos para devolver um Score 0-100,
              semáforo por área e os top 3 gargalos com hipóteses acionáveis.
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={generate}
                disabled={generating}
                className="orion-gradient text-primary-foreground orion-glow hover:opacity-90"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {generating ? "Analisando…" : "Gerar diagnóstico agora"}
              </Button>
              <Button variant="outline" onClick={() => navigate("/onboarding")}>
                Completar onboarding
              </Button>
            </div>
          </Card>
        )}

        {!loading && latest && (
          <div className="space-y-8">
            {/* Hero: Score + Summary */}
            <Card className="p-8 bg-card border-border">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <ScoreGauge score={latest.score} />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground font-mono mb-2">RESUMO EXECUTIVO</p>
                  <p className="text-foreground leading-relaxed">{latest.executive_summary}</p>
                </div>
              </div>
            </Card>

            {/* Area scores */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-heading text-foreground">Saúde por área</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(Object.keys(AREA_META) as AreaKey[]).map((key) => {
                  const meta = AREA_META[key];
                  const Icon = meta.icon;
                  const area = latest.area_scores?.[key];
                  if (!area) return null;
                  const t = statusToToken(area.status);
                  return (
                    <Card key={key} className={`p-5 bg-card border ${t.border}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-8 h-8 rounded-lg ${t.bg} flex items-center justify-center`}>
                            <Icon className={`w-4 h-4 ${t.text}`} />
                          </span>
                          <span className="text-sm font-medium text-foreground">{meta.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${t.dot}`} />
                          <span className={`text-sm font-mono ${t.text}`}>{area.score}</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{area.insight}</p>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Bottlenecks */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 text-orion-coral" />
                <h2 className="text-heading text-foreground">Top gargalos</h2>
              </div>
              <div className="space-y-3">
                {latest.bottlenecks?.map((b, i) => {
                  const sev = severityToToken(b.severity);
                  const areaLabel = AREA_META[b.area]?.label || b.area;
                  return (
                    <Card key={i} className="p-5 bg-card border-border">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-lg bg-orion-surface-2 flex items-center justify-center text-sm font-mono text-muted-foreground">
                            {i + 1}
                          </span>
                          <div>
                            <h3 className="text-sm font-medium text-foreground">{b.title}</h3>
                            <p className="text-xs text-muted-foreground font-mono mt-0.5">{areaLabel.toUpperCase()}</p>
                          </div>
                        </div>
                        <Badge className={`${sev.cls} border`}>Severidade {sev.label}</Badge>
                      </div>
                      <div className="space-y-2 pl-11">
                        <div>
                          <p className="text-xs text-muted-foreground font-mono mb-1">HIPÓTESE</p>
                          <p className="text-sm text-foreground">{b.hypothesis}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground font-mono mb-1">EVIDÊNCIA</p>
                          <p className="text-sm text-muted-foreground">{b.evidence}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground font-mono mb-1">PRÓXIMA AÇÃO</p>
                          <p className="text-sm text-foreground">{b.action}</p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Recommendations */}
            {latest.recommendations?.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-4 h-4 text-orion-amber" />
                  <h2 className="text-heading text-foreground">Recomendações estratégicas</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {latest.recommendations.map((r, i) => (
                    <Card key={i} className="p-4 bg-card border-border">
                      <h3 className="text-sm font-medium text-foreground mb-1">{r.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{r.rationale}</p>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Diagnostico;
