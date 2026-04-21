export interface CompanyDNA {
  identity: {
    companyName: string;
    product: string;
    toneOfVoice: string;
    values: string;
    vetoedExample: string;
  };
  audience: {
    idealCustomer: string;
    motivations: string;
    language: string;
  };
}

export type CustomStepBlock =
  | "brandAssets"
  | "identity"
  | "marketPositioning"
  | "audience"
  | "metrics"
  | "goalsConstraints"
  | "teamRoles"
  | "creativesUpload";

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
    subtitle: "Nome, produto, tom de voz e valores.",
    icon: "✦",
    isCustom: true,
    questions: [],
  },
  {
    id: "marketPositioning",
    block: "marketPositioning",
    title: "Mercado & Posicionamento",
    subtitle: "Categoria, concorrentes, tier e o que te diferencia.",
    icon: "◎",
    isCustom: true,
    questions: [],
  },
  {
    id: "audience",
    block: "audience",
    title: "Público",
    subtitle: "Cliente ideal, motivações e linguagem.",
    icon: "◇",
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
    subtitle: "Objetivo principal, canais e o que o Orion nunca deve fazer.",
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
];
