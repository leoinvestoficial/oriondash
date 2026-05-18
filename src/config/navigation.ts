import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  Brain,
  BrainCircuit,
  Building2,
  CalendarDays,
  CheckCircle2,
  Contact,
  FileText,
  GitBranch,
  ListTodo,
  Megaphone,
  MessageSquare,
  Network,
  Orbit,
  Palette,
  Plug,
  Radar,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  UserRoundSearch,
  Users,
  Zap,
} from "lucide-react";
import type { OrionMode, OrionRole, OrionViewMode } from "@/lib/productRoles";

export interface NavigationItem {
  path: string;
  label: string;
  icon: LucideIcon;
  tour: string;
  description?: string;
  /** Pro mode: group header */
  group?: string;
  /** Simplified mode: renders a visual divider + label above this item */
  sectionLabel?: string;
  /** Renders at very bottom of sidebar, visually isolated */
  isolated?: boolean;
  badge?: number;
  ownerOnly?: boolean;
  productModes?: OrionMode[];
  roles?: OrionRole[];
}

// ─── Simplified ──────────────────────────────────────────────────────────────
// Short, clean, ordered by daily frequency of use.
const simplifiedItems: NavigationItem[] = [
  { path: "/central",          label: "Central",       icon: Orbit,        tour: "central",       description: "Sala de comando, métricas e prioridades" },
  { path: "/tasks",            label: "Ações",         icon: ListTodo,     tour: "actions",       description: "Tarefas, aprovações e próximos passos" },
  { path: "/campaigns",        label: "Campanhas",     icon: Megaphone,    tour: "campaigns",     description: "Campanhas ativas, planejadas e pendentes" },
  { path: "/studio",           label: "Criativos",     icon: Palette,      tour: "studio",        description: "Peças, briefs, variações e mídia" },
  { path: "/calendar",         label: "Calendário",    icon: CalendarDays, tour: "calendar",      description: "Cronograma de conteúdo e publicações" },
  { path: "/clientes",         label: "Clientes",      icon: Contact,      tour: "clientes",      description: "CRM, oportunidades e relacionamento" },
  { path: "/executive-report", label: "Resultados",    icon: FileText,     tour: "results",       description: "Performance, relatórios e evolução" },
  { path: "/chat",             label: "Chat Orion",    icon: MessageSquare,tour: "chat",          description: "Assistente contextual da empresa" },

  // ── Empresa ──
  { path: "/onboarding",       label: "Empresa",       icon: Brain,        tour: "company",       description: "DNA, oferta, público e objetivos", ownerOnly: true, sectionLabel: "Empresa" },
  { path: "/brand-identity",   label: "Marca",         icon: BadgeCheck,   tour: "brand-identity",description: "Identidade visual e tom de voz",   ownerOnly: true },

  // ── Sistema ──
  { path: "/settings",         label: "Configurações", icon: Settings,     tour: "settings",      description: "Preferências e políticas",          ownerOnly: true, sectionLabel: "Sistema" },

  // ── Memória (isolado no final) ──
  { path: "/cerebro",          label: "Company Brain", icon: BrainCircuit, tour: "cerebro",       description: "Memória operacional e aprendizados", isolated: true },
];

