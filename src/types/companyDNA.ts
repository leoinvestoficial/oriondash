export interface CompanyDNA {
  identity: {
    companyName: string;
    product: string;
    positioning: string;
    toneOfVoice: string;
    values: string;
    lovedExample: string;
    vetoedExample: string;
  };
  market: {
    category: string;
    competitors: string;
    maturity: string;
    competitivePosition: string;
  };
  audience: {
    idealCustomer: string;
    behaviors: string;
    language: string;
    motivations: string;
    persona1: string;
    persona2: string;
    persona3: string;
  };
  objectives: {
    okrs: string;
    marketingGoals: string;
    horizons: string;
    priorities: string;
  };
  constraints: {
    forbidden: string;
    sensitiveTopics: string;
    budget: string;
    seasonality: string;
    priorityChannels: string;
    excludedChannels: string;
  };
  history: {
    pastAttempts: string;
    successes: string;
    failures: string;
    theories: string;
  };
}

export type CustomStepBlock = "brandAssets" | "businessContext" | "economics" | "funnelSnapshot" | "creativesUpload" | "positioning" | "teamRoles";

export interface OnboardingStep {
  id: string;
  block: keyof CompanyDNA | CustomStepBlock;
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
    subtitle: "Envie o logo, favicon e defina as cores da sua marca.",
    icon: "🎨",
    isCustom: true,
    questions: [],
  },
  {
    id: "businessContext",
    block: "businessContext",
    title: "Números & Estratégia",
    subtitle: "Faturamento, budget e estágio do negócio para o Orion se adaptar.",
    icon: "📈",
    isCustom: true,
    questions: [],
  },
  {
    id: "economics",
    block: "economics",
    title: "Unit Economics",
    subtitle: "Ticket, margem, CAC e LTV — a base de todo diagnóstico real.",
    icon: "💰",
    isCustom: true,
    questions: [],
  },
  {
    id: "funnelSnapshot",
    block: "funnelSnapshot",
    title: "Funil Atual",
    subtitle: "Snapshot do estado atual: tráfego, conversão, ROAS e gargalos percebidos.",
    icon: "📊",
    isCustom: true,
    questions: [],
  },
  {
    id: "creativesUpload",
    block: "creativesUpload",
    title: "Criativos Atuais",
    subtitle: "Envie anúncios em uso — campeões, fracassados e em rotação.",
    icon: "🎬",
    isCustom: true,
    questions: [],
  },
  {
    id: "positioning",
    block: "positioning",
    title: "Posicionamento & Objetivo",
    subtitle: "Tier de mercado, objetivo principal e concorrentes diretos.",
    icon: "🎯",
    isCustom: true,
    questions: [],
  },
  {
    id: "teamRoles",
    block: "teamRoles",
    title: "Equipe & Cargos",
    subtitle: "Cadastre os cargos do seu time de marketing pra atribuir tarefas e convites por função.",
    icon: "👥",
    isCustom: true,
    questions: [],
  },
  {
    id: "identity",
    block: "identity",
    title: "Identidade da Marca",
    subtitle: "Conte ao Orion quem é a sua empresa — sua essência, voz e valores.",
    icon: "✦",
    questions: [
      { key: "companyName", label: "Qual o nome da empresa?", placeholder: "Ex: Acme Corp", type: "text" },
      { key: "product", label: "Qual o produto ou serviço central?", placeholder: "Descreva o que vocês oferecem...", type: "textarea" },
      { key: "positioning", label: "Como a marca quer ser percebida?", placeholder: "Ex: A plataforma mais confiável para...", type: "textarea" },
      { key: "toneOfVoice", label: "Qual o tom de voz da marca?", placeholder: "Ex: Profissional mas acessível, técnico sem ser frio...", type: "textarea" },
      { key: "values", label: "Quais valores são inegociáveis?", placeholder: "Ex: Transparência, inovação responsável...", type: "textarea" },
      { key: "lovedExample", label: "Dê um exemplo de conteúdo que a marca adorou", placeholder: "Cole um link ou descreva a peça...", type: "textarea" },
      { key: "vetoedExample", label: "E um exemplo que foi vetado — e por quê?", placeholder: "Descreva o que não funcionou e a razão...", type: "textarea" },
    ],
  },
  {
    id: "market",
    block: "market",
    title: "Mercado",
    subtitle: "Ajude o Orion a entender o terreno onde sua empresa compete.",
    icon: "◎",
    questions: [
      { key: "category", label: "Em qual categoria o negócio atua?", placeholder: "Ex: SaaS de RH, e-commerce de moda...", type: "text" },
      { key: "competitors", label: "Quem são os concorrentes diretos e indiretos?", placeholder: "Liste os principais competidores...", type: "textarea" },
      { key: "maturity", label: "Qual o estágio de maturidade do mercado?", placeholder: "Ex: Mercado consolidado, categoria emergente...", type: "textarea" },
      { key: "competitivePosition", label: "Como vocês se diferenciam?", placeholder: "Ex: Preço agressivo, tecnologia proprietária...", type: "textarea" },
    ],
  },
  {
    id: "audience",
    block: "audience",
    title: "Público",
    subtitle: "Descreva seu cliente ideal como se estivesse apresentando uma pessoa real.",
    icon: "◇",
    questions: [
      { key: "idealCustomer", label: "Quem é o cliente ideal?", placeholder: "Demografia, perfil, momento de vida...", type: "textarea" },
      { key: "behaviors", label: "Quais comportamentos definem esse público?", placeholder: "Onde estão, o que consomem, como decidem...", type: "textarea" },
      { key: "language", label: "Que linguagem eles usam?", placeholder: "Gírias, termos técnicos, tom preferido...", type: "textarea" },
      { key: "motivations", label: "O que os motiva e o que os frustra?", placeholder: "Dores, desejos, gatilhos de decisão...", type: "textarea" },
      { key: "persona1", label: "Persona 1 — Descreva um cliente real", placeholder: "Nome fictício, idade, o que faz, como chegou até vocês...", type: "textarea" },
      { key: "persona2", label: "Persona 2 — Outro perfil de cliente", placeholder: "Um tipo diferente de cliente que vocês atendem...", type: "textarea" },
      { key: "persona3", label: "Persona 3 — Um terceiro perfil", placeholder: "Opcional, mas quanto mais contexto, melhor o Orion entende...", type: "textarea" },
    ],
  },
  {
    id: "objectives",
    block: "objectives",
    title: "Objetivos e Metas",
    subtitle: "Alinhe o Orion com o que a empresa quer alcançar.",
    icon: "△",
    questions: [
      { key: "okrs", label: "Quais os OKRs do negócio para este período?", placeholder: "Objetivos e resultados-chave...", type: "textarea" },
      { key: "marketingGoals", label: "Metas específicas de marketing", placeholder: "CAC alvo, ROAS mínimo, volume de leads...", type: "textarea" },
      { key: "horizons", label: "Quais os horizontes de tempo?", placeholder: "Curto prazo (3 meses), médio (6), longo (12)...", type: "textarea" },
      { key: "priorities", label: "Quando há conflito, o que tem prioridade?", placeholder: "Ex: Volume > Qualidade, ou Brand > Performance...", type: "textarea" },
    ],
  },
  {
    id: "constraints",
    block: "constraints",
    title: "Restrições e Limites",
    subtitle: "O que o Orion nunca deve fazer pela sua marca.",
    icon: "⬡",
    questions: [
      { key: "forbidden", label: "Que tipo de conteúdo é proibido?", placeholder: "Ex: Nunca usar humor ácido, nunca comparar diretamente...", type: "textarea" },
      { key: "sensitiveTopics", label: "Temas sensíveis a evitar?", placeholder: "Política, religião, temas específicos do setor...", type: "textarea" },
      { key: "budget", label: "Budget total disponível para marketing", placeholder: "Ex: R$ 50.000/mês, com flexibilidade sazonal...", type: "text" },
      { key: "seasonality", label: "Sazonalidades previstas?", placeholder: "Ex: Black Friday é o pico, janeiro é baixo...", type: "textarea" },
      { key: "priorityChannels", label: "Canais prioritários", placeholder: "Ex: Meta Ads, Google Search, LinkedIn...", type: "textarea" },
      { key: "excludedChannels", label: "Canais que estão fora de cogitação", placeholder: "Ex: TikTok não faz sentido para nosso público...", type: "textarea" },
    ],
  },
  {
    id: "history",
    block: "history",
    title: "Histórico e Contexto",
    subtitle: "Evite que o Orion repita erros que vocês já conhecem.",
    icon: "◈",
    questions: [
      { key: "pastAttempts", label: "O que já foi tentado em marketing?", placeholder: "Campanhas, estratégias, parceiros...", type: "textarea" },
      { key: "successes", label: "O que funcionou bem?", placeholder: "Campanhas de sucesso, canais que performaram...", type: "textarea" },
      { key: "failures", label: "O que fracassou?", placeholder: "Iniciativas que não deram resultado...", type: "textarea" },
      { key: "theories", label: "Qual a teoria sobre o que funciona e o que não funciona?", placeholder: "Hipóteses do time sobre o que faz diferença...", type: "textarea" },
    ],
  },
];
