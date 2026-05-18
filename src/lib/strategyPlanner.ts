import type { DashboardMetrics } from "@/hooks/useDashboardMetrics";

export interface StrategyRecommendation {
  id: string;
  title: string;
  objective: string;
  platform: string;
  audience: string;
  budgetDaily: number;
  budgetTotal: number;
  timeWindow: string;
  reason: string;
  expectedImpact: string;
  targetingNotes: string;
  strategyNotes: string;
  creativeBrief: Record<string, string>;
}

interface StrategyPlannerInput {
  dna?: Record<string, any> | null;
  metrics?: DashboardMetrics | null;
  intelligence?: {
    topCompetitor?: any;
    topSignal?: any;
    largestGap?: any;
  } | null;
  learning?: {
    latestValidated?: any;
    latestInvalidated?: any;
  } | null;
  goals?: any[];
  hypotheses?: any[];
  campaignCount?: number;
}

const toCurrencyBudget = (value: number, fallback: number) => {
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return Math.max(fallback, Math.round(value));
};

// Fallback labels used when DNA fields are absent
const LABELS = {
  defaultAudience: "Segmento mais promissor do Company DNA",
  noActiveCampaigns: "Ainda não há campanhas ativas para validar a tese principal.",
  openDataVolume: "Abrir volume de dados para priorizar próximos passos.",
  mainGoalProgress: (metric: string) => `Mover a meta ${metric} na direção do alvo.`,
  closeBenchmarkGap: (metric: string) => `Reduzir a distância para o benchmark em ${metric}.`,
  improveResponseRate: "Melhorar taxa de resposta da próxima iteração.",
  defaultObjective: "Gerar avanço estratégico",
  defaultMessage: "Proposta de valor principal",
  defaultHook: "O insight mais acionável do momento",
  defaultVisual: (company: string, product: string) =>
    `Criativo de alta clareza para ${company}, destacando ${product}`,
  defaultVisual2: (positioning: string) =>
    `Visual comparativo e objetivo, alinhado ao posicionamento ${positioning}`,
};

export const buildStrategyRecommendations = ({
  dna,
  metrics,
  intelligence,
  learning,
  goals = [],
  hypotheses = [],
  campaignCount = 0,
}: StrategyPlannerInput): StrategyRecommendation[] => {
  const identity = dna?.identity || {};
  const audience = dna?.audience || {};
  const market = dna?.marketPositioning || {};
  const constraints = dna?.goalsConstraints || {};
  const mainGoal = goals.find((goal: any) => goal.status === "active") || goals[0] || null;
  const topHypothesis = hypotheses[0] || null;
  const topSignal = intelligence?.topSignal;
  const topCompetitor = intelligence?.topCompetitor;
  const largestGap = intelligence?.largestGap;
  const budgetBase = metrics?.totalSpend ? metrics.totalSpend / 7 : Number(dna?.metrics?.budget_monthly || 0) / 30;
  const dailyBudget = toCurrencyBudget(budgetBase, 80);

  const commonAudience = audience.idealCustomer || audience.secondarySegments || LABELS.defaultAudience;
  const validatedLearning = learning?.latestValidated?.summary;
  const invalidatedLearning = learning?.latestInvalidated?.summary;

  const recommendations: StrategyRecommendation[] = [
    {
      id: "rec-1",
      title: mainGoal ? `Acelerar meta: ${mainGoal.goal_name}` : "Criar frente principal de aquisição",
      objective: mainGoal?.target_metric || constraints.primary_goal || "leads",
      platform: constraints.channels?.includes("Google") ? "google" : "meta",
      audience: commonAudience,
      budgetDaily: dailyBudget,
      budgetTotal: dailyBudget * 14,
      timeWindow: "14 dias",
      reason: [
        topSignal?.summary,
        topCompetitor ? `Concorrente em foco: ${topCompetitor.name}.` : null,
        campaignCount === 0 ? LABELS.noActiveCampaigns : null,
      ].filter(Boolean).join(" "),
      expectedImpact: mainGoal ? LABELS.mainGoalProgress(mainGoal.target_metric) : LABELS.openDataVolume,
      targetingNotes: [
        audience.triggers ? `Gatilhos: ${audience.triggers}.` : null,
        audience.objections ? `Objeções a contornar: ${audience.objections}.` : null,
        topHypothesis ? `Hipótese conectada: ${topHypothesis.title}.` : null,
      ].filter(Boolean).join(" "),
      strategyNotes: [
        market.unique_advantage ? `Vantagem única: ${market.unique_advantage}.` : null,
        validatedLearning ? `Reforçar aprendizado validado: ${validatedLearning}.` : null,
        invalidatedLearning ? `Evitar repetir: ${invalidatedLearning}.` : null,
      ].filter(Boolean).join(" "),
      creativeBrief: {
        objetivo: mainGoal?.goal_name || constraints.primary_goal || LABELS.defaultObjective,
        publico: commonAudience,
        mensagem_chave: identity.competitiveEdge || market.unique_advantage || identity.product || LABELS.defaultMessage,
        angulo_criativo: "Prova + oportunidade",
        hook_principal: audience.triggers || LABELS.defaultHook,
        estrutura_peca: "Hook forte → tensão → prova → CTA",
        roteiro_base: topSignal?.recommended_action || "Abrir com dor do ICP e mostrar ganho concreto",
        prompt_visual: LABELS.defaultVisual(identity.companyName || "a marca", identity.brandPromises || identity.product || "a proposta"),
        testes_ab: "Testar prova social versus dor latente",
        cta: "Ver como aplicar agora",
      },
    },
    {
      id: "rec-2",
      title: largestGap ? `Fechar gap em ${largestGap.metric_name}` : "Rodar teste de mensagem prioritária",
      objective: largestGap?.metric_name || "CTR",
      platform: constraints.channels?.includes("LinkedIn") ? "linkedin" : "meta",
      audience: audience.secondarySegments || commonAudience,
      budgetDaily: Math.round(dailyBudget * 0.7),
      budgetTotal: Math.round(dailyBudget * 7),
      timeWindow: "7 dias",
      reason: [
        largestGap?.gap_summary,
        topSignal?.title ? `Sinal urgente: ${topSignal.title}.` : null,
      ].filter(Boolean).join(" "),
      expectedImpact: largestGap ? LABELS.closeBenchmarkGap(largestGap.metric_name) : LABELS.improveResponseRate,
      targetingNotes: [
        audience.channels ? `Canais observados: ${audience.channels}.` : null,
        audience.language ? `Linguagem do público: ${audience.language}.` : null,
      ].filter(Boolean).join(" "),
      strategyNotes: [
        market.market_trends ? `Tendência: ${market.market_trends}.` : null,
        topCompetitor?.weaknesses ? `Explorar fraqueza concorrente: ${topCompetitor.weaknesses}.` : null,
      ].filter(Boolean).join(" "),
      creativeBrief: {
        objetivo: "Validar nova mensagem",
        publico: audience.secondarySegments || commonAudience,
        mensagem_chave: identity.brandPromises || identity.competitiveEdge || "Nova narrativa competitiva",
        angulo_criativo: "Dor + desejo",
        hook_principal: audience.objections || "Quebra de objeção principal",
        estrutura_peca: "Dor → reframe → prova → CTA",
        roteiro_base: constraints.history || "Responder objeção crítica com argumento objetivo",
        prompt_visual: LABELS.defaultVisual2(identity.marketPositioning || "estratégico"),
        testes_ab: "Teste headline racional vs emocional",
        cta: "Quero entender melhor",
      },
    },
  ];

  return recommendations;
};