// ─── Pro ─────────────────────────────────────────────────────────────────────
// Grouped by function. Company Brain isolated at bottom.
const proItems: NavigationItem[] = [
  // ── Comando ──
  { path: "/central",          label: "Central Orion",      icon: Orbit,         tour: "central",          group: "Comando",    productModes: ["owner", "manager", "agency"] },
  { path: "/diagnostico",      label: "Diagnóstico",        icon: Sparkles,      tour: "diagnostico",      group: "Comando",    ownerOnly: true, productModes: ["owner", "manager"] },
  { path: "/decisoes",         label: "Decisões IA",        icon: Zap,           tour: "decisoes",         group: "Comando",    ownerOnly: true, productModes: ["owner", "manager"] },
  { path: "/tasks",            label: "Ações/Tarefas",      icon: ListTodo,      tour: "tasks",            group: "Comando",    productModes: ["owner", "manager"] },
  { path: "/approvals",        label: "Aprovações",         icon: CheckCircle2,  tour: "approvals",        group: "Comando",    ownerOnly: true, productModes: ["owner", "agency"] },

  // ── Execução ──
  { path: "/campaigns",        label: "Campanhas",          icon: Megaphone,     tour: "campaigns",        group: "Execução",   productModes: ["owner", "manager", "agency"] },
  { path: "/studio",           label: "Criativos e Mídia",  icon: Palette,       tour: "studio",           group: "Execução",   productModes: ["owner", "manager", "agency"] },
  { path: "/calendar",         label: "Calendário",         icon: CalendarDays,  tour: "calendar",         group: "Execução",   productModes: ["owner", "manager"] },
  { path: "/funnels",          label: "Funis",              icon: GitBranch,     tour: "funnels",          group: "Execução",   productModes: ["owner", "manager"] },

  // ── Comercial ──
  { path: "/clientes",         label: "CRM / Clientes",     icon: Contact,       tour: "clientes",         group: "Comercial",  productModes: ["owner", "manager"] },
  { path: "/clientes",         label: "Contas",             icon: Building2,     tour: "accounts",         group: "Agência",    productModes: ["agency"] },

  // ── Estratégia ──
  { path: "/onboarding",       label: "Company DNA",        icon: Brain,         tour: "onboarding",       group: "Estratégia", ownerOnly: true, productModes: ["owner", "manager"] },
  { path: "/strategy",         label: "Estratégia",         icon: Target,        tour: "strategy",         group: "Estratégia", ownerOnly: true, productModes: ["owner", "manager"] },
  { path: "/intelligence",     label: "Radar",              icon: Radar,         tour: "intelligence",     group: "Estratégia", ownerOnly: true, productModes: ["owner", "manager"] },
  { path: "/personas",         label: "Personas",           icon: UserRoundSearch,tour:"personas",         group: "Estratégia", ownerOnly: true, productModes: ["owner", "manager"] },
  { path: "/brand-identity",   label: "Marca",              icon: BadgeCheck,    tour: "brand-identity",   group: "Estratégia", ownerOnly: true, productModes: ["owner", "manager", "agency"] },

  // ── Análise ──
  { path: "/executive-report", label: "Relatórios",         icon: FileText,      tour: "executive-report", group: "Análise",    ownerOnly: true, productModes: ["owner", "manager", "agency"] },

  // ── Gestão ──
  { path: "/team",             label: "Equipe",             icon: Users,         tour: "team",             group: "Gestão",     ownerOnly: true, productModes: ["owner", "agency"] },
  { path: "/internal-structure",label:"Estrutura Interna",  icon: Network,       tour: "internal-structure",group:"Gestão",     ownerOnly: true, productModes: ["owner"] },
  { path: "/governance",       label: "Governança",         icon: ShieldCheck,   tour: "governance",       group: "Gestão",     ownerOnly: true, productModes: ["owner", "agency"] },
  { path: "/integrations",     label: "Integrações",        icon: Plug,          tour: "integrations",     group: "Gestão",     ownerOnly: true, productModes: ["owner", "manager", "agency"] },
  { path: "/settings",         label: "Configurações",      icon: Settings,      tour: "settings",         group: "Gestão",     ownerOnly: true, productModes: ["owner", "manager", "agency"] },
  { path: "/chat",             label: "Chat Orion",         icon: MessageSquare, tour: "chat",             group: "Gestão",     productModes: ["owner", "manager", "agency"] },

  // ── Memória (isolado no final) ──
  { path: "/cerebro",          label: "Company Brain",      icon: BrainCircuit,  tour: "cerebro",          isolated: true,      productModes: ["owner", "manager", "agency"] },
];

export const getNavigationItems = (viewMode: OrionViewMode): NavigationItem[] => (
  viewMode === "simplified" ? simplifiedItems : proItems
);
