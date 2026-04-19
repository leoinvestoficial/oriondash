import { driver, type Config } from "driver.js";
import "driver.js/dist/driver.css";

const baseConfig: Config = {
  showProgress: true,
  animate: true,
  smoothScroll: true,
  allowClose: true,
  overlayOpacity: 0.7,
  stagePadding: 6,
  stageRadius: 12,
  popoverClass: "orion-driver-popover",
  progressText: "Passo {{current}} de {{total}}",
  nextBtnText: "Próximo →",
  prevBtnText: "← Voltar",
  doneBtnText: "Concluir",
};

export const startOwnerTour = (onComplete: () => void) => {
  const d = driver({
    ...baseConfig,
    onDestroyed: () => onComplete(),
    steps: [
      {
        popover: {
          title: "🚀 Bem-vindo ao Orion",
          description:
            "Você é o <b>dono</b> deste workspace. Vou te mostrar em 1 minuto como funcionam os principais módulos. Você pode pular a qualquer momento.",
        },
      },
      {
        element: '[data-tour="nav-dashboard"]',
        popover: {
          title: "Dashboard",
          description: "Sua visão geral diária — receita, ROAS, alertas e atalhos rápidos.",
        },
      },
      {
        element: '[data-tour="nav-cerebro"]',
        popover: {
          title: "Cérebro",
          description: "A memória contínua da empresa. Tudo que acontece é registrado para a IA ter contexto.",
        },
      },
      {
        element: '[data-tour="nav-diagnostico"]',
        popover: {
          title: "Diagnóstico",
          description: "A IA analisa sua empresa e gera um raio-X estratégico com gargalos e recomendações.",
        },
      },
      {
        element: '[data-tour="nav-decisoes"]',
        popover: {
          title: "Decisões IA",
          description:
            "O coração do Orion. A IA propõe ações concretas (pausar campanha, ajustar budget, criar tarefa) e você aprova com 1 clique.",
        },
      },
      {
        element: '[data-tour="nav-team"]',
        popover: {
          title: "Equipe",
          description:
            "Como dono, aqui você convida funcionários por e-mail. Eles entram direto sem refazer o Company DNA.",
        },
      },
      {
        element: '[data-tour="nav-integrations"]',
        popover: {
          title: "Integrações",
          description:
            "Conecte Meta Ads e Google Ads para o Orion sincronizar métricas reais e executar ações automaticamente.",
        },
      },
      {
        element: '[data-tour="nav-onboarding"]',
        popover: {
          title: "Company DNA",
          description:
            "A base de tudo. Quanto mais completo o DNA, melhores as decisões da IA. Volte aqui sempre que algo mudar.",
        },
      },
      {
        popover: {
          title: "✅ Pronto!",
          description:
            "Comece pelo <b>Company DNA</b> e depois conecte uma plataforma em <b>Integrações</b>. O checklist no Dashboard te guia.",
        },
      },
    ],
  });
  d.drive();
};

export const startEmployeeTour = (onComplete: () => void) => {
  const d = driver({
    ...baseConfig,
    onDestroyed: () => onComplete(),
    steps: [
      {
        popover: {
          title: "👋 Bem-vindo à equipe",
          description:
            "Você foi adicionado como <b>funcionário</b>. Vou te mostrar o essencial do Orion em 30 segundos.",
        },
      },
      {
        element: '[data-tour="nav-dashboard"]',
        popover: {
          title: "Dashboard",
          description: "Visão geral das operações de marketing. Acompanhe métricas e alertas.",
        },
      },
      {
        element: '[data-tour="nav-tasks"]',
        popover: {
          title: "Suas Tarefas",
          description:
            "Aqui você vê o que precisa fazer. A IA cria tarefas automaticamente (ex: 'Tirar foto X para campanha Y').",
        },
      },
      {
        element: '[data-tour="nav-calendar"]',
        popover: {
          title: "Cronograma",
          description: "Calendário editorial — posts, stories e conteúdos agendados por canal.",
        },
      },
      {
        element: '[data-tour="nav-studio"]',
        popover: {
          title: "Estúdio Criativo",
          description: "Onde você cria briefings e gera conteúdo com apoio da IA.",
        },
      },
      {
        element: '[data-tour="nav-chat"]',
        popover: {
          title: "Chat com Orion",
          description: "Pergunte qualquer coisa para a IA — ela conhece sua empresa em detalhes.",
        },
      },
      {
        popover: {
          title: "✅ Tudo pronto",
          description: "Comece pelas suas <b>Tarefas</b>. Bom trabalho!",
        },
      },
    ],
  });
  d.drive();
};
