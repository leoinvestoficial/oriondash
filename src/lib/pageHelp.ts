import type { PageHelpContent } from "@/components/help/PageHelpBanner";

export const PAGE_HELP: Record<string, PageHelpContent> = {
  dashboard: {
    id: "help-dashboard",
    title: "Dashboard — Visão geral do seu marketing",
    description:
      "Hub central onde você acompanha métricas-chave, alertas e o status geral das operações de marketing comandadas pelo Orion.",
    bullets: [
      "Veja receita, ROAS, CAC e CTR em tempo real",
      "Receba alertas automáticos de campanhas com problemas",
      "Acesse rapidamente cada módulo do sistema",
    ],
  },
  cerebro: {
    id: "help-cerebro",
    title: "Cérebro — Memória contínua da empresa",
    description:
      "O Cérebro registra tudo que acontece no negócio (decisões, métricas, conversas, uploads) para que a IA tenha contexto histórico ao tomar novas decisões.",
    bullets: [
      "Timeline com todos os eventos importantes",
      "Adicione anotações livres a qualquer momento",
      "Gere um Briefing IA com a visão big-picture atual",
    ],
  },
  diagnostico: {
    id: "help-diagnostico",
    title: "Diagnóstico — Análise estratégica completa",
    description:
      "A IA analisa sua empresa, métricas e histórico para gerar um diagnóstico de saúde do negócio com gargalos identificados e recomendações priorizadas.",
    bullets: [
      "Score geral e por área (aquisição, conversão, retenção)",
      "Lista de gargalos com severidade",
      "Recomendações acionáveis com impacto esperado",
    ],
  },
  decisoes: {
    id: "help-decisoes",
    title: "Decisões IA — Ações estratégicas com 1 clique",
    description:
      "A IA interpreta seus dados e propõe decisões concretas. Você aprova com um clique — pausar campanha, ajustar orçamento, criar tarefa para a equipe ou gerar briefing criativo.",
    bullets: [
      "'Semear mock' popula dados de teste para validar o fluxo",
      "'Gerar decisões' chama a IA pra analisar suas campanhas",
      "Cada decisão tem severidade, evidência e impacto esperado",
    ],
  },
  campaigns: {
    id: "help-campaigns",
    title: "Campanhas — Gestão das suas campanhas pagas",
    description:
      "Visualize e gerencie todas as campanhas conectadas via Meta, Google e outras plataformas. Acompanhe gasto, conversões e ROAS por campanha.",
    bullets: [
      "Sincronize automaticamente da Meta e Google Ads",
      "Pause/ative campanhas direto daqui",
      "Veja métricas detalhadas dos últimos 14 dias",
    ],
  },
  calendar: {
    id: "help-calendar",
    title: "Cronograma — Calendário editorial",
    description:
      "Planeje, agende e acompanhe todo o conteúdo orgânico (posts, stories, vídeos) por canal e data. A IA pode sugerir conteúdos baseados no Company DNA.",
    bullets: [
      "Visão semanal e mensal por canal",
      "Status: rascunho, agendado, publicado",
      "Geração automática de copy + visual com IA",
    ],
  },
  tasks: {
    id: "help-tasks",
    title: "Tarefas — Operação da equipe",
    description:
      "Tarefas atribuídas aos membros da equipe. A IA cria tarefas automaticamente quando uma decisão precisa de ação humana (ex: 'Tirar foto X para campanha Y').",
    bullets: [
      "Filtros por responsável, prioridade e status",
      "Tarefas criadas pela IA têm tag automática",
      "Vincule tarefas a campanhas específicas",
    ],
  },
  approvals: {
    id: "help-approvals",
    title: "Aprovações — Decisões que precisam do seu OK",
    description:
      "Ações de alto impacto que a IA sugere mas que não executa sozinha. Você revisa, aprova ou rejeita com base no raciocínio e dados de suporte.",
    bullets: [
      "Níveis: simples, importante, crítica",
      "Cada aprovação inclui o raciocínio completo da IA",
      "Categorias: orçamento, criativo, estratégia",
    ],
  },
  studio: {
    id: "help-studio",
    title: "Estúdio Criativo — Briefings e geração de conteúdo",
    description:
      "Onde você cria briefings criativos detalhados para campanhas. A IA usa o Company DNA, histórico e tom de voz para gerar sugestões alinhadas à marca.",
    bullets: [
      "Briefings de campanha, post, vídeo ou anúncio",
      "Geração automática a partir de objetivos",
      "Histórico de briefings versionados",
    ],
  },
  chat: {
    id: "help-chat",
    title: "Chat — Converse com o Orion",
    description:
      "Converse diretamente com a IA. Ela tem acesso ao seu Company DNA, métricas, decisões anteriores e memória do Cérebro para dar respostas contextualizadas.",
    bullets: [
      "Pergunte sobre estratégia, métricas ou execução",
      "A IA pode criar tarefas e decisões direto do chat",
      "Histórico de conversas é salvo no Cérebro",
    ],
  },
  team: {
    id: "help-team",
    title: "Equipe — Membros e convites",
    description:
      "Gerencie quem tem acesso ao Orion na sua empresa. Como dono, você convida funcionários por e-mail e define os papéis.",
    bullets: [
      "Convide novos membros por e-mail",
      "Papéis: Dono, Admin, Funcionário",
      "Funcionários veem o sistema sem precisar refazer o Company DNA",
    ],
  },
  integrations: {
    id: "help-integrations",
    title: "Integrações — Conecte suas plataformas",
    description:
      "Conecte Meta Ads, Google Ads e outras plataformas via OAuth para que o Orion sincronize métricas e execute ações automaticamente.",
    bullets: [
      "Conexão OAuth segura — credenciais nunca expostas",
      "Sincronização automática diária",
      "Necessário para 'Decisões IA' funcionarem com dados reais",
    ],
  },
  onboarding: {
    id: "help-onboarding",
    title: "Company DNA — A base de tudo",
    description:
      "O Company DNA é o conhecimento profundo que a IA tem sobre sua empresa: posicionamento, público, economia unitária, ativos de marca. Quanto mais completo, melhores as decisões.",
    bullets: [
      "13 blocos cobrindo todas as áreas estratégicas",
      "Editável a qualquer momento",
      "Usado em todos os módulos de IA do Orion",
    ],
  },
};
