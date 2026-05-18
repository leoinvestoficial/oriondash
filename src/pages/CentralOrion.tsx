import { Link } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DataSourceBadge } from "@/components/central/DataSourceBadge";
import { MarketingFinanceSummary } from "@/components/central/MarketingFinanceSummary";
import { FinanceTargetsDialog } from "@/components/central/FinanceTargetsDialog";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useCentralOrion, type CentralUrgency } from "@/hooks/useCentralOrion";
import { useOrionViewMode } from "@/hooks/useOrionViewMode";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Brain,
  BrainCircuit,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  Contact,
  Layers3,
  Lightbulb,
  Megaphone,
  MousePointer,
  PlayCircle,
  Settings,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const urgencyClass = (urgency: CentralUrgency) => {
  if (urgency === "alta") return "bg-destructive/15 text-destructive border-destructive/30";
  if (urgency === "media") return "bg-orion-warning/15 text-orion-warning border-orion-warning/30";
  return "bg-orion-info/15 text-orion-info border-orion-info/30";
};

const fmtCurrency = (v: number | null | undefined) =>
  v == null ? "—" : `R$ ${v.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;

const fmtPct = (v: number | null | undefined) =>
  v == null ? "—" : `${v.toFixed(2)}%`;

const fmtX = (v: number | null | undefined) =>
  v == null ? "—" : `${v.toFixed(2)}x`;

const SectionHeader = ({ title, kicker }: { title: string; kicker: string }) => (
  <div className="mb-4">
    <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground/60">{kicker}</p>
    <h2 className="text-base font-semibold text-foreground mt-0.5">{title}</h2>
  </div>
);

type CentralData = ReturnType<typeof useCentralOrion>;

// ─── Period selector ──────────────────────────────────────────────────────────

const PERIOD_OPTIONS = [
  { days: 7,  label: "7 dias" },
  { days: 30, label: "30 dias" },
];

const PeriodSelector = ({ days, onChange }: { days: number; onChange: (d: number) => void }) => (
  <div className="flex items-center gap-1 bg-muted/20 rounded-lg p-0.5">
    {PERIOD_OPTIONS.map((opt) => (
      <button
        key={opt.days}
        onClick={() => onChange(opt.days)}
        className={cn(
          "px-3 py-1 rounded-md text-xs font-medium transition-all",
          days === opt.days
            ? "bg-card text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

// ─── Pro view tab bar ─────────────────────────────────────────────────────────

const PRO_TABS = [
  { id: "pro-prioridade",   label: "Prioridade",  icon: Target },
  { id: "pro-operacao",     label: "Operação",    icon: PlayCircle },
  { id: "pro-aprovacoes",   label: "Aprovações",  icon: ClipboardCheck },
  { id: "pro-publicacoes",  label: "Publicações", icon: CalendarClock },
  { id: "pro-campanhas",    label: "Campanhas",   icon: Megaphone },
  { id: "pro-aprendizados", label: "Aprendizados",icon: Lightbulb },
] as const;

type ProTabId = typeof PRO_TABS[number]["id"];

const ProTabBar = () => {
  const [active, setActive] = useState<ProTabId>("pro-prioridade");

  const scrollTo = useCallback((id: ProTabId) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    // Use the AppLayout main scroll container so the listener fires correctly
    // when the page is laid out with overflow-auto on main, not window.
    const container =
      document.getElementById("orion-main-scroll") ?? window as unknown as HTMLElement;

    const ids = PRO_TABS.map((t) => t.id);
    const handler = () => {
      for (const id of [...ids].reverse()) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 120) { setActive(id); return; }
      }
      setActive(ids[0]);
    };
    container.addEventListener("scroll", handler, { passive: true });
    return () => container.removeEventListener("scroll", handler);
  }, []);

  return (
    <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 bg-background/96 backdrop-blur border-b border-border/60 px-4 sm:px-6 py-0">
      <div className="flex gap-0 overflow-x-auto scrollbar-none">
        {PRO_TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => scrollTo(id)}
            className={cn(
              "flex items-center gap-1.5 whitespace-nowrap px-4 py-3 text-xs font-medium border-b-2 transition-colors",
              active === id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};

// ─── Metrics grid (shared between Simplified and Pro first fold) ──────────────

const MetricsGrid = ({ data }: { data: CentralData }) => {
  const { finance } = data as any;
  const isMock = data.dataSource === "mock";
  const src: "mock" | "real" | "estimated" = isMock ? "mock" : data.dataSource === "real" ? "real" : "estimated";

  const roasStatus = finance.actualRoas != null && finance.targetRoas != null
    ? finance.actualRoas >= finance.targetRoas ? "success" : "warning"
    : undefined;
  const cpaStatus = finance.actualCpa != null && finance.targetCpa != null
    ? finance.actualCpa <= finance.targetCpa ? "success" : "warning"
    : undefined;

  return (
    <div className="space-y-3">
      {/* Mock / no-integration banner */}
      {isMock && (
        <div className="flex items-center gap-3 rounded-xl border border-orion-amber/25 bg-orion-amber/5 px-4 py-3">
          <StatusBadge variant="mock" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground">Dados demonstrativos</p>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Conecte suas campanhas para visualizar métricas reais de investimento, ROAS, CPA e conversões.
            </p>
          </div>
          <Link
            to="/integrations"
            className="shrink-0 text-[10px] text-primary/80 hover:text-primary transition-colors underline-offset-2 hover:underline font-medium whitespace-nowrap"
          >
            Conectar integrações →
          </Link>
        </div>
      )}

      {/* Row 1 — Financial KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Receita atribuída"
          value={fmtCurrency(finance.attributedRevenue)}
          icon={TrendingUp}
          source={src}
          note={finance.attributedRevenue === 0 ? "sem dado" : undefined}
          accent="success"
          href="/executive-report"
        />
        <MetricCard
          label="Investimento"
          value={fmtCurrency(finance.actualSpend)}
          icon={CircleDollarSign}
          source={src}
          note={`pacing ${finance.pacingPercentage.toFixed(0)}%`}
          status={finance.pacingPercentage > 110 ? "warning" : finance.pacingPercentage > 90 ? "neutral" : "success"}
          statusLabel={finance.pacingPercentage > 110 ? "acelerado" : "no ritmo"}
          href="/campaigns"
        />
        <MetricCard
          label="ROAS"
          value={fmtX(finance.actualRoas)}
          icon={Target}
          source={src}
          target={fmtX(finance.targetRoas)}
          status={roasStatus}
          statusLabel={roasStatus === "success" ? "acima da meta" : roasStatus === "warning" ? "abaixo da meta" : undefined}
          lowerIsBetter={false}
          empty={finance.actualRoas == null}
          emptyHref="/settings"
          href="/campaigns"
        />
        <MetricCard
          label="CAC / CPA"
          value={fmtCurrency(finance.actualCpa)}
          icon={MousePointer}
          source={src}
          target={fmtCurrency(finance.targetCpa)}
          status={cpaStatus}
          statusLabel={cpaStatus === "success" ? "dentro da meta" : cpaStatus === "warning" ? "acima da meta" : undefined}
          lowerIsBetter
          empty={finance.actualCpa == null}
          emptyHref="/settings"
          href="/campaigns"
        />
      </div>

      {/* Row 2 — Performance + Operational (compact) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <MetricCard
          label="Conversões"
          value={String((data as any).metrics?.totalConversions ?? "—")}
          icon={CheckCircle2}
          source={src}
          compact
          href="/campaigns"
        />
        <MetricCard
          label="CTR"
          value={fmtPct((data as any).metrics?.overallCtr)}
          icon={MousePointer}
          source={src}
          empty={(data as any).metrics?.overallCtr == null}
          emptyHref="/integrations"
          compact
          href="/campaigns"
        />
        <MetricCard
          label="CPC"
          value={fmtCurrency((data as any).metrics?.overallCpc)}
          icon={CircleDollarSign}
          source={src}
          empty={(data as any).metrics?.overallCpc == null}
          compact
          href="/campaigns"
        />
        <MetricCard
          label="Oportunidades"
          value={String(data.crmOpportunities || "—")}
          icon={Contact}
          source={data.crmOpportunities > 0 ? "real" : "estimated"}
          note="em aberto"
          compact
          href="/clientes"
        />
        <MetricCard
          label="Aprovações"
          value={String(data.pendingApprovals.length)}
          icon={ClipboardCheck}
          status={data.pendingApprovals.length > 0 ? "pending" : "success"}
          statusLabel={data.pendingApprovals.length > 0 ? "pendentes" : "ok"}
          compact
          href="/approvals"
        />
        <MetricCard
          label="Tarefas"
          value={String(data.pendingTasks)}
          icon={CheckCircle2}
          status={data.overdueTasks > 0 ? "urgent" : data.pendingTasks > 0 ? "pending" : "success"}
          statusLabel={data.overdueTasks > 0 ? `${data.overdueTasks} atrasadas` : data.pendingTasks > 0 ? "abertas" : "em dia"}
          compact
          href="/tasks"
        />
      </div>
    </div>
  );
};

// Helper to satisfy TypeScript for metrics inside CentralData
// (CentralData exposes finance but not raw metrics — we add a cast)
const getMetrics = (data: CentralData) => (data as any)._metrics as {
  totalConversions: number;
  overallCtr: number | null;
  overallCpc: number | null;
} | null;

// ─── Simplified view ──────────────────────────────────────────────────────────

const SimplifiedCentralView = ({
  data,
  days,
  onChangeDays,
  onConfigureFinance,
}: {
  data: CentralData;
  days: number;
  onChangeDays: (d: number) => void;
  onConfigureFinance: () => void;
}) => {
  const primaryActions = data.weeklyActions.slice(0, 3);
  const approvalCount = data.pendingApprovals.length;
  const publicationCount = data.publications.filter((job) =>
    ["awaiting_approval", "approved", "scheduled"].includes(job.status)
  ).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header className="rounded-xl border border-border/70 bg-card p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <DataSourceBadge source={data.dataSource} />
                {data.dataSource === "mock" && <StatusBadge variant="mock" />}
                <PeriodSelector days={days} onChange={onChangeDays} />
                <span className="text-xs text-muted-foreground/60 hidden sm:block">
                  Atualizado {data.lastUpdated}
                </span>
              </div>
              <h1 className="text-xl font-semibold text-foreground">
                {data.companyName ? data.companyName : "Central Orion"}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Sala de comando · {data.periodLabel}
              </p>
            </div>
            {/* Health score mini */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-center min-w-[60px]">
                <p className={cn(
                  "text-2xl font-semibold",
                  data.scoreStatus === "saudavel" ? "text-orion-success" :
                  data.scoreStatus === "atencao"  ? "text-orion-warning" : "text-destructive"
                )}>{data.score}</p>
                <p className="text-[10px] text-muted-foreground">saúde</p>
              </div>
              <div className="text-center min-w-[44px]">
                <p className="text-2xl font-semibold text-foreground">{approvalCount}</p>
                <p className="text-[10px] text-muted-foreground">aprovar</p>
              </div>
              <div className="text-center min-w-[44px]">
                <p className="text-2xl font-semibold text-foreground">{data.pendingTasks}</p>
                <p className="text-[10px] text-muted-foreground">ações</p>
              </div>
            </div>
          </div>

          {/* Env notice */}
          {data.dataNotice && (
            <div className="mt-3 rounded-lg border border-orion-amber/25 bg-orion-amber/8 px-3 py-2 text-xs text-foreground">
              {data.dataNotice}
            </div>
          )}
          {import.meta.env.VITE_ENABLE_META_PUBLICATION_PROVIDER !== "true" && (
            <div className="mt-2 rounded-lg border border-border/50 bg-muted/10 px-3 py-2 text-xs text-muted-foreground">
              Ambiente staging · publicações são demonstrativas e não enviadas para canais reais.
            </div>
          )}
        </header>

        {/* ── Metrics first fold ─────────────────────────────────────────── */}
        <MetricsGrid data={data} />

        {/* ── Priority hero ──────────────────────────────────────────────── */}
        <Card className="border-primary/25 bg-primary/5 p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl orion-gradient text-primary-foreground shrink-0">
                <Target className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground/60">Prioridade agora</p>
                <h2 className="text-lg font-semibold text-foreground leading-tight">{data.priority.title}</h2>
              </div>
            </div>
            <Badge className={cn("border text-xs shrink-0", urgencyClass(data.priority.urgency))}>
              urgência {data.priority.urgency}
            </Badge>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Por que isso importa</p>
                <p className="text-sm text-foreground">{data.priority.reason}</p>
              </div>
              <div className="rounded-lg border border-orion-amber/25 bg-orion-amber/8 p-3">
                <p className="text-[10px] font-medium text-orion-amber uppercase tracking-wider mb-1">Impacto financeiro</p>
                <p className="text-sm text-foreground">{data.priority.financialImpact}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">O Orion recomenda</p>
                <p className="text-sm text-foreground">{data.priority.recommendedAction}</p>
              </div>
            </div>
            <div className="rounded-xl border border-border/70 bg-card p-4 space-y-3">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Confiança da IA</p>
                <p className="mt-1 text-3xl font-semibold text-foreground">{data.priority.confidenceScore}%</p>
                <Progress value={data.priority.confidenceScore} className="mt-2 h-1.5" />
              </div>
              <Link to={data.priority.ctaHref}>
                <Button className="w-full gap-2 orion-gradient text-primary-foreground">
                  Resolver agora <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to={`/chat?context=central&prompt=${encodeURIComponent("Explique essa prioridade em linguagem simples e me diga o que fazer primeiro")}`}>
                <Button variant="outline" className="w-full text-xs">Entender melhor</Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* ── Quick counts ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Aguardando aprovação", value: approvalCount, sub: "bloqueando execução", href: "/approvals", icon: ClipboardCheck, urgent: approvalCount > 0 },
            { label: "Campanhas ativas",     value: data.activeCampaigns, sub: "rodando agora", href: "/campaigns", icon: Megaphone, urgent: false },
            { label: "Próximas ações",       value: primaryActions.length, sub: "foco desta semana", href: "/tasks", icon: CheckCircle2, urgent: false },
            { label: "Publicações",          value: publicationCount, sub: "agendadas/pendentes", href: "/studio", icon: CalendarClock, urgent: false },
          ].map(({ label, value, sub, href, icon: Icon, urgent }) => (
            <Link
              key={label}
              to={href}
              className={cn(
                "rounded-xl border bg-card p-4 transition-all hover:border-primary/40 hover:bg-primary/5",
                urgent && value > 0 ? "border-orion-warning/40" : "border-border/70"
              )}
            >
              <div className="mb-2 flex items-center justify-between">
                <Icon className={cn("h-4 w-4", urgent && value > 0 ? "text-orion-warning" : "text-primary/60")} />
                <span className={cn("text-2xl font-semibold", urgent && value > 0 ? "text-orion-warning" : "text-foreground")}>
                  {value}
                </span>
              </div>
              <p className="text-xs font-medium text-foreground leading-tight">{label}</p>
              <p className="text-[10px] text-muted-foreground">{sub}</p>
            </Link>
          ))}
        </div>

        {/* ── Recommended actions ────────────────────────────────────────── */}
        <Card className="border-border/70 bg-card p-5">
          <SectionHeader kicker="O QUE O ORION RECOMENDA" title="Ações desta semana" />
          <div className="space-y-2.5">
            {primaryActions.length === 0 ? (
              <div className="rounded-lg border border-border/50 bg-background/40 p-4 text-sm text-muted-foreground">
                Nenhuma ação urgente agora. Peça ao Chat Orion para montar um plano simples para hoje.
              </div>
            ) : primaryActions.map((action, i) => (
              <div key={action.id} className="rounded-lg border border-border/60 bg-background/30 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0.5">{action.type}</Badge>
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">{action.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{action.reason}</p>
                    <p className="mt-1 text-xs text-foreground/80">Impacto: {action.expectedImpact}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" onClick={() => data.createTaskFromAction(action)} className="text-xs">
                      Criar tarefa
                    </Button>
                    <Link to={action.ctaHref}>
                      <Button size="sm" variant="outline" className="text-xs">{action.ctaLabel}</Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* ── Finance + summary ──────────────────────────────────────────── */}
        <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
          <MarketingFinanceSummary finance={data.finance} onConfigure={onConfigureFinance} />
          <Card className="border-border/70 bg-card p-5">
            <SectionHeader kicker="RESUMO DA OPERAÇÃO" title="Situação atual" />
            <div className="space-y-2.5 text-sm">
              <p className="rounded-lg border border-border/50 bg-background/30 p-3 text-foreground text-xs leading-relaxed">
                {data.campaignsInMotion[0]
                  ? `Campanha em foco: ${data.campaignsInMotion[0].name}. Próxima ação: ${data.campaignsInMotion[0].recommendedAction}.`
                  : "Sem campanhas ou dados recentes. Conecte integrações para o Orion apontar a campanha em foco."}
              </p>
              {data.alerts[0] && (
                <div className="rounded-lg border border-orion-warning/25 bg-orion-warning/8 p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="h-3.5 w-3.5 text-orion-warning shrink-0" />
                    <p className="text-xs font-medium text-foreground">{data.alerts[0].title}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{data.alerts[0].description}</p>
                </div>
              )}
              <Link to="/chat?context=central&prompt=O%20que%20devo%20fazer%20hoje%3F">
                <Button variant="outline" className="w-full gap-2 text-xs">
                  Perguntar ao Chat Orion <BrainCircuit className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

// ─── Pro view ─────────────────────────────────────────────────────────────────

const ProCentralView = ({
  data,
  days,
  onChangeDays,
  onConfigureFinance,
}: {
  data: CentralData;
  days: number;
  onChangeDays: (d: number) => void;
  onConfigureFinance: () => void;
}) => {
  const metaProviderEnabled = import.meta.env.VITE_ENABLE_META_PUBLICATION_PROVIDER === "true";

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6">
        <ProTabBar />

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header className="rounded-xl border border-border/70 bg-card p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <DataSourceBadge source={data.dataSource} />
                {data.dataSource === "mock" && <StatusBadge variant="mock" />}
                <PeriodSelector days={days} onChange={onChangeDays} />
                <span className="text-xs text-muted-foreground/60">Atualizado {data.lastUpdated}</span>
              </div>
              <h1 className="text-xl font-semibold text-foreground">Central Orion</h1>
              <p className="text-sm text-muted-foreground">
                {data.companyName ? `${data.companyName} — ` : ""}Detectar, decidir, executar e aprender em um só lugar.
              </p>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center shrink-0 sm:min-w-[420px]">
              {[
                { label: "score", value: data.score },
                { label: "campanhas", value: data.activeCampaigns },
                { label: "aprovações", value: data.pendingApprovals.length },
                { label: "tarefas", value: data.pendingTasks },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg bg-background/50 border border-border/50 p-2.5">
                  <p className="text-xl font-semibold text-foreground">{value}</p>
                  <p className="text-[9px] text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>
          {data.dataNotice && (
            <div className="mt-3 rounded-lg border border-orion-amber/25 bg-orion-amber/8 px-3 py-2 text-xs text-foreground">
              {data.dataNotice}
            </div>
          )}
          {!metaProviderEnabled && (
            <div className="mt-2 rounded-lg border border-border/50 bg-muted/10 px-3 py-2 text-xs text-muted-foreground">
              Ambiente staging · publicações demonstrativas não enviadas para canais reais.
            </div>
          )}
        </header>

        {/* ── Metrics first fold ─────────────────────────────────────────── */}
        <MetricsGrid data={data} />

        {/* ── Priority ───────────────────────────────────────────────────── */}
        <Card id="pro-prioridade" className="scroll-mt-14 border-primary/25 bg-primary/5 p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg orion-gradient text-primary-foreground shrink-0">
                <Target className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground/60">Prioridade número 1</p>
                <h2 className="text-lg font-semibold text-foreground leading-tight">{data.priority.title}</h2>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <DataSourceBadge source={data.priority.dataSource} />
              <Badge className={cn("border text-xs", urgencyClass(data.priority.urgency))}>urgência {data.priority.urgency}</Badge>
              <Badge variant="outline" className="text-[9px]">{data.priority.type}</Badge>
            </div>
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-3">
              <div>
                <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground/60 mb-1">Motivo</p>
                <p className="text-sm text-foreground">{data.priority.reason}</p>
              </div>
              <div>
                <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground/60 mb-1">Evidência</p>
                <p className="text-sm text-muted-foreground">{data.priority.evidence}</p>
              </div>
              <div className="rounded-lg border border-orion-amber/25 bg-orion-amber/8 p-3">
                <p className="text-[9px] font-mono uppercase tracking-widest text-orion-amber mb-1">Impacto financeiro</p>
                <p className="text-sm text-foreground">{data.priority.financialImpact}</p>
              </div>
            </div>
            <div className="rounded-xl border border-border/70 bg-card p-4 space-y-3">
              <div>
                <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground/60">Confiança IA</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">{data.priority.confidenceScore}%</p>
                <Progress value={data.priority.confidenceScore} className="mt-1.5 h-1.5" />
              </div>
              <div>
                <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground/60">Ação recomendada</p>
                <p className="mt-1 text-xs text-foreground">{data.priority.recommendedAction}</p>
              </div>
              <Link to={data.priority.ctaHref}>
                <Button className="w-full gap-2 orion-gradient text-primary-foreground text-xs">
                  {data.priority.ctaLabel} <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
              <div className="grid grid-cols-1 gap-1.5">
                {data.priority.secondaryActions.map((action) =>
                  action.href ? (
                    <Link key={action.label} to={action.href}>
                      <Button size="sm" variant="outline" className="w-full text-xs">{action.label}</Button>
                    </Link>
                  ) : (
                    <Button
                      key={action.label}
                      size="sm"
                      variant="outline"
                      className="w-full text-xs"
                      onClick={() => {
                        if (action.action === "create_task") data.createTaskFromPriority();
                        if (action.action === "prepare_orchestration") data.prepareOrchestrationFromPriority();
                      }}
                    >
                      {action.label}
                    </Button>
                  )
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* ── Finance + Orchestrations ────────────────────────────────────── */}
        <div id="pro-operacao" className="scroll-mt-14 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <MarketingFinanceSummary finance={data.finance} onConfigure={onConfigureFinance} />
          <Card className="border-border/70 bg-card p-5">
            <SectionHeader kicker="O ORION JÁ PREPAROU" title="Ações prontas ou semi-prontas" />
            <div className="grid gap-3 md:grid-cols-2">
              {data.orchestrations.length === 0 ? (
                <div className="md:col-span-2 rounded-lg border border-border/50 bg-background/30 p-5 text-sm text-muted-foreground">
                  Quando o Orion detectar uma oportunidade, ele preparará ações aqui: tarefas, criativos, aprovações e próximos passos.
                </div>
              ) : data.orchestrations.slice(0, 4).map((item) => (
                <div key={item.id} className="rounded-lg border border-border/60 bg-background/30 p-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-foreground truncate">{item.title}</h3>
                    <Badge variant="outline" className="text-[9px] shrink-0">{item.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.reason}</p>
                  <div className="mt-3 rounded-md bg-card border border-border/50 p-2.5">
                    <p className="text-[9px] font-mono uppercase text-muted-foreground/60">Próximo passo</p>
                    <p className="text-xs text-foreground mt-0.5">{item.preparedAction}</p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Link to={item.ctaHref}><Button size="sm" variant="outline" className="text-xs">Continuar</Button></Link>
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => data.createTaskFromOrchestration(item.id)}>Tarefa</Button>
                    <Button size="sm" variant="ghost" className="text-xs" onClick={() => data.ignoreOrchestration(item.id)}>Ignorar</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ── Approvals + Weekly Actions ──────────────────────────────────── */}
        <div id="pro-aprovacoes" className="scroll-mt-14 grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
          <Card className="border-border/70 bg-card p-5">
            <SectionHeader kicker="APROVAÇÕES" title="Bloqueios operacionais" />
            <div className="space-y-2">
              {data.pendingApprovals.length === 0 ? (
                <div className="rounded-lg border border-orion-success/20 bg-orion-success/5 p-4 text-xs text-foreground">
                  Nenhuma aprovação pendente. ✓
                </div>
              ) : data.pendingApprovals.slice(0, 3).map((approval) => (
                <div key={approval.id} className="rounded-lg border border-orion-warning/25 bg-orion-warning/5 p-3">
                  <div className="flex items-start gap-2">
                    <ClipboardCheck className="mt-0.5 h-4 w-4 text-orion-warning shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <Badge variant="outline" className="text-[9px]">{approval.approvalType}</Badge>
                      </div>
                      <p className="text-sm font-medium text-foreground">{approval.title}</p>
                      <p className="text-xs text-muted-foreground">{approval.impact}</p>
                    </div>
                  </div>
                </div>
              ))}
              <Link to="/approvals">
                <Button variant="outline" size="sm" className="w-full text-xs">Ver todas as aprovações</Button>
              </Link>
            </div>
          </Card>
          <Card className="border-border/70 bg-card p-5">
            <SectionHeader kicker="EXECUÇÃO ASSISTIDA" title="Top 3 ações da semana" />
            <div className="grid gap-3 md:grid-cols-3">
              {data.weeklyActions.map((action) => (
                <div key={action.id} className="rounded-lg border border-border/60 bg-background/30 p-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <Badge variant="outline" className="text-[9px]">{action.type}</Badge>
                    <span className="text-[10px] text-muted-foreground">{action.confidenceScore}%</span>
                  </div>
                  <h3 className="text-xs font-semibold text-foreground leading-tight">{action.name}</h3>
                  <p className="mt-1.5 text-[10px] text-muted-foreground">{action.reason}</p>
                  <div className="mt-2 space-y-0.5 text-[10px] text-muted-foreground">
                    <p>Responsável: <span className="text-foreground">{action.suggestedOwner}</span></p>
                    <p>Prazo: <span className="text-foreground">{action.suggestedDueDate}</span></p>
                  </div>
                  <div className="mt-3 grid gap-1.5">
                    <Button variant="outline" size="sm" className="text-xs" onClick={() => data.createTaskFromAction(action)}>
                      Criar tarefa
                    </Button>
                    <Link to={action.ctaHref}>
                      <Button variant="ghost" size="sm" className="w-full text-xs">{action.ctaLabel}</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ── Publications ───────────────────────────────────────────────── */}
        <Card id="pro-publicacoes" className="scroll-mt-14 border-border/70 bg-card p-5">
          <SectionHeader kicker="PUBLICAÇÕES E AGENDAMENTOS" title="O que está pronto para ir ao ar" />
          <div className="grid gap-3 md:grid-cols-3">
            {data.publications.length === 0 ? (
              <div className="md:col-span-3 rounded-lg border border-border/50 bg-background/30 p-4 text-sm text-muted-foreground">
                Quando o Orion preparar posts ou anúncios, eles aparecerão aqui com status, canal e origem dos dados.
              </div>
            ) : data.publications.map((job) => (
              <div key={job.id} className="rounded-lg border border-border/60 bg-background/30 p-4">
                <div className="mb-2 flex flex-wrap items-center gap-1.5">
                  <StatusBadge variant={job.status === "approved" ? "approved" : job.status === "scheduled" ? "in-progress" : "pending"} label={job.status} />
                  <Badge variant="outline" className="text-[9px]">{job.channel}</Badge>
                  <DataSourceBadge source={job.dataOrigin} />
                </div>
                <h3 className="text-xs font-semibold text-foreground">{job.title}</h3>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {job.publicationType}{job.scheduledAt ? ` · ${new Date(job.scheduledAt).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}` : ""}
                </p>
                {(job.dataOrigin === "mock" || job.dataOrigin === "demo") && (
                  <p className="mt-2 text-[10px] text-muted-foreground/60 italic">Demonstrativo — não enviado para canal real.</p>
                )}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Link to={job.ctaHref}><Button size="sm" variant="outline" className="text-xs">Revisar</Button></Link>
                  {job.status === "approved" && (
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => data.schedulePublication(job.id)}>Agendar</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* ── Campaigns + Alerts ─────────────────────────────────────────── */}
        <div id="pro-campanhas" className="scroll-mt-14 grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
          <Card className="border-border/70 bg-card p-5">
            <SectionHeader kicker="CAMPANHAS EM MOVIMENTO" title="O que está rodando agora" />
            <div className="space-y-2">
              {data.campaignsInMotion.length === 0 ? (
                <div className="rounded-lg border border-border/50 bg-background/30 p-5 text-sm text-muted-foreground">
                  Sem campanhas com métricas recentes.
                  <Link to="/campaigns"><Button size="sm" variant="outline" className="mt-3 text-xs block">Abrir campanhas</Button></Link>
                </div>
              ) : data.campaignsInMotion.map((campaign) => (
                <div key={campaign.id} className="grid gap-3 rounded-lg border border-border/60 bg-background/30 p-3 sm:grid-cols-[1.2fr_0.7fr_0.7fr_auto] sm:items-center">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{campaign.name}</p>
                    <p className="text-[10px] text-muted-foreground">{campaign.channel} · {campaign.status}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Gasto</p>
                    <p className="text-sm text-foreground">{fmtCurrency(campaign.spend)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">{campaign.result}</p>
                    <p className="text-xs text-foreground">{campaign.performanceVsGoal}</p>
                  </div>
                  <Link to={`/campaigns/${campaign.id}`}>
                    <Button size="sm" variant="outline" className="text-xs">{campaign.recommendedAction}</Button>
                  </Link>
                </div>
              ))}
            </div>
          </Card>
          <Card className="border-border/70 bg-card p-5">
            <SectionHeader kicker="ALERTAS CRÍTICOS" title="O que exige atenção" />
            <div className="space-y-2">
              {data.alerts.length === 0 ? (
                <div className="rounded-lg border border-orion-success/20 bg-orion-success/5 p-4 text-xs text-foreground">
                  Nenhum alerta crítico. O Orion continua monitorando.
                </div>
              ) : data.alerts.map((alert) => (
                <div key={alert.id} className={cn(
                  "rounded-lg border p-3",
                  alert.severity === "alta" ? "border-destructive/25 bg-destructive/5" : "border-orion-warning/25 bg-orion-warning/5"
                )}>
                  <div className="mb-1 flex items-center gap-2">
                    <AlertTriangle className={cn("h-3.5 w-3.5", alert.severity === "alta" ? "text-destructive" : "text-orion-warning")} />
                    <p className="text-xs font-semibold text-foreground">{alert.title}</p>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{alert.description}</p>
                  <Link to={alert.ctaHref}>
                    <Button variant="ghost" size="sm" className="mt-1.5 px-0 h-auto text-xs">{alert.ctaLabel}</Button>
                  </Link>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ── Learnings + Shortcuts ───────────────────────────────────────── */}
        <div id="pro-aprendizados" className="scroll-mt-14 grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
          <Card className="border-border/70 bg-card p-5">
            <SectionHeader kicker="APRENDIZADOS" title="Memória operacional recente" />
            <div className="space-y-2">
              {data.learnings.length === 0 ? (
                <div className="rounded-lg border border-border/50 bg-background/30 p-4 text-xs text-muted-foreground">
                  Resultados de campanhas e decisões alimentarão esta memória.
                </div>
              ) : data.learnings.map((learning) => (
                <div key={learning.id} className="rounded-lg border border-border/60 bg-background/30 p-3">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="h-3.5 w-3.5 text-orion-amber shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground leading-tight">{learning.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{learning.summary || learning.content}</p>
                    </div>
                  </div>
                </div>
              ))}
              <Link to="/cerebro">
                <Button variant="ghost" size="sm" className="w-full text-xs">Ver Company Brain →</Button>
              </Link>
            </div>
          </Card>
          <Card className="border-border/70 bg-card p-5">
            <SectionHeader kicker="ATALHOS" title="Ação rápida" />
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Criativos", href: "/studio",           icon: Sparkles },
                { label: "Campanha",  href: "/campaigns",        icon: Megaphone },
                { label: "Relatório", href: "/executive-report", icon: BadgeCheck },
                { label: "Chat",      href: "/chat?context=central&prompt=O%20que%20devo%20fazer%20hoje%3F", icon: BrainCircuit },
                { label: "Tarefa",    href: "/tasks",            icon: CheckCircle2 },
                { label: "Funil",     href: "/funnels",          icon: Layers3 },
                { label: "Agenda",    href: "/calendar",         icon: CalendarClock },
                { label: "Decisão",   href: "/decisoes",         icon: Zap },
              ].map(({ label, href, icon: Icon }) => (
                <Link key={label} to={href}>
                  <Button variant="outline" className="h-10 w-full justify-start gap-2 text-xs">
                    <Icon className="h-3.5 w-3.5 shrink-0" /> {label}
                  </Button>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

// ─── Root page ────────────────────────────────────────────────────────────────

const CentralOrion = () => {
  const [days, setDays] = useState(7);
  const data = useCentralOrion(days);
  const { viewMode } = useOrionViewMode();
  const [financeOpen, setFinanceOpen] = useState(false);

  if (data.loading) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6 animate-pulse">
          <div className="h-28 rounded-xl bg-card border border-border/60" />
          <div className="grid gap-3 grid-cols-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-card border border-border/60" />)}
          </div>
          <div className="grid gap-3 grid-cols-6">
            {[...Array(6)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-card border border-border/60" />)}
          </div>
          <div className="h-48 rounded-xl bg-card border border-border/60" />
        </div>
      </AppLayout>
    );
  }

  if (!data.companyName) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
          <div className="w-16 h-16 rounded-2xl orion-gradient flex items-center justify-center orion-glow mb-6">
            <Brain className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-3">Configure o Company DNA</h1>
          <p className="text-muted-foreground max-w-md mb-8 text-sm leading-relaxed">
            O Orion precisa conhecer sua empresa para operar como seu head de marketing, organizar prioridades e fazer recomendações contextuais.
          </p>
          <Link to="/onboarding">
            <Button className="orion-gradient text-primary-foreground rounded-xl px-6 py-3 gap-2">
              <Brain className="w-4 h-4" />
              Iniciar Company DNA
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {viewMode === "simplified" ? (
        <SimplifiedCentralView
          data={data}
          days={days}
          onChangeDays={setDays}
          onConfigureFinance={() => setFinanceOpen(true)}
        />
      ) : (
        <ProCentralView
          data={data}
          days={days}
          onChangeDays={setDays}
          onConfigureFinance={() => setFinanceOpen(true)}
        />
      )}
      <FinanceTargetsDialog open={financeOpen} onOpenChange={setFinanceOpen} onSaved={data.refetch} />
    </AppLayout>
  );
};

export default CentralOrion;
