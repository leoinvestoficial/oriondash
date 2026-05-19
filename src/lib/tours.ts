/**
 * Tours guiados do Orion — driver.js
 *
 * startOwnerTour(): Para donos e gestores — apresenta Central, métricas,
 *   prioridade IA, loop operacional e todos os módulos principais.
 *
 * startEmployeeTour(): Para colaboradores — foco em tarefas, calendário,
 *   criativos e chat.
 */
import { driver, type Config } from "driver.js";
import "driver.js/dist/driver.css";

// Add/remove pulse highlight class on the spotlit element
const onHighlightStarted = (element: Element | undefined) => {
  if (element) element.classList.add("orion-tour-highlight");
};
const onDeselected = (element: Element | undefined) => {
  if (element) element.classList.remove("orion-tour-highlight");
};

const baseConfig: Config = {
  showProgress: true,
  animate: true,
  smoothScroll: true,
  allowClose: true,
  overlayOpacity: 0.82,
  stagePadding: 12,
  stageRadius: 16,
  popoverClass: "orion-driver-popover",
  progressText: "{{current}} / {{total}}",
  nextBtnText: "Próximo →",
  prevBtnText: "← Voltar",
  doneBtnText: "Começar a operar ✓",
  onHighlightStarted,
  onDeselected,
};

export const startOwnerTour = (onComplete: () => void) => {
  const d = driver({
    ...baseConfig,
    onDestroyed: () => onComplete(),
    steps: [
      // ── 1. Boas-vindas ────────────────────────────────────────────────
      {
        popover: {
          title: "Bem-vindo ao Orion",
          description:
            "Aqui você acompanha, organiza e executa sua operação de marketing com apoio da IA. " +
            "O Orion funciona num loop contínuo: " +
            "<strong>Detectar → Decidir → Executar → Medir → Aprender</strong>.",
        },
      },

      // ── 2. Central Orion ──────────────────────────────────────────────
      {
        element: '[data-tour="nav-central"]',
        popover: {
          title: "Central Orion — sua sala de comando",
          description:
            "Aqui começa tudo. A Central mostra o que importa agora: métricas principais, " +
            "a prioridade identificada pela IA, ações recomendadas e o status da operação.",
          side: "right",
          align: "start",
        },
      },

      // ── 3. MetricsGrid ────────────────────────────────────────────────
      {
        element: '[data-tour="metrics-grid"]',
        popover: {
          title: "Métricas na primeira dobra",
          description:
            "10 KPIs críticos em duas linhas: <strong>Receita atribuída, Investimento, ROAS, CAC/CPA</strong> " +
            "acima — e <strong>Conversões, CTR, CPC, Oportunidades, Aprovações e Tarefas</strong> " +
            "abaixo, compactos. Cada card é clicável e leva direto ao módulo.",
          side: "bottom",
          align: "start",
        },
      },

      // ── 4. Prioridade IA ───────────────────────────────────────────────
      {
        element: '[data-tour="priority-hero"]',
        popover: {
          title: "Prioridade da IA",
          description:
            "O Orion identifica a <strong>prioridade número 1</strong> agora: " +
            "o que custa mais, trava a operação ou representa maior oportunidade. " +
            "Com confiança calculada, impacto financeiro estimado e ação recomendada.",
          side: "bottom",
          align: "start",
        },
      },

      // ── 5. Ações / Tarefas ─────────────────────────────────────────────
      {
        element: '[data-tour="nav-tasks"]',
        popover: {
          title: "Ações e Tarefas",
          description:
            "Recomendações da IA viram tarefas com responsável, prazo e impacto esperado. " +
            "Você cria diretamente da Central ou aqui. O Orion acompanha o que foi feito.",
          side: "right",
          align: "start",
        },
      },

      // ── 6. Campanhas ───────────────────────────────────────────────────
      {
        element: '[data-tour="nav-campaigns"]',
        popover: {
          title: "Campanhas",
          description:
            "Acompanhe todas as campanhas ativas, planejadas e em análise. " +
            "Veja gasto, ROAS, CPA e ação recomendada para cada uma. " +
            "O Orion identifica qual campanha merece atenção agora.",
          side: "right",
          align: "start",
        },
      },

      // ── 7. Criativos ────────────────────────────────────────────────────
      {
        element: '[data-tour="nav-studio"]',
        popover: {
          title: "Criativos e Mídia",
          description:
            "Crie briefings, gere variantes com IA, organize assets por campanha e " +
            "gerencie aprovação de criativos antes de subir para os canais.",
          side: "right",
          align: "start",
        },
      },

      // ── 8. Calendário ──────────────────────────────────────────────────
      {
        element: '[data-tour="nav-calendar"]',
        popover: {
          title: "Calendário Editorial",
          description:
            "Cronograma visual de posts, stories, campanhas e publicações. " +
            "Integrado com criativos, canais e aprovações. " +
            "Planeje semanas à frente sem perder o controle de execução.",
          side: "right",
          align: "start",
        },
      },

      // ── 9. Clientes / CRM ──────────────────────────────────────────────
      {
        element: '[data-tour="nav-clientes"]',
        popover: {
          title: "CRM / Clientes",
          description:
            "Gerencie leads, oportunidades abertas e relacionamento com clientes. " +
            "O Orion identifica quem está quente, quem precisa de follow-up e " +
            "qual segmento tem maior potencial de recompra.",
          side: "right",
          align: "start",
        },
      },

      // ── 10. Aprovações ─────────────────────────────────────────────────
      {
        element: '[data-tour="nav-approvals"]',
        popover: {
          title: "Aprovações",
          description:
            "Decisões sensíveis — orçamentos extras, criativos prontos para ir ao ar, " +
            "campanhas aguardando liberação — passam por aqui. " +
            "Aprovação humana obrigatória antes da execução.",
          side: "right",
          align: "start",
        },
      },

      // ── 11. Resultados ──────────────────────────────────────────────────
      {
        element: '[data-tour="nav-executive-report"]',
        popover: {
          title: "Relatórios e Resultados",
          description:
            "Relatórios executivos gerados automaticamente com os dados do período. " +
            "Receita atribuída, ROAS, CAC, conversões e aprendizados consolidados.",
          side: "right",
          align: "start",
        },
      },

      // ── 12. Company DNA ────────────────────────────────────────────────
      {
        element: '[data-tour="nav-onboarding"]',
        popover: {
          title: "Company DNA",
          description:
            "O DNA da empresa é o que permite ao Orion entender seu negócio, público, " +
            "oferta e objetivos. Quanto mais completo, melhores as recomendações. " +
            "Atualize sempre que sua estratégia ou produto evoluir.",
          side: "right",
          align: "start",
        },
      },

      // ── 13. Company Brain ──────────────────────────────────────────────
      {
        element: '[data-tour="nav-cerebro"]',
        popover: {
          title: "Company Brain — memória operacional",
          description:
            "Tudo que acontece na operação é registrado aqui: decisões tomadas, " +
            "campanhas executadas, aprendizados e resultados. " +
            "É a memória que faz o Orion ficar cada vez mais preciso com o tempo.",
          side: "right",
          align: "start",
        },
      },

      // ── 14. Chat Orion ─────────────────────────────────────────────────
      {
        element: '[data-tour="nav-chat"]',
        popover: {
          title: "Chat Orion",
          description:
            "O Chat usa o contexto real do sistema — DNA, campanhas, métricas e memória. " +
            "Não é um chatbot genérico: ele sabe quem é sua empresa e o que está acontecendo. " +
            "Pergunte, peça análises ou solicite sugestões de ação.",
          side: "right",
          align: "start",
        },
      },

      // ── 15. Integrações ────────────────────────────────────────────────
      {
        element: '[data-tour="nav-integrations"]',
        popover: {
          title: "Integrações",
          description:
            "Conecte Meta Ads e Google Ads para o Orion sincronizar métricas reais " +
            "e executar ações automaticamente. Sem integração, os dados são demonstrativos.",
          side: "right",
          align: "start",
        },
      },

      // ── 16. Fechamento ─────────────────────────────────────────────────
      {
        popover: {
          title: "O Orion está pronto para operar",
          description:
            "O sistema funciona como uma operação viva: " +
            "<strong>detecta</strong> o que importa, " +
            "<strong>decide</strong> o que fazer, " +
            "<strong>executa</strong> com aprovação, " +
            "<strong>mede</strong> os resultados e " +
            "<strong>aprende</strong> com o histórico. " +
            "<br><br>" +
            "Comece pelo <strong>Company DNA</strong> e depois conecte uma plataforma em <strong>Integrações</strong>.",
        },
      },
    ],
  });
  d.drive();
};

