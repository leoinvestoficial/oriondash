import type { MemoryRecord } from "@/hooks/useBrain";

export interface LearningInput {
  decisions?: Array<{ id?: string; title?: string; status?: string; action_type?: string; campaign_id?: string | null }>;
  orchestrations?: Array<{ id?: string; title?: string; status?: string; related_campaign_id?: string | null }>;
  tasks?: Array<{ id?: string; title?: string; status?: string; priority?: string | null }>;
  approvals?: Array<{ id?: string; title?: string; status?: string; category?: string | null; due_date?: string | null }>;
  campaigns?: Array<{ id?: string; name?: string; status?: string; recommendedAction?: string; performanceVsGoal?: string }>;
  finance?: {
    targetCpa?: number | null;
    targetRoas?: number | null;
    estimatedMargin?: number | null;
    breakEvenCpa?: number | null;
  };
  now?: Date;
}

export interface DerivedOperationalLearning {
  id: string;
  memory_type: string;
  title: string;
  summary: string;
  content: string;
  tags: string[];
  importance: number;
  source: "system_derived";
  reference_table: string | null;
  reference_id: string | null;
  raw_data: {
    learning_type: string;
    source_count: number;
    related_entities: Array<{ type: string; id?: string; title?: string }>;
    generated_by: "system";
    period_start: string;
    period_end: string;
  };
  occurred_at: string;
  created_at: string;
}

const isoDate = (date: Date) => date.toISOString().split("T")[0];

const makeLearning = (
  input: Omit<DerivedOperationalLearning, "memory_type" | "source" | "reference_table" | "reference_id" | "occurred_at" | "created_at"> & {
    now: Date;
  },
): DerivedOperationalLearning => ({
  id: input.id,
  memory_type: "general_learning",
  title: input.title,
  summary: input.summary,
  content: input.content,
  tags: input.tags,
  importance: input.importance,
  source: "system_derived",
  reference_table: null,
  reference_id: null,
  raw_data: input.raw_data,
  occurred_at: input.now.toISOString(),
  created_at: input.now.toISOString(),
});

