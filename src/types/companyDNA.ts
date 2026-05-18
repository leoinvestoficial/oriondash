export interface CompanyDNA {
  identity: {
    companyName: string;
    product: string;
    businessModel: string;
    avgTicket: string;
    competitiveEdge: string;
    marketPositioning: string;
    toneOfVoice: string;
    values: string;
    brandPromises: string;
    lovedExample: string;
    vetoedExample: string;
  };
  marketPositioning: {
    category: string;
    market_tier: string;
    direct_competitors: string;
    indirect_competitors: string;
    unique_advantage: string;
    market_trends: string;
  };
  audience: {
    idealCustomer: string;
    secondarySegments: string;
    objections: string;
    triggers: string;
    channels: string;
    motivations: string;
    language: string;
  };
  metrics: {
    monthly_revenue: string;
    budget_monthly: string;
    avg_ticket: string;
    avg_margin_pct: string;
    cac_current: string;
    ltv_estimated: string;
    monthly_traffic: string;
    conversion_rate_pct: string;
    avg_roas: string;
    perceived_bottlenecks: string;
    current_tools: string;
  };
  goalsConstraints: {
    primary_goal: string;
    target_metric: string;
    channels: string;
    seasonalities: string;
    operational_limits: string;
    forbidden: string;
    history: string;
  };
}

export type CustomStepBlock =
  | "brandAssets"
  | "identity"
  | "marketPositioning"
  | "audience"
  | "salesProduct"
  | "metrics"
  | "goalsConstraints"
  | "teamRoles"
  | "creativesUpload"
  | "websiteScan";

export interface OnboardingStep {
  id: string;
  block: CustomStepBlock;
  title: string;
  subtitle: string;
  icon: string;
  isCustom?: boolean;
  questions: {
    key: string;
    label: string;
    placeholder: string;
    type: "text" | "textarea";
  }[];
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "brandAssets",
    block: "brandAssets",
    title: "Marca & Visual",
    subtitle: "Logo, favicon e cores da sua marca.",
    icon: "🎨",
    isCustom: true,
    questions: [],
  },
  {
    id: "identity",
    block: "identity",
    title: "Identidade",
    subtitle: "Marca, oferta, posicionamento e regras da marca.",
    icon: "✦",
    isCustom: true,
    questions: [],
  },
  {
    id: "marketPositioning",
    block: "marketPositioning",
    title: "Mercado & Posicionamento",
    subtitle: "Categoria, concorrentes, tendências e vantagem competitiva.",
    icon: "◎",
    isCustom: true,
    questions: [],
  },
  {
    id: "audience",
    block: "audience",
    title: "Público",
    subtitle: "ICP, segmentos, objeções, gatilhos e linguagem.",
    icon: "◇",
    isCustom: true,
    questions: [],
  },
  {
    id: "salesProduct",
    block: "salesProduct",
    title: "Produto & Vendas",
    subtitle: "Oferta, processo de venda, recompra e retenção.",
    icon: "🛒",
    isCustom: true,
    questions: [],
  },
  {
    id: "metrics",
    block: "metrics",
    title: "Números & Funil",
    subtitle: "Faturamento, ticket, CAC, LTV, ROAS e gargalos.",
    icon: "📊",
    isCustom: true,
    questions: [],
  },
  {
    id: "goalsConstraints",
    block: "goalsConstraints",
    title: "Objetivos & Restrições",
    subtitle: "Meta, canais, sazonalidade e limites operacionais.",
    icon: "△",
    isCustom: true,
    questions: [],
  },
  {
    id: "teamRoles",
    block: "teamRoles",
    title: "Equipe & Cargos",
    subtitle: "Cargos do time pra atribuir tarefas e convites.",
    icon: "👥",
    isCustom: true,
    questions: [],
  },
  {
    id: "creativesUpload",
    block: "creativesUpload",
    title: "Criativos (opcional)",
    subtitle: "Envie anúncios em uso — campeões e fracassados.",
    icon: "🎬",
    isCustom: true,
    questions: [],
  },
  {
    id: "websiteScan",
    block: "websiteScan",
    title: "Scan do Site",
    subtitle: "Diagnóstico de branding, conteúdo e conversão do seu site.",
    icon: "🔍",
    isCustom: true,
    questions: [],
  },
];
