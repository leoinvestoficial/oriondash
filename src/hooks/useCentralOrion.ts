import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyDNA } from "@/hooks/useCompanyDNA";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { useDiagnostic } from "@/hooks/useDiagnostic";
import { useDecisions, type DecisionRecord } from "@/hooks/useDecisions";
import { useBrain, type MemoryRecord } from "@/hooks/useBrain";
import { useBusinessMetrics } from "@/hooks/useBusinessMetrics";
import { useActionOrchestrations, type AutonomyLevel, type OrchestrationStatus } from "@/hooks/useActionOrchestrations";
import { useMarketingFinanceTargets } from "@/hooks/useMarketingFinanceTargets";
import { usePublicationJobs, type PublicationJob } from "@/hooks/usePublicationJobs";
import type { DataSourceKind } from "@/components/central/DataSourceBadge";
import type { MarketingFinanceData } from "@/components/central/MarketingFinanceSummary";
import { toast } from "sonner";
import { createOperationalMemoryFromEvent } from "@/lib/operationalMemory";
import { deriveOperationalLearning, derivedLearningToMemoryRecord } from "@/lib/deriveOperationalLearning";

export type CentralActionType = "campaign" | "creative" | "funnel" | "budget" | "approval" | "report" | "task" | "finance" | "data_quality";
export type CentralUrgency = "alta" | "media" | "baixa";
export type PriorityType = "risco" | "oportunidade" | "aprovação" | "financeiro" | "campanha" | "criativo" | "funil" | "dados";

export interface CentralCTA {
  label: string;
  href?: string;
  action?: "create_task" | "prepare_orchestration" | "ignore";
}

export interface CentralPriority {
  title: string;
  type: PriorityType;
  reason: string;
  evidence: string;
  financialImpact: string;
  urgency: CentralUrgency;
  confidenceScore: number;
  dataSource: DataSourceKind;
  autonomyLevel: AutonomyLevel;
  recommendedAction: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryActions: CentralCTA[];
  relatedDecisionId?: string;
  relatedCampaignId?: string | null;
}

export interface WeeklyAction {
  id: string;
  name: string;
  type: CentralActionType;
  expectedImpact: string;
  reason: string;
  suggestedOwner: string;
  suggestedDueDate: string;
  confidenceScore: number;
  ctaLabel: string;
  ctaHref: string;
  sourceId?: string;
  relatedCampaignId?: string | null;
}

export interface CentralAlert {
  id: string;
  title: string;
  description: string;
  severity: CentralUrgency;
  ctaLabel: string;
  ctaHref: string;
}

export interface CampaignMotion {
  id: string;
  name: string;
  channel: string;
  status: string;
  spend: number;
  result: string;
  performanceVsGoal: string;
  recommendedAction: string;
}

export interface PendingApproval {
  id: string;
  title: string;
  approvalType: string;
  impact: string;
  createdAt: string;
  status: string;
  requester: string;
  dueDate: string | null;
}

export interface ActionOrchestrationCard {
  id: string;
  title: string;
  reason: string;
  evidence: string;
  impact: string;
  preparedAction: string;
  status: OrchestrationStatus;
  autonomyLevel: AutonomyLevel;
  ctaHref: string;
}

export interface PublicationCard {
  id: string;
  title: string;
  channel: string;
  publicationType: string;
  scheduledAt: string | null;
  status: string;
  dataOrigin: DataSourceKind;
  requiresApproval: boolean;
  ctaHref: string;
}

