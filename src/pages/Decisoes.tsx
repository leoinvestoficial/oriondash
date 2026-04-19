import { useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Sparkles, Database, Check, X, TrendingUp, Pause, Palette, Users, DollarSign, ListTodo, FileText, Bell } from "lucide-react";
import { useDecisions, type DecisionAction, type DecisionRecord } from "@/hooks/useDecisions";
import { PageHelpBanner } from "@/components/help/PageHelpBanner";
import { PAGE_HELP } from "@/lib/pageHelp";

const ACTION_META: Record<DecisionAction, { label: string; icon: typeof Brain; tone: string }> = {
  scale_budget: { label: "Escalar orçamento", icon: TrendingUp, tone: "text-orion-success" },
  pause_campaign: { label: "Pausar campanha", icon: Pause, tone: "text-destructive" },
  refresh_creative: { label: "Trocar criativo", icon: Palette, tone: "text-orion-violet-light" },
  test_audience: { label: "Testar público", icon: Users, tone: "text-orion-info" },
  adjust_bid: { label: "Ajustar lance", icon: DollarSign, tone: "text-orion-warning" },
  create_team_task: { label: "Tarefa pra equipe", icon: ListTodo, tone: "text-orion-teal" },
  generate_brief: { label: "Gerar brief", icon: FileText, tone: "text-orion-amber" },
  alert_only: { label: "Alerta", icon: Bell, tone: "text-muted-foreground" },
};

const sevToken = (s: "alta" | "media" | "baixa") => {
  if (s === "alta") return "bg-destructive/15 text-destructive border-destructive/40";
  if (s === "media") return "bg-orion-warning/15 text-orion-warning border-orion-warning/40";
  return "bg-orion-info/15 text-orion-info border-orion-info/40";
};

const statusToken = (s: DecisionRecord["status"]) => {
  if (s === "applied") return "bg-orion-success/15 text-orion-success border-orion-success/40";
  if (s === "dismissed") return "bg-muted/40 text-muted-foreground border-border";
  return "bg-orion-violet/15 text-orion-violet-light border-orion-violet/40";
};

const DecisionCard = ({ d, onApply, onDismiss, busy }: {
  d: DecisionRecord;
  onApply: (id: string) => void;
  onDismiss: (id: string) => void;
  busy: boolean;
}) => {
  const meta = ACTION_META[d.action_type] || ACTION_META.alert_only;
  const Icon = meta.icon;
  return (
    <Card className="p-5 bg-card border-border">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-lg bg-orion-surface-2 flex items-center justify-center">
            <Icon className={`w-4 h-4 ${meta.tone}`} />
          </span>
          <div>
            <h3 className="text-sm font-medium text-foreground">{d.title}</h3>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">{meta.label.toUpperCase()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`${sevToken(d.severity)} border text-[10px]`}>SEV {d.severity.toUpperCase()}</Badge>
          <Badge className={`${statusToken(d.status)} border text-[10px]`}>{d.status.toUpperCase()}</Badge>
        </div>
      </div>

      <div className="space-y-2 pl-12 mb-4">
        <div>
          <p className="text-xs text-muted-foreground font-mono mb-1">RAZÃO</p>
          <p className="text-sm text-foreground">{d.rationale}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-mono mb-1">EVIDÊNCIA</p>
          <p className="text-sm text-muted-foreground">{d.evidence}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-mono mb-1">IMPACTO ESPERADO</p>
          <p className="text-sm text-foreground">{d.expected_impact}</p>
        </div>
        {d.payload?.task_steps?.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground font-mono mb-1">PASSOS</p>
            <ol className="text-sm text-foreground list-decimal list-inside space-y-0.5">
              {d.payload.task_steps.map((s: string, i: number) => <li key={i}>{s}</li>)}
            </ol>
          </div>
        )}
        {d.status === "applied" && d.result?.steps?.length > 0 && (
          <div className="mt-2 p-3 rounded-lg bg-orion-success/5 border border-orion-success/20">
            <p className="text-xs text-orion-success font-mono mb-1">EXECUTADO</p>
            <ul className="text-sm text-foreground space-y-0.5">
              {d.result.steps.map((s: string, i: number) => <li key={i}>• {s}</li>)}
            </ul>
          </div>
        )}
      </div>

      {d.status === "pending" && (
        <div className="flex gap-2 pl-12">
          <Button
            size="sm"
            onClick={() => onApply(d.id)}
            disabled={busy}
            className="orion-gradient text-primary-foreground hover:opacity-90"
          >
            <Check className="w-4 h-4 mr-1" />
            Aplicar 1-clique
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDismiss(d.id)} disabled={busy} className="text-muted-foreground">
            <X className="w-4 h-4 mr-1" />
            Descartar
          </Button>
        </div>
      )}
    </Card>
  );
};

