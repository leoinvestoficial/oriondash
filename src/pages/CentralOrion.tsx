import { Link } from "react-router-dom";
import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DataSourceBadge } from "@/components/central/DataSourceBadge";
import { MarketingFinanceSummary } from "@/components/central/MarketingFinanceSummary";
import { FinanceTargetsDialog } from "@/components/central/FinanceTargetsDialog";
import { useCentralOrion, type CentralUrgency } from "@/hooks/useCentralOrion";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  Gauge,
  Layers3,
  Lightbulb,
  Megaphone,
  PlayCircle,
  Sparkles,
  Target,
} from "lucide-react";

const urgencyClass = (urgency: CentralUrgency) => {
  if (urgency === "alta") return "bg-destructive/15 text-destructive border-destructive/30";
  if (urgency === "media") return "bg-orion-warning/15 text-orion-warning border-orion-warning/30";
  return "bg-orion-info/15 text-orion-info border-orion-info/30";
};

const currency = (value: number) => `R$ ${value.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;

const SectionHeader = ({ title, kicker }: { title: string; kicker: string }) => (
  <div className="mb-3">
    <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{kicker}</p>
    <h2 className="text-base font-semibold text-foreground">{title}</h2>
  </div>
);

const CentralOrion = () => {
  const data = useCentralOrion();
  const [financeOpen, setFinanceOpen] = useState(false);
  const metaProviderEnabled = import.meta.env.VITE_ENABLE_META_PUBLICATION_PROVIDER === "true";

  if (data.loading) {
    return (
      <AppLayout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 rounded-lg orion-gradient animate-pulse-glow" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6">
          <header className="rounded-xl border border-border bg-card p-4 sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <DataSourceBadge source={data.dataSource} />
                  <span className="text-xs text-muted-foreground">{data.periodLabel}</span>
                  <span className="text-xs text-muted-foreground">Atualizado {data.lastUpdated}</span>
                </div>
                <h1 className="text-display text-foreground">Central Orion</h1>
                <p className="text-sm text-muted-foreground">
                  {data.companyName ? `${data.companyName} — ` : ""}Detectar, decidir, executar e aprender em um so lugar.
                </p>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center sm:min-w-[460px]">
                <div className="rounded-lg bg-background/60 p-3">
                  <p className="text-xl font-semibold text-foreground">{data.score}</p>
                  <p className="text-[10px] text-muted-foreground">score</p>
                </div>
                <div className="rounded-lg bg-background/60 p-3">
                  <p className="text-xl font-semibold text-foreground">{data.activeCampaigns}</p>
                  <p className="text-[10px] text-muted-foreground">campanhas ativas</p>
                </div>
                <div className="rounded-lg bg-background/60 p-3">
                  <p className="text-xl font-semibold text-foreground">{data.pendingApprovals.length}</p>
                  <p className="text-[10px] text-muted-foreground">aprovações</p>
                </div>
                <div className="rounded-lg bg-background/60 p-3">
                  <p className="text-xl font-semibold text-foreground">{data.pendingTasks}</p>
                  <p className="text-[10px] text-muted-foreground">tarefas abertas</p>
                </div>
              </div>
            </div>
            {data.dataNotice && (
              <div className="mt-4 rounded-lg border border-orion-amber/30 bg-orion-amber/10 px-3 py-2 text-sm text-foreground">
                {data.dataNotice}
              </div>
            )}
            {!metaProviderEnabled && (
              <div className="mt-3 rounded-lg border border-orion-coral/30 bg-orion-coral/10 px-3 py-2 text-sm text-foreground">
                Ambiente staging/mock: publicações demonstrativas ficam registradas apenas no Orion. Meta/Instagram real está desativado e nada é enviado para canais reais.
              </div>
            )}
          </header>

          <Card className="border-primary/30 bg-primary/5 p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg orion-gradient text-primary-foreground">
                    <Target className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs font-mono text-muted-foreground">PRIORIDADE NUMERO 1</p>
                    <h2 className="text-xl font-semibold text-foreground">{data.priority.title}</h2>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <DataSourceBadge source={data.priority.dataSource} />
                  <Badge className={cn("border", urgencyClass(data.priority.urgency))}>urgência {data.priority.urgency}</Badge>
                  <Badge variant="outline" className="text-[10px]">{data.priority.type}</Badge>
                </div>
              </div>
              <div className="grid gap-3 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-3">
                  <div>
                    <p className="text-[10px] font-mono uppercase text-muted-foreground">Motivo</p>
                    <p className="text-sm text-foreground">{data.priority.reason}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono uppercase text-muted-foreground">Evidência</p>
                    <p className="text-sm text-muted-foreground">{data.priority.evidence}</p>
                  </div>
                  <div className="rounded-lg border border-orion-amber/30 bg-orion-amber/10 p-3">
                    <p className="text-[10px] font-mono uppercase text-orion-amber">Impacto financeiro</p>
                    <p className="text-sm text-foreground">{data.priority.financialImpact}</p>
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-card p-4">
                  <p className="text-[10px] font-mono uppercase text-muted-foreground">Confiança IA</p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">{data.priority.confidenceScore}%</p>
                  <Progress value={data.priority.confidenceScore} className="mt-2" />
                  <p className="mt-3 text-[10px] font-mono uppercase text-muted-foreground">Autonomia</p>
                  <p className="text-xs text-foreground">{data.priority.autonomyLevel}</p>
                  <p className="mt-4 text-[10px] font-mono uppercase text-muted-foreground">Ação recomendada</p>
                  <p className="mt-1 text-sm text-foreground">{data.priority.recommendedAction}</p>
                  <Link to={data.priority.ctaHref}>
                    <Button className="mt-4 w-full gap-2 orion-gradient text-primary-foreground">
                      {data.priority.ctaLabel} <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  <div className="mt-2 grid grid-cols-1 gap-2">
                    {data.priority.secondaryActions.map((action) => (
                      action.href ? (
                        <Link key={action.label} to={action.href}>
                          <Button size="sm" variant="outline" className="w-full">{action.label}</Button>
                        </Link>
                      ) : (
                        <Button
                          key={action.label}
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            if (action.action === "create_task") data.createTaskFromPriority();
                            if (action.action === "prepare_orchestration") data.prepareOrchestrationFromPriority();
                          }}
                        >
                          {action.label}
                        </Button>
                      )
                    ))}
                  </div>
                </div>
              </div>
            </Card>

          <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
            <MarketingFinanceSummary finance={data.finance} onConfigure={() => setFinanceOpen(true)} />

            <Card className="border-border bg-card p-5">
              <SectionHeader kicker="O ORION JÁ PREPAROU" title="Ações prontas ou semi-prontas" />
              <div className="grid gap-3 md:grid-cols-2">
                {data.orchestrations.length === 0 ? (
                  <div className="md:col-span-2 rounded-lg border border-border bg-background/40 p-5 text-sm text-muted-foreground">
                    Quando o Orion detectar uma oportunidade ou problema, ele vai preparar ações aqui: tarefas, criativos, aprovações e próximos passos.
                  </div>
                ) : data.orchestrations.slice(0, 4).map((item) => (
                  <div key={item.id} className="rounded-lg border border-border bg-background/40 p-4">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                      <Badge variant="outline" className="text-[10px]">{item.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{item.reason}</p>
                    <div className="mt-3 rounded-md bg-card p-3">
                      <p className="text-[10px] font-mono uppercase text-muted-foreground">Próximo passo</p>
                      <p className="text-sm text-foreground">{item.preparedAction}</p>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[10px] text-muted-foreground">{item.autonomyLevel}</span>
                      <div className="flex gap-2">
                        <Link to={item.ctaHref}><Button size="sm" variant="outline">Continuar</Button></Link>
                        <Button size="sm" variant="outline" onClick={() => data.createTaskFromOrchestration(item.id)}>Criar tarefa</Button>
                        <Button size="sm" variant="outline" onClick={() => data.requestApprovalFromOrchestration(item.id)}>Solicitar aprovação</Button>
                        <Button size="sm" variant="ghost" onClick={() => data.ignoreOrchestration(item.id)}>Ignorar</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
            <Card className="border-border bg-card p-5">
              <SectionHeader kicker="APROVAÇÕES" title="Bloqueios operacionais" />
              <div className="space-y-2">
                {data.pendingApprovals.length === 0 ? (
                  <div className="rounded-lg border border-border bg-background/40 p-4 text-sm text-muted-foreground">
                    Nada aguardando aprovação.
                  </div>
                ) : data.pendingApprovals.slice(0, 3).map((approval) => (
                  <div key={approval.id} className="rounded-lg border border-border bg-background/40 p-3">
                    <div className="flex items-start gap-2">
                      <ClipboardCheck className="mt-0.5 h-4 w-4 text-primary" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">{approval.approvalType}</Badge>
                          <span className="text-[10px] text-muted-foreground">{approval.status}</span>
                        </div>
                        <p className="mt-1 text-sm font-medium text-foreground">{approval.title}</p>
                        <p className="text-xs text-muted-foreground">{approval.impact}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          Solicitante: {approval.requester} {approval.dueDate ? `· Prazo: ${approval.dueDate}` : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                <Link to="/approvals"><Button variant="outline" size="sm" className="w-full">Ir para Aprovações</Button></Link>
              </div>
            </Card>

            <Card className="border-border bg-card p-5">
              <SectionHeader kicker="EXECUÇÃO ASSISTIDA" title="Top 3 ações da semana" />
              <div className="grid gap-3 md:grid-cols-3">
                {data.weeklyActions.map((action) => (
                  <div key={action.id} className="rounded-lg border border-border bg-background/40 p-4">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <Badge variant="outline" className="text-[10px]">{action.type}</Badge>
                      <span className="text-[10px] text-muted-foreground">{action.confidenceScore}% conf.</span>
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">{action.name}</h3>
                    <p className="mt-2 text-xs text-muted-foreground">{action.reason}</p>
                    <p className="mt-2 text-xs text-foreground">{action.expectedImpact}</p>
                    <div className="mt-3 space-y-1 text-[11px] text-muted-foreground">
                      <p>Responsável: <span className="text-foreground">{action.suggestedOwner}</span></p>
                      <p>Prazo: <span className="text-foreground">{action.suggestedDueDate}</span></p>
                    </div>
                    <div className="mt-4 grid gap-2">
                      <Button variant="outline" size="sm" onClick={() => data.createTaskFromAction(action)}>Criar tarefa</Button>
                      <Link to={action.ctaHref}><Button variant="ghost" size="sm" className="w-full">{action.ctaLabel}</Button></Link>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card className="border-border bg-card p-5">
            <SectionHeader kicker="PUBLICAÇÕES E AGENDAMENTOS" title="O que está pronto para ir ao ar" />
            <div className="grid gap-3 md:grid-cols-3">
              {data.publications.length === 0 ? (
                <div className="md:col-span-3 rounded-lg border border-border bg-background/40 p-4 text-sm text-muted-foreground">
                  Quando o Orion preparar posts, anúncios ou mensagens, eles aparecerão aqui com aprovação, agendamento e origem dos dados.
                </div>
              ) : data.publications.map((job) => (
                <div key={job.id} className="rounded-lg border border-border bg-background/40 p-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{job.status}</Badge>
                    <Badge variant="outline" className="text-[10px]">{job.channel}</Badge>
                    <DataSourceBadge source={job.dataOrigin} />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">{job.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {job.publicationType} {job.scheduledAt ? `· ${new Date(job.scheduledAt).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}` : "· sem horário"}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {job.requiresApproval ? "Exige aprovação humana antes de publicar/agendar." : "Dentro da política configurada para automação parcial."}
                  </p>
                  {job.dataOrigin === "mock" || job.dataOrigin === "demo" ? (
                    <p className="mt-2 rounded-md border border-orion-coral/30 bg-orion-coral/10 px-2 py-1.5 text-xs text-foreground">
                      Publicação demonstrativa - não enviada para canal real. Ação registrada apenas dentro do Orion.
                    </p>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link to={job.ctaHref}><Button size="sm" variant="outline">Revisar</Button></Link>
                    {job.status === "approved" && <Button size="sm" variant="outline" onClick={() => data.schedulePublication(job.id)}>Agendar</Button>}
                    {job.status === "scheduled" && <Button size="sm" variant="ghost" onClick={() => data.cancelPublication(job.id)}>Cancelar</Button>}
                    {job.status === "failed" && <Link to="/chat?context=central&prompt=Explique%20por%20que%20a%20publica%C3%A7%C3%A3o%20falhou"><Button size="sm" variant="ghost">Ver contexto</Button></Link>}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
            <div className="space-y-5">
              <Card className="border-border bg-card p-5">
                <SectionHeader kicker="CAMPANHAS EM MOVIMENTO" title="O que está rodando agora" />
                <div className="space-y-2">
                  {data.campaignsInMotion.length === 0 ? (
                    <div className="rounded-lg border border-border bg-background/40 p-5 text-sm text-muted-foreground">
                      Nenhuma campanha com métrica recente. Crie uma campanha ou conecte dados reais.
                      <Link to="/campaigns"><Button size="sm" variant="outline" className="mt-3 block">Abrir campanhas</Button></Link>
                    </div>
                  ) : data.campaignsInMotion.map((campaign) => (
                    <div key={campaign.id} className="grid gap-3 rounded-lg border border-border bg-background/40 p-3 sm:grid-cols-[1.2fr_0.7fr_0.7fr_auto] sm:items-center">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{campaign.name}</p>
                        <p className="text-xs text-muted-foreground">{campaign.channel} · {campaign.status}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Gasto</p>
                        <p className="text-sm text-foreground">{currency(campaign.spend)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{campaign.result}</p>
                        <p className="text-sm text-foreground">{campaign.performanceVsGoal}</p>
                      </div>
                      <Link to="/campaigns">
                        <Button size="sm" variant="outline">{campaign.recommendedAction}</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </Card>

            </div>

            <div className="space-y-5">
              <Card className="border-border bg-card p-5">
                <SectionHeader kicker="ALERTAS CRÍTICOS" title="O que exige atenção" />
                <div className="space-y-2">
                  {data.alerts.length === 0 ? (
                    <div className="rounded-lg border border-orion-success/20 bg-orion-success/5 p-4 text-sm text-foreground">
                      Nenhum alerta crítico agora. O Orion continua monitorando.
                    </div>
                  ) : data.alerts.map((alert) => (
                    <div key={alert.id} className="rounded-lg border border-border bg-background/40 p-3">
                      <div className="mb-1 flex items-center gap-2">
                        <AlertTriangle className={cn("h-4 w-4", alert.severity === "alta" ? "text-destructive" : "text-orion-warning")} />
                        <p className="text-sm font-medium text-foreground">{alert.title}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{alert.description}</p>
                      <Link to={alert.ctaHref}><Button variant="ghost" size="sm" className="mt-2 px-0">{alert.ctaLabel}</Button></Link>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="border-border bg-card p-5">
                <SectionHeader kicker="APRENDIZADOS" title="Memória operacional recente" />
                <div className="space-y-2">
                  {data.learnings.length === 0 ? (
                    <div className="rounded-lg border border-border bg-background/40 p-4 text-sm text-muted-foreground">
                      Ainda não há aprendizado registrado. Resultados de campanhas alimentarão esta memória.
                    </div>
                  ) : data.learnings.map((learning) => (
                    <div key={learning.id} className="rounded-lg border border-border bg-background/40 p-3">
                      <div className="mb-1 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-orion-amber" />
                        <Badge variant="outline" className="text-[10px]">
                          {learning.source === "system_derived"
                            ? "aprendizado derivado"
                            : learning.tags?.includes("performance_validated")
                              ? "validado por performance"
                              : "evento registrado"}
                        </Badge>
                        <p className="text-sm font-medium text-foreground">{learning.title}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{learning.summary || learning.content}</p>
                    </div>
                  ))}
                  <Link to="/cerebro"><Button variant="ghost" size="sm" className="w-full">Ver base estratégica</Button></Link>
                </div>
              </Card>

              <Card className="border-border bg-card p-5">
                <SectionHeader kicker="ATALHOS" title="Preparar próxima execução" />
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Criativos", href: "/studio", icon: Sparkles },
                    { label: "Campanha", href: "/campaigns", icon: Megaphone },
                    { label: "Relatório", href: "/executive-report", icon: BadgeCheck },
                    { label: "Chat", href: "/chat?context=central&prompt=O%20que%20devo%20fazer%20hoje%3F", icon: BrainCircuit },
                    { label: "Tarefa", href: "/tasks", icon: CheckCircle2 },
                    { label: "Funil", href: "/funnels", icon: Layers3 },
                    { label: "Agenda", href: "/calendar", icon: CalendarClock },
                    { label: "Decisão", href: "/decisoes", icon: PlayCircle },
                  ].map(({ label, href, icon: Icon }) => (
                    <Link key={label} to={href}>
                      <Button variant="outline" className="h-12 w-full justify-start gap-2">
                        <Icon className="h-4 w-4" /> {label}
                      </Button>
                    </Link>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <FinanceTargetsDialog open={financeOpen} onOpenChange={setFinanceOpen} onSaved={data.refetch} />
    </AppLayout>
  );
};

export default CentralOrion;