export interface CentralOrionData {
  loading: boolean;
  companyName: string | null;
  periodLabel: string;
  lastUpdated: string;
  dataSource: DataSourceKind;
  score: number;
  scoreStatus: "saudavel" | "atencao" | "critico";
  scoreExplanation: string;
  scoreDeltaLabel: string;
  priority: CentralPriority;
  weeklyActions: WeeklyAction[];
  alerts: CentralAlert[];
  campaignsInMotion: CampaignMotion[];
  pendingApprovals: PendingApproval[];
  orchestrations: ActionOrchestrationCard[];
  publications: PublicationCard[];
  learnings: MemoryRecord[];
  finance: MarketingFinanceData;
  activeCampaigns: number;
  pendingTasks: number;
  hasNonRealData: boolean;
  dataNotice: string | null;
  createTaskFromPriority: () => Promise<void>;
  createTaskFromAction: (action: WeeklyAction) => Promise<void>;
  prepareOrchestrationFromPriority: () => Promise<void>;
  ignoreOrchestration: (id: string) => Promise<void>;
  createTaskFromOrchestration: (id: string) => Promise<void>;
  requestApprovalFromOrchestration: (id: string) => Promise<void>;
  schedulePublication: (id: string) => Promise<void>;
  cancelPublication: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

interface ApprovalRow {
  id: string;
  title: string;
  category: string;
  impact: string;
  status: string;
  created_at: string;
  requested_by?: string | null;
  due_date?: string | null;
}

interface TaskRow {
  id: string;
  title: string;
  status: string;
  due_date: string | null;
  priority: string;
}

const fmtCurrency = (value: number) =>
  `R$ ${value.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;

const dueDateInDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
};

const dueLabelInDays = (days: number) => {
  const date = new Date(dueDateInDays(days));
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
};

const severityFromDecision = (decision?: DecisionRecord): CentralUrgency => {
  if (!decision) return "media";
  if (decision.severity === "alta") return "alta";
  if (decision.severity === "baixa") return "baixa";
  return "media";
};

export const useCentralOrion = (): CentralOrionData => {
  const { user } = useAuth();
  const { dna, loading: dnaLoading } = useCompanyDNA();
  const { metrics, loading: metricsLoading } = useDashboardMetrics(7);
  const { latest: diagnostic, loading: diagnosticLoading } = useDiagnostic();
  const { decisions, loading: decisionsLoading } = useDecisions();
  const { memories, loading: memoriesLoading } = useBrain();
  const { latest: businessMetrics, loading: businessLoading } = useBusinessMetrics(dna?.id);
  const {
    orchestrations: persistedOrchestrations,
    loading: orchestrationsLoading,
    available: orchestrationsAvailable,
    create: createOrchestration,
    ignore: ignorePersistedOrchestration,
    createTask: createTaskFromPersistedOrchestration,
    requestApproval: requestApprovalFromPersistedOrchestration,
    refetch: refetchOrchestrations,
  } = useActionOrchestrations();
  const {
    jobs: publicationJobs,
    loading: publicationsLoading,
    schedule: schedulePersistedPublication,
    cancel: cancelPersistedPublication,
    refetch: refetchPublications,
  } = usePublicationJobs();
  const { target: financeTarget, loading: financeTargetLoading } = useMarketingFinanceTargets();
  const [approvals, setApprovals] = useState<ApprovalRow[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [localLoading, setLocalLoading] = useState(true);

  const fetchOperationalData = useCallback(async () => {
    if (!user) {
      setLocalLoading(false);
      return;
    }

    setLocalLoading(true);
    const [approvalsRes, tasksRes] = await Promise.all([
      supabase
        .from("approvals")
        .select("id,title,category,impact,status,created_at,requested_by,due_date")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("tasks")
        .select("id,title,status,due_date,priority")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    setApprovals((approvalsRes.data as ApprovalRow[]) || []);
    setTasks((tasksRes.data as TaskRow[]) || []);
    setLocalLoading(false);
  }, [user]);

  useEffect(() => { fetchOperationalData(); }, [fetchOperationalData]);

  const pendingDecisions = useMemo(() => decisions.filter((d) => d.status === "pending"), [decisions]);
  const primaryDecision = pendingDecisions[0];

  const dataSource: DataSourceKind = metrics?.hasMockData ? "mock" : metrics?.hasData ? "real" : "estimated";
  const hasNonRealData = dataSource !== "real";
  const dataNotice = metrics?.hasMockData
    ? "Esta conta contém dados demonstrativos. Conecte integrações reais para recomendações mais precisas."
    : dataSource === "estimated"
      ? "Algumas recomendações usam estimativas locais porque ainda faltam dados reais suficientes."
      : null;
  const activeCampaigns = metrics?.campaignsList.filter((c) => c.status === "active").length || 0;
  const pendingTasks = tasks.filter((t) => t.status !== "done").length;
  const pendingApprovals = approvals.filter((a) => a.status === "pending");

  const finance: MarketingFinanceData = useMemo(() => {
    const plannedSpend = financeTarget?.monthly_budget || metrics?.campaignsList.reduce((sum, campaign) => sum + Math.max(campaign.spend, 0), 0) || 0;
    const actualSpend = metrics?.totalSpend || 0;
    const attributedRevenue = metrics?.totalRevenue || 0;
    const targetCpa = financeTarget?.target_cpa || businessMetrics?.cac_current || null;
    const actualCpa = metrics?.overallCpa || null;
    const targetRoas = financeTarget?.target_roas || businessMetrics?.avg_roas || null;
    const actualRoas = metrics?.overallRoas || null;
    const estimatedMargin = financeTarget?.estimated_margin || businessMetrics?.avg_margin_pct || null;
    const avgTicket = businessMetrics?.avg_ticket || null;
    const breakEvenCpa = financeTarget?.break_even_cpa || (avgTicket != null && estimatedMargin != null ? avgTicket * (estimatedMargin / 100) : null);
    const estimatedProfit = estimatedMargin != null ? attributedRevenue * (estimatedMargin / 100) - actualSpend : null;
    const wastedSpendEstimate =
      actualCpa != null && targetCpa != null && actualCpa > targetCpa && metrics?.totalConversions
        ? (actualCpa - targetCpa) * metrics.totalConversions
        : 0;

    return {
      plannedSpend,
      actualSpend,
      pacingPercentage: plannedSpend > 0 ? (actualSpend / plannedSpend) * 100 : actualSpend > 0 ? 100 : 0,
      attributedRevenue,
      actualCpa,
      targetCpa,
      actualRoas,
      targetRoas,
      estimatedMargin,
      breakEvenCpa,
      estimatedProfit,
      wastedSpendEstimate,
    } as MarketingFinanceData;
  }, [businessMetrics, financeTarget, metrics]);

  const score = diagnostic?.score ?? Math.round(Math.min(92, Math.max(42, (metrics?.overallRoas || 1.4) * 18 + activeCampaigns * 4 + (pendingApprovals.length ? -8 : 8))));
  const scoreStatus = score >= 75 ? "saudavel" : score >= 55 ? "atencao" : "critico";

  const priority: CentralPriority = useMemo(() => {
    if (primaryDecision) {
      const waste = finance.wastedSpendEstimate > 0 ? `Risco de desperdício de ${fmtCurrency(finance.wastedSpendEstimate)} se o ritmo continuar.` : primaryDecision.expected_impact;
      return {
        title: primaryDecision.title,
        type: primaryDecision.action_type.includes("budget") ? "financeiro" : primaryDecision.action_type.includes("creative") ? "criativo" : "campanha",
        reason: primaryDecision.rationale,
        evidence: primaryDecision.evidence || "Baseado no snapshot recente de performance.",
        financialImpact: waste,
        urgency: severityFromDecision(primaryDecision),
        confidenceScore: (primaryDecision as any).confidence_score ?? 82,
        dataSource,
        autonomyLevel: "assisted_execution",
        recommendedAction: primaryDecision.expected_impact || "Transformar recomendação em execução assistida.",
        ctaLabel: primaryDecision.action_type.includes("creative") || primaryDecision.action_type === "refresh_creative" ? "Gerar criativos" : "Aplicar decisão",
        ctaHref: primaryDecision.action_type.includes("creative") || primaryDecision.action_type === "refresh_creative" ? "/studio" : "/decisoes",
        relatedDecisionId: primaryDecision.id,
        relatedCampaignId: primaryDecision.campaign_id,
        secondaryActions: [
          { label: "Criar tarefa", action: "create_task" },
          { label: "Preparar orquestração", action: "prepare_orchestration" },
          { label: "Ver decisão", href: "/decisoes" },
          ...(primaryDecision.campaign_id ? [{ label: "Ver campanha", href: "/campaigns" }] : []),
        ],
      };
    }

    if (finance.actualCpa != null && finance.targetCpa != null && finance.actualCpa > finance.targetCpa) {
      return {
        title: "CPA acima do alvo definido",
        type: "financeiro",
        reason: "O custo por aquisição atual passou do limite informado nas métricas de negócio.",
        evidence: `CPA atual ${fmtCurrency(finance.actualCpa)} vs alvo ${fmtCurrency(finance.targetCpa)}.`,
        financialImpact: finance.wastedSpendEstimate > 0 ? `Desperdício estimado de ${fmtCurrency(finance.wastedSpendEstimate)}.` : "Impacto financeiro estimado depende de margem e conversões.",
        urgency: "alta",
        confidenceScore: 78,
        dataSource,
        autonomyLevel: "insight_only",
        recommendedAction: "Revisar campanha, oferta e criativos antes de aumentar verba.",
        ctaLabel: "Criar plano de correção",
        ctaHref: "/decisoes",
        secondaryActions: [
          { label: "Criar tarefa", action: "create_task" },
          { label: "Gerar criativos", href: "/studio" },
          { label: "Ver campanhas", href: "/campaigns" },
        ],
      };
    }

    if (pendingApprovals.length > 0) {
      return {
        title: "Aprovações pendentes travando execução",
        type: "aprovação",
        reason: "Há itens aguardando decisão humana para o marketing continuar andando.",
        evidence: `${pendingApprovals.length} aprovação(ões) pendente(s).`,
        financialImpact: "Atrasos de aprovação podem segurar testes, criativos e campanhas.",
        urgency: "media",
        confidenceScore: 88,
        dataSource,
        autonomyLevel: "insight_only",
        recommendedAction: "Revisar e aprovar ou pedir ajuste nos itens pendentes.",
        ctaLabel: "Revisar aprovações",
        ctaHref: "/approvals",
        secondaryActions: [
          { label: "Ver contexto", href: "/approvals" },
          { label: "Criar tarefa", action: "create_task" },
        ],
      };
    }

    return {
      title: "Definir a próxima aposta da semana",
      type: metrics?.hasData ? "oportunidade" : "dados",
      reason: "Não há decisão crítica pendente; o melhor ganho agora é transformar dados em uma ação priorizada.",
      evidence: metrics?.hasData ? "Métricas recentes disponíveis para leitura executiva." : "Ainda faltam dados reais conectados.",
      financialImpact: metrics?.hasData ? `Receita atribuída recente de ${fmtCurrency(metrics.totalRevenue)}.` : "Impacto financeiro será mais preciso ao conectar dados reais.",
      urgency: "media",
      confidenceScore: metrics?.hasData ? 72 : 55,
      dataSource,
      autonomyLevel: "insight_only",
      recommendedAction: metrics?.hasData ? "Gerar decisões IA a partir das métricas." : "Conectar dados ou completar métricas de negócio.",
      ctaLabel: metrics?.hasData ? "Gerar decisões" : "Conectar dados",
      ctaHref: metrics?.hasData ? "/decisoes" : "/integrations",
      secondaryActions: [
        { label: "Criar tarefa", action: "create_task" },
        { label: "Abrir chat", href: "/chat?prompt=O%20que%20devo%20fazer%20hoje%3F" },
      ],
    };
  }, [dataSource, finance, metrics, pendingApprovals.length, primaryDecision]);

  const weeklyActions: WeeklyAction[] = useMemo(() => {
    const actions: WeeklyAction[] = [];
    if (primaryDecision) {
      actions.push({
        id: `decision-${primaryDecision.id}`,
        name: primaryDecision.action_type.includes("creative") ? "Gerar novos criativos" : primaryDecision.title,
        type: primaryDecision.action_type.includes("budget") ? "budget" : primaryDecision.action_type.includes("creative") ? "creative" : "campaign",
        reason: primaryDecision.rationale,
        expectedImpact: primaryDecision.expected_impact,
        suggestedOwner: "Gestor de marketing",
        suggestedDueDate: dueLabelInDays(2),
        confidenceScore: (primaryDecision as any).confidence_score ?? 82,
        ctaLabel: "Abrir decisão",
        ctaHref: "/decisoes",
        sourceId: primaryDecision.id,
        relatedCampaignId: primaryDecision.campaign_id,
      });
    }
    if (pendingApprovals.length > 0) {
      actions.push({
        id: "approvals",
        name: "Destravar aprovações pendentes",
        type: "approval",
        reason: "Aprovações pendentes bloqueiam execução e atrasam campanhas.",
        expectedImpact: "Reduzir atraso de execução e liberar próximos testes.",
        suggestedOwner: "Dono ou cliente",
        suggestedDueDate: "Hoje",
        confidenceScore: 88,
        ctaLabel: "Aprovar",
        ctaHref: "/approvals",
      });
    }
    actions.push({
      id: "report",
      name: "Gerar resumo executivo da semana",
      type: "report",
      reason: "Alinhar decisores reduz ruído e acelera a próxima ação.",
      expectedImpact: "Alinhar dono, equipe e agência sobre resultado e próximo passo.",
      suggestedOwner: "Orion",
      suggestedDueDate: dueLabelInDays(5),
      confidenceScore: 74,
      ctaLabel: "Gerar relatório",
      ctaHref: "/executive-report",
    });
    actions.push({
      id: "studio",
      name: "Preparar variação baseada em aprendizado recente",
      type: "creative",
      reason: "Criativos novos reduzem risco de fadiga e destravam testes.",
      expectedImpact: "Aumentar chance de recuperar CTR sem reinventar a campanha.",
      suggestedOwner: "Designer / Social",
      suggestedDueDate: dueLabelInDays(3),
      confidenceScore: 68,
      ctaLabel: "Abrir Estúdio",
      ctaHref: "/studio",
    });
    return actions.slice(0, 3);
  }, [pendingApprovals.length, primaryDecision]);

  const alerts: CentralAlert[] = useMemo(() => {
    const list: CentralAlert[] = [];
    if (finance.actualCpa != null && finance.targetCpa != null && finance.actualCpa > finance.targetCpa) {
      list.push({
        id: "cpa-above-target",
        title: "CPA acima do alvo",
        description: `CPA atual ${fmtCurrency(finance.actualCpa)} passou do alvo ${fmtCurrency(finance.targetCpa)}.`,
        severity: "alta",
        ctaLabel: "Ver decisão",
        ctaHref: "/decisoes",
      });
    }
    if (finance.pacingPercentage > 110) {
      list.push({
        id: "budget-pacing",
        title: "Verba acelerada",
        description: "O gasto está acima do ritmo planejado para o período.",
        severity: "media",
        ctaLabel: "Revisar verba",
        ctaHref: "/campaigns",
      });
    }
    if (pendingApprovals.length > 0) {
      list.push({
        id: "pending-approvals",
        title: "Aprovação pendente",
        description: `${pendingApprovals.length} item(ns) aguardam revisão.`,
        severity: "media",
        ctaLabel: "Resolver",
        ctaHref: "/approvals",
      });
    }
    if (!metrics?.hasData) {
      list.push({
        id: "missing-data",
        title: "Dados reais ausentes",
        description: "Conecte fontes ou importe dados para decisões mais confiáveis.",
        severity: "alta",
        ctaLabel: "Conectar",
        ctaHref: "/integrations",
      });
    }
    return list.slice(0, 4);
  }, [finance, metrics?.hasData, pendingApprovals.length]);

  const campaignsInMotion: CampaignMotion[] = useMemo(() => (
    (metrics?.campaignsList || []).slice(0, 4).map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      channel: campaign.platform,
      status: campaign.status,
      spend: campaign.spend,
      result: campaign.roas != null ? `${campaign.roas.toFixed(2)}x ROAS` : `${campaign.conversions} conv.`,
      performanceVsGoal: campaign.cpa != null && finance.targetCpa != null
        ? campaign.cpa <= finance.targetCpa ? "Dentro da meta" : "Acima do CPA alvo"
        : "Meta não definida",
      recommendedAction: campaign.ctr != null && campaign.ctr < 1 ? "Trocar criativo" : campaign.roas != null && campaign.roas > (finance.targetRoas || 2) ? "Escala controlada" : "Monitorar",
    }))
  ), [finance.targetCpa, finance.targetRoas, metrics?.campaignsList]);

  const derivedLearnings = useMemo(() => deriveOperationalLearning({
    decisions,
    orchestrations: persistedOrchestrations,
    tasks,
    approvals,
    campaigns: campaignsInMotion,
    finance: {
      targetCpa: finance.targetCpa,
      targetRoas: finance.targetRoas,
      estimatedMargin: finance.estimatedMargin,
      breakEvenCpa: finance.breakEvenCpa,
    },
  }).map(derivedLearningToMemoryRecord), [
    approvals,
    campaignsInMotion,
    decisions,
    finance.breakEvenCpa,
    finance.estimatedMargin,
    finance.targetCpa,
    finance.targetRoas,
    persistedOrchestrations,
    tasks,
  ]);

  const orchestrations: ActionOrchestrationCard[] = useMemo(() => {
    if (persistedOrchestrations.length > 0) {
      return persistedOrchestrations.map((row) => ({
        id: row.id,
        title: row.title,
        reason: row.hypothesis || row.description || "Fluxo preparado pelo Orion.",
        evidence: row.detected_signal || "Sinal operacional detectado.",
        impact: row.financial_impact_estimate || "Impacto em validação.",
        preparedAction: row.recommended_action || "Preparar execução assistida.",
        status: row.status || "detected",
        autonomyLevel: row.autonomy_level || "assisted_execution",
        ctaHref: row.related_approval_id ? "/approvals" : row.related_task_id ? "/tasks" : "/decisoes",
      }));
    }

    return weeklyActions.slice(0, 2).map((action) => ({
      id: `derived-${action.id}`,
      title: action.name,
      reason: "Orquestracao derivada da prioridade atual.",
      evidence: action.expectedImpact,
      impact: action.expectedImpact,
      preparedAction: action.ctaLabel,
      status: action.type === "approval" ? "awaiting_approval" : "prepared",
      autonomyLevel: "assisted_execution",
      ctaHref: action.ctaHref,
    }));
  }, [persistedOrchestrations, weeklyActions]);

  const publications: PublicationCard[] = useMemo(() => (
    publicationJobs
      .filter((job) => ["awaiting_approval", "approved", "scheduled", "failed", "draft"].includes(job.status))
      .slice(0, 3)
      .map((job) => ({
        id: job.id,
        title: job.title,
        channel: job.channel,
        publicationType: job.publication_type,
        scheduledAt: job.scheduled_at,
        status: job.status,
        dataOrigin: job.data_origin as DataSourceKind,
        requiresApproval: job.requires_approval,
        ctaHref: job.status === "awaiting_approval" ? "/approvals" : "/studio",
      }))
  ), [publicationJobs]);

  const refetch = useCallback(async () => {
    await Promise.all([fetchOperationalData(), refetchOrchestrations(), refetchPublications()]);
  }, [fetchOperationalData, refetchOrchestrations, refetchPublications]);

  const createTask = useCallback(async (input: {
    title: string;
    description: string;
    urgency: CentralUrgency;
    dueDate?: string;
    category?: string;
    aiContext?: Record<string, unknown>;
  }) => {
    if (!user) return;
    const priorityMap: Record<CentralUrgency, string> = { alta: "high", media: "medium", baixa: "low" };
    const { error } = await supabase.from("tasks").insert({
      user_id: user.id,
      company_dna_id: dna?.id ?? null,
      title: input.title,
      description: input.description,
      status: "todo",
      priority: priorityMap[input.urgency],
      due_date: input.dueDate ?? dueDateInDays(input.urgency === "alta" ? 1 : input.urgency === "media" ? 3 : 5),
      category: input.category ?? "central_orion",
      created_by_ai: true,
      ai_context: JSON.stringify(input.aiContext ?? {}),
    });
    if (error) {
      toast.error("Erro ao criar tarefa");
      return;
    }
    toast.success("Tarefa criada a partir da recomendação");
    if (input.aiContext?.source_id || input.aiContext?.related_decision_id) {
      await createOperationalMemoryFromEvent({
        company_id: dna?.id ?? null,
        user_id: user.id,
        memory_type: input.aiContext?.related_decision_id ? "decision_learning" : "orchestration_learning",
        title: "Recomendação transformada em tarefa",
        description: input.description,
        source_type: String(input.aiContext?.source || "central_orion"),
        source_id: String(input.aiContext?.related_decision_id || input.aiContext?.source_id || ""),
        campaign_id: typeof input.aiContext?.related_campaign_id === "string" ? input.aiContext.related_campaign_id : null,
        confidence_score: typeof input.aiContext?.confidence_score === "number" ? input.aiContext.confidence_score : 65,
        tags: ["task_created", "central_orion"],
      });
    }
    await refetch();
  }, [dna?.id, refetch, user]);

  const createTaskFromPriority = useCallback(async () => {
    await createTask({
      title: dataSafeTitle(priority.title),
      description: [
        `Motivo: ${priority.reason}`,
        `Evidência: ${priority.evidence}`,
        `Impacto: ${priority.financialImpact}`,
        `Ação recomendada: ${priority.recommendedAction}`,
      ].join("\n\n"),
      urgency: priority.urgency,
      category: priority.type,
      aiContext: {
        source: "central_priority",
        data_source: priority.dataSource,
        confidence_score: priority.confidenceScore,
        related_decision_id: priority.relatedDecisionId,
        related_campaign_id: priority.relatedCampaignId,
      },
    });
  }, [createTask, priority]);

  const createTaskFromAction = useCallback(async (action: WeeklyAction) => {
    await createTask({
      title: dataSafeTitle(action.name),
      description: [
        `Motivo: ${action.reason}`,
        `Impacto esperado: ${action.expectedImpact}`,
        `Responsável sugerido: ${action.suggestedOwner}`,
        `Confiança: ${action.confidenceScore}%`,
      ].join("\n\n"),
      urgency: action.type === "approval" || action.type === "budget" ? "alta" : "media",
      category: action.type,
      aiContext: {
        source: "weekly_action",
        source_id: action.sourceId,
        related_campaign_id: action.relatedCampaignId,
      },
    });
  }, [createTask]);

  const prepareOrchestrationFromPriority = useCallback(async () => {
    if (!orchestrationsAvailable) {
      toast.info("Banco remoto ainda sem tabela de orquestrações; criando tarefa como fallback seguro.");
      await createTaskFromPriority();
      return;
    }
    const created = await createOrchestration({
      title: priority.title,
      description: priority.reason,
      source_type: priority.relatedDecisionId ? "ai_decision" : "central_priority",
      source_id: priority.relatedDecisionId,
      detected_signal: priority.evidence,
      hypothesis: priority.reason,
      recommended_action: priority.recommendedAction,
      financial_impact_estimate: priority.financialImpact,
      urgency: priority.urgency,
      confidence_score: priority.confidenceScore,
      autonomy_level: priority.autonomyLevel,
      status: priority.type === "aprovação" ? "awaiting_approval" : "prepared",
      related_campaign_id: priority.relatedCampaignId ?? null,
      data_origin: priority.dataSource,
    });
    if (!created) await createTaskFromPriority();
  }, [createOrchestration, createTaskFromPriority, orchestrationsAvailable, priority]);

  const ignoreOrchestration = useCallback(async (id: string) => {
    if (id.startsWith("derived-")) {
      toast.success("Item derivado ignorado nesta sessão");
      return;
    }
    await ignorePersistedOrchestration(id, "Ignorado pela Central Orion");
    await refetch();
  }, [ignorePersistedOrchestration, refetch]);

  const createTaskFromOrchestration = useCallback(async (id: string) => {
    const orchestration = persistedOrchestrations.find((item) => item.id === id);
    if (!orchestration) {
      toast.info("Orquestração derivada: criando tarefa a partir do próximo passo.");
      const derived = orchestrations.find((item) => item.id === id);
      if (derived) {
        await createTask({
          title: derived.preparedAction,
          description: `${derived.reason}\n\nImpacto: ${derived.impact}\n\nOrigem: ${derived.evidence}`,
          urgency: "media",
          category: "orchestration",
          aiContext: { source: "derived_orchestration", source_id: id },
        });
      }
      return;
    }
    await createTaskFromPersistedOrchestration(orchestration);
    await refetch();
  }, [createTask, createTaskFromPersistedOrchestration, orchestrations, persistedOrchestrations, refetch]);

  const requestApprovalFromOrchestration = useCallback(async (id: string) => {
    const orchestration = persistedOrchestrations.find((item) => item.id === id);
    if (!orchestration) {
      toast.info("Aprovação direta exige orquestração persistida. Preparando orquestração primeiro.");
      await prepareOrchestrationFromPriority();
      return;
    }
    await requestApprovalFromPersistedOrchestration(orchestration);
    await refetch();
  }, [persistedOrchestrations, prepareOrchestrationFromPriority, refetch, requestApprovalFromPersistedOrchestration]);

  const schedulePublication = useCallback(async (id: string) => {
    const job = publicationJobs.find((item) => item.id === id);
    if (!job) return;
    await schedulePersistedPublication(job as PublicationJob);
    await refetch();
  }, [publicationJobs, refetch, schedulePersistedPublication]);

  const cancelPublication = useCallback(async (id: string) => {
    const job = publicationJobs.find((item) => item.id === id);
    if (!job) return;
    await cancelPersistedPublication(job as PublicationJob);
    await refetch();
  }, [cancelPersistedPublication, publicationJobs, refetch]);

  return {
    loading: dnaLoading || metricsLoading || diagnosticLoading || decisionsLoading || memoriesLoading || businessLoading || financeTargetLoading || localLoading || orchestrationsLoading || publicationsLoading,
    companyName: dna?.company_name ?? null,
    periodLabel: "Ultimos 7 dias",
    lastUpdated: new Date().toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
    dataSource,
    hasNonRealData,
    dataNotice,
    score,
    scoreStatus,
    scoreExplanation: scoreStatus === "saudavel" ? "Marketing com sinais positivos e sem bloqueio crítico." : scoreStatus === "atencao" ? "Há oportunidades claras para recuperar eficiência." : "Há gargalos que exigem ação imediata.",
    scoreDeltaLabel: diagnostic ? "baseado no último diagnóstico" : "estimado por métricas recentes",
    priority,
    weeklyActions,
    alerts,
    campaignsInMotion,
    pendingApprovals: pendingApprovals.map((approval) => ({
      id: approval.id,
      title: approval.title,
      approvalType: approval.category,
      impact: approval.impact,
      createdAt: approval.created_at,
      status: approval.status,
      requester: approval.requested_by || "Orion",
      dueDate: approval.due_date ?? null,
    })),
    orchestrations,
    publications,
    learnings: [...derivedLearnings, ...memories].slice(0, 4),
    finance,
    activeCampaigns,
    pendingTasks,
    createTaskFromPriority,
    createTaskFromAction,
    prepareOrchestrationFromPriority,
    ignoreOrchestration,
    createTaskFromOrchestration,
    requestApprovalFromOrchestration,
    schedulePublication,
    cancelPublication,
    refetch,
  };
};

const dataSafeTitle = (title: string) => title.slice(0, 120);