const Decisoes = () => {
  const { decisions, executiveRead, loading, generating, seeding, applyingId, generate, seedMocks, apply, dismiss } = useDecisions();

  const pending = useMemo(() => decisions.filter((d) => d.status === "pending"), [decisions]);
  const handled = useMemo(() => decisions.filter((d) => d.status !== "pending"), [decisions]);

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto py-10 px-6">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl orion-gradient flex items-center justify-center text-primary-foreground">
              <Brain className="w-5 h-5" />
            </span>
            <div>
              <p className="text-xs text-muted-foreground font-mono">MOTOR DE DECISÃO</p>
              <h1 className="text-display text-foreground">Decisões da IA</h1>
              <p className="text-xs text-muted-foreground mt-1">
                Métricas viram decisões acionáveis. Aplique com 1 clique.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={seedMocks} disabled={seeding}>
              <Database className={`w-4 h-4 mr-2 ${seeding ? "animate-pulse" : ""}`} />
              {seeding ? "Semeando…" : "Semear mock"}
            </Button>
            <Button onClick={generate} disabled={generating} className="orion-gradient text-primary-foreground orion-glow hover:opacity-90">
              <Sparkles className={`w-4 h-4 mr-2 ${generating ? "animate-spin" : ""}`} />
              {generating ? "Analisando…" : "Gerar decisões"}
            </Button>
          </div>
        </div>

        <PageHelpBanner content={PAGE_HELP.decisoes} />

        {executiveRead && (
          <Card className="p-5 bg-card border-orion-violet/30 mb-6">
            <p className="text-xs text-muted-foreground font-mono mb-1">LEITURA EXECUTIVA</p>
            <p className="text-foreground">{executiveRead}</p>
          </Card>
        )}

        {loading && (
          <Card className="p-8 bg-card border-border text-center">
            <div className="w-8 h-8 mx-auto rounded-lg orion-gradient animate-pulse-glow" />
            <p className="text-sm text-muted-foreground mt-3">Carregando decisões…</p>
          </Card>
        )}

        {!loading && decisions.length === 0 && (
          <Card className="p-10 bg-card border-border text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-orion-violet/10 flex items-center justify-center">
              <Brain className="w-7 h-7 text-orion-violet-light" />
            </div>
            <h2 className="text-heading text-foreground mb-2">Nenhuma decisão ainda</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
              O Orion lê suas métricas dos últimos 14 dias e devolve decisões priorizadas:
              escalar, pausar, trocar criativo ou criar tarefa pra equipe.
              Sem dados? Use o seeder de mock.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={seedMocks} disabled={seeding}>
                <Database className="w-4 h-4 mr-2" />
                Semear métricas mock
              </Button>
              <Button onClick={generate} disabled={generating} className="orion-gradient text-primary-foreground orion-glow hover:opacity-90">
                <Sparkles className="w-4 h-4 mr-2" />
                Gerar decisões agora
              </Button>
            </div>
          </Card>
        )}

        {pending.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-heading text-foreground">Pendentes</h2>
              <span className="text-xs text-muted-foreground font-mono">{pending.length} ABERTAS</span>
            </div>
            <div className="space-y-3">
              {pending.map((d) => (
                <DecisionCard key={d.id} d={d} onApply={apply} onDismiss={dismiss} busy={applyingId === d.id} />
              ))}
            </div>
          </div>
        )}

        {handled.length > 0 && (
          <div>
            <h2 className="text-heading text-foreground mb-4">Histórico</h2>
            <div className="space-y-3">
              {handled.map((d) => (
                <DecisionCard key={d.id} d={d} onApply={apply} onDismiss={dismiss} busy={false} />
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Decisoes;