export const startEmployeeTour = (onComplete: () => void) => {
  const d = driver({
    ...baseConfig,
    doneBtnText: "Começar ✓",
    onDestroyed: () => onComplete(),
    steps: [
      {
        popover: {
          title: "Bem-vindo à equipe",
          description:
            "Você foi adicionado como colaborador. " +
            "Vou te mostrar o essencial do Orion em 1 minuto.",
        },
      },
      {
        element: '[data-tour="nav-central"]',
        popover: {
          title: "Central Orion",
          description:
            "Visão geral da operação: métricas do período, prioridade atual e ações recomendadas pela IA.",
          side: "right",
          align: "start",
        },
      },
      {
        element: '[data-tour="nav-tasks"]',
        popover: {
          title: "Suas Tarefas",
          description:
            "O que você precisa fazer está aqui. " +
            "A IA cria tarefas automaticamente — ex: revisar um criativo, responder leads, atualizar orçamento.",
          side: "right",
          align: "start",
        },
      },
      {
        element: '[data-tour="nav-campaigns"]',
        popover: {
          title: "Campanhas",
          description:
            "Acompanhe o status das campanhas ativas, métricas e próximas ações.",
          side: "right",
          align: "start",
        },
      },
      {
        element: '[data-tour="nav-studio"]',
        popover: {
          title: "Criativos",
          description:
            "Crie briefings, faça upload de assets e gere variações de criativos com IA.",
          side: "right",
          align: "start",
        },
      },
      {
        element: '[data-tour="nav-calendar"]',
        popover: {
          title: "Calendário",
          description:
            "Cronograma editorial com posts, stories e campanhas agendadas por canal.",
          side: "right",
          align: "start",
        },
      },
      {
        element: '[data-tour="nav-approvals"]',
        popover: {
          title: "Aprovações",
          description:
            "Quando um criativo ou campanha precisar de aprovação, ela aparece aqui.",
          side: "right",
          align: "start",
        },
      },
      {
        element: '[data-tour="nav-chat"]',
        popover: {
          title: "Chat com Orion",
          description:
            "Pergunte qualquer coisa sobre a operação — a IA conhece os dados da empresa em detalhes.",
          side: "right",
          align: "start",
        },
      },
      {
        popover: {
          title: "Tudo pronto",
          description:
            "Comece pelas suas <strong>Tarefas</strong>. Se tiver dúvida, pergunte ao <strong>Chat Orion</strong>. Bom trabalho!",
        },
      },
    ],
  });
  d.drive();
};