export function deriveOperationalLearning(input: LearningInput): DerivedOperationalLearning[] {
  const now = input.now ?? new Date();
  const periodEnd = isoDate(now);
  const periodStartDate = new Date(now);
  periodStartDate.setDate(periodStartDate.getDate() - 30);
  const periodStart = isoDate(periodStartDate);
  const learnings: DerivedOperationalLearning[] = [];

  const decisions = input.decisions ?? [];
  const orchestrations = input.orchestrations ?? [];
  const tasks = input.tasks ?? [];
  const approvals = input.approvals ?? [];
  const campaigns = input.campaigns ?? [];

  const ignoredOrchestrations = orchestrations.filter((item) => item.status === "ignored");
  const preparedOrchestrations = orchestrations.filter((item) => item.status === "prepared" || item.status === "awaiting_approval");
  const activeTasks = tasks.filter((item) => item.status !== "done" && item.status !== "completed");
  const pendingApprovals = approvals.filter((item) => item.status === "pending");
  const creativeApprovals = pendingApprovals.filter((item) => (item.category || "").includes("creative") || (item.title || "").toLowerCase().includes("criativo"));
  const acceptedDecisions = decisions.filter((item) => item.status === "applied" || item.status === "orchestration_prepared");
  const budgetDecisions = decisions.filter((item) => (item.action_type || "").includes("budget"));
  const campaignPriorities = new Map<string, number>();
  [...decisions, ...orchestrations].forEach((item) => {
    const campaignId = item.campaign_id || item.related_campaign_id;
    if (campaignId) campaignPriorities.set(campaignId, (campaignPriorities.get(campaignId) || 0) + 1);
  });

  if (acceptedDecisions.length >= 2) {
    learnings.push(makeLearning({
      id: `derived-decisions-accepted-${periodStart}-${periodEnd}`,
      title: "Decisões IA estão virando execução",
      summary: `${acceptedDecisions.length} recomendações foram aceitas ou preparadas para execução no período.`,
      content: "O Orion pode priorizar recomendações acionáveis, porque há sinal de adesão do usuário ao fluxo assistido.",
      tags: ["aprendizado_derivado", "decisoes", "execucao"],
      importance: 75,
      now,
      raw_data: {
        learning_type: "decision_acceptance",
        source_count: acceptedDecisions.length,
        related_entities: acceptedDecisions.map((item) => ({ type: "ai_decision", id: item.id, title: item.title })),
        generated_by: "system",
        period_start: periodStart,
        period_end: periodEnd,
      },
    }));
  }

  if (ignoredOrchestrations.length >= Math.max(2, preparedOrchestrations.length)) {
    learnings.push(makeLearning({
      id: `derived-orchestrations-ignored-${periodStart}-${periodEnd}`,
      title: "Muitas orquestrações estão sendo ignoradas",
      summary: `${ignoredOrchestrations.length} orquestrações foram ignoradas; pode haver desalinhamento de prioridade, timing ou confiança.`,
      content: "Antes de gerar mais ações, vale perguntar por que as recomendações não estão sendo aceitas.",
      tags: ["aprendizado_derivado", "orquestracao", "friccao"],
      importance: 82,
      now,
      raw_data: {
        learning_type: "orchestration_rejection",
        source_count: ignoredOrchestrations.length,
        related_entities: ignoredOrchestrations.map((item) => ({ type: "action_orchestration", id: item.id, title: item.title })),
        generated_by: "system",
        period_start: periodStart,
        period_end: periodEnd,
      },
    }));
  }

  if (pendingApprovals.length >= 2 || creativeApprovals.length >= 1) {
    learnings.push(makeLearning({
      id: `derived-approvals-blocking-${periodStart}-${periodEnd}`,
      title: "Aprovações estão bloqueando execução",
      summary: `${pendingApprovals.length} aprovações pendentes podem atrasar campanhas, criativos ou verba.`,
      content: creativeApprovals.length
        ? "Há aprovação de criativo pendente. Isso tende a bloquear testes e renovação de anúncios."
        : "Há aprovações pendentes. O próximo ganho operacional é destravar decisão humana.",
      tags: ["aprendizado_derivado", "aprovacoes", "bloqueio"],
      importance: 85,
      now,
      raw_data: {
        learning_type: "approval_blocker",
        source_count: pendingApprovals.length,
        related_entities: pendingApprovals.map((item) => ({ type: "approval", id: item.id, title: item.title })),
        generated_by: "system",
        period_start: periodStart,
        period_end: periodEnd,
      },
    }));
  }

  if (preparedOrchestrations.length > 0 && activeTasks.length >= preparedOrchestrations.length) {
    learnings.push(makeLearning({
      id: `derived-execution-open-${periodStart}-${periodEnd}`,
      title: "Execução foi preparada, mas ainda precisa fechamento",
      summary: `${preparedOrchestrations.length} orquestrações estão preparadas e há ${activeTasks.length} tarefas abertas.`,
      content: "O foco agora deve ser concluir tarefas já abertas antes de criar mais frentes paralelas.",
      tags: ["aprendizado_derivado", "tarefas", "execucao"],
      importance: 70,
      now,
      raw_data: {
        learning_type: "execution_follow_through",
        source_count: preparedOrchestrations.length + activeTasks.length,
        related_entities: [
          ...preparedOrchestrations.map((item) => ({ type: "action_orchestration", id: item.id, title: item.title })),
          ...activeTasks.slice(0, 5).map((item) => ({ type: "task", id: item.id, title: item.title })),
        ],
        generated_by: "system",
        period_start: periodStart,
        period_end: periodEnd,
      },
    }));
  }

  if (!input.finance?.estimatedMargin || !input.finance?.breakEvenCpa) {
    learnings.push(makeLearning({
      id: `derived-finance-targets-missing-${periodStart}-${periodEnd}`,
      title: "Faltam metas financeiras para recomendar escala com segurança",
      summary: "Margem ou break-even ainda não estão configurados, então recomendações de verba devem ser conservadoras.",
      content: "Antes de sugerir aumento de investimento, o Orion deve pedir margem, CPA de equilíbrio ou meta financeira clara.",
      tags: ["aprendizado_derivado", "financeiro", "metas"],
      importance: 76,
      now,
      raw_data: {
        learning_type: "finance_targets_missing",
        source_count: 1,
        related_entities: [{ type: "marketing_finance_targets", title: "metas financeiras" }],
        generated_by: "system",
        period_start: periodStart,
        period_end: periodEnd,
      },
    }));
  }

  const recurringCampaign = [...campaignPriorities.entries()].find(([, count]) => count >= 2);
  if (recurringCampaign) {
    const campaign = campaigns.find((item) => item.id === recurringCampaign[0]);
    learnings.push(makeLearning({
      id: `derived-recurring-campaign-${recurringCampaign[0]}-${periodStart}-${periodEnd}`,
      title: "Uma campanha aparece repetidamente como prioridade",
      summary: `${campaign?.name || "Uma campanha"} apareceu ${recurringCampaign[1]} vezes em decisões ou orquestrações.`,
      content: "Esse padrão indica que a campanha merece investigação dedicada antes de escalar ou criar novas variações.",
      tags: ["aprendizado_derivado", "campanha", "recorrencia"],
      importance: 78,
      now,
      raw_data: {
        learning_type: "recurring_campaign_signal",
        source_count: recurringCampaign[1],
        related_entities: [{ type: "campaign", id: recurringCampaign[0], title: campaign?.name }],
        generated_by: "system",
        period_start: periodStart,
        period_end: periodEnd,
      },
    }));
  }

  if (budgetDecisions.length > 0 && (!input.finance?.targetCpa || !input.finance?.targetRoas)) {
    learnings.push(makeLearning({
      id: `derived-budget-without-targets-${periodStart}-${periodEnd}`,
      title: "Decisões de orçamento estão sem metas suficientes",
      summary: `${budgetDecisions.length} decisão(ões) de verba apareceram sem CPA/ROAS alvo completo.`,
      content: "Ajustes de verba precisam considerar alvo, margem e break-even para evitar otimização falsa.",
      tags: ["aprendizado_derivado", "budget", "financeiro"],
      importance: 80,
      now,
      raw_data: {
        learning_type: "budget_without_targets",
        source_count: budgetDecisions.length,
        related_entities: budgetDecisions.map((item) => ({ type: "ai_decision", id: item.id, title: item.title })),
        generated_by: "system",
        period_start: periodStart,
        period_end: periodEnd,
      },
    }));
  }

  const seen = new Set<string>();
  return learnings.filter((learning) => {
    const key = `${learning.title}-${learning.raw_data.period_start}-${learning.raw_data.period_end}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function derivedLearningToMemoryRecord(learning: DerivedOperationalLearning): MemoryRecord {
  return learning;
}
