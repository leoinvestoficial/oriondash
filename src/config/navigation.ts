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
  group?: string;
  badge?: number;
  ownerOnly?: boolean;
  productModes?: OrionMode[];
  roles?: OrionRole[];
}

const simplifiedItems: NavigationItem[] = [
  { path: "/central", label: "Central", icon: Orbit, tour: "central", description: "Prioridade, recomendações e próximos passos" },
  { path: "/tasks", label: "Ações", icon: ListTodo, tour: "actions", description: "Tarefas, aprovações e execuções pendentes" },
  { path: "/campaigns", label: "Campanhas", icon: Megaphone, tour: "campaigns", description: "Campanhas ativas, planejadas e bloqueadas" },
  { path: "/calendar", label: "Calendário", icon: CalendarDays, tour: "calendar", description: "Agendamento de conteúdo e publicações" },
  { path: "/studio", label: "Criativos", icon: Palette, tour: "studio", description: "Briefs, peças e mídia preparada" },
  { path: "/executive-report", label: "Resultados", icon: FileText, tour: "results", description: "Resumo de performance e aprendizados" },
  { path: "/chat", label: "Chat Orion", icon: MessageSquare, tour: "chat", description: "Assistente com contexto da empresa" },
  { path: "/onboarding", label: "Empresa", icon: Brain, tour: "company", description: "DNA, oferta, público e objetivos", ownerOnly: true },
  { path: "/settings", label: "Configurações", icon: Settings, tour: "settings", description: "Preferências principais", ownerOnly: true },
];

const proItems: NavigationItem[] = [
  { path: "/central", label: "Central Orion", icon: Orbit, tour: "central", group: "Operação", productModes: ["owner", "manager", "agency"] },
  { path: "/tasks", label: "Ações/Tarefas", icon: ListTodo, tour: "tasks", group: "Operação", productModes: ["owner", "manager"] },
  { path: "/approvals", label: "Aprovações", icon: CheckCircle2, tour: "approvals", group: "Operação", ownerOnly: true, productModes: ["owner", "agency"] },
  { path: "/calendar", label: "Calendário", icon: CalendarDays, tour: "calendar", group: "Operação", productModes: ["owner", "manager"] },

  { path: "/campaigns", label: "Campanhas", icon: Megaphone, tour: "campaigns", group: "Marketing", productModes: ["owner", "manager", "agency"] },
  { path: "/studio", label: "Criativos e Mídia", icon: Palette, tour: "studio", group: "Marketing", productModes: ["owner", "manager", "agency"] },
  { path: "/brand-identity", label: "Marca", icon: BadgeCheck, tour: "brand-identity", group: "Marketing", ownerOnly: true, productModes: ["owner", "manager", "agency"] },
  { path: "/personas", label: "Personas", icon: UserRoundSearch, tour: "personas", group: "Marketing", ownerOnly: true, productModes: ["owner", "manager"] },
  { path: "/funnels", label: "Funis", icon: GitBranch, tour: "funnels", group: "Marketing", productModes: ["owner", "manager"] },

  { path: "/clientes", label: "CRM", icon: Contact, tour: "clientes", group: "Comercial", productModes: ["owner", "manager"] },
  { path: "/clientes", label: "Contas", icon: Building2, tour: "accounts", group: "Agência", productModes: ["agency"] },

  { path: "/onboarding", label: "Company DNA", icon: Brain, tour: "onboarding", group: "Estratégia", ownerOnly: true, productModes: ["owner", "manager"] },
  { path: "/cerebro", label: "Base Estratégica", icon: BrainCircuit, tour: "cerebro", group: "Estratégia", productModes: ["owner", "manager", "agency"] },
  { path: "/strategy", label: "Estratégia", icon: Target, tour: "strategy", group: "Estratégia", ownerOnly: true, productModes: ["owner", "manager"] },
  { path: "/intelligence", label: "Radar", icon: Radar, tour: "intelligence", group: "Estratégia", ownerOnly: true, productModes: ["owner", "manager"] },

  { path: "/executive-report", label: "Relatórios", icon: FileText, tour: "executive-report", group: "Análise", ownerOnly: true, productModes: ["owner", "manager", "agency"] },
  { path: "/decisoes", label: "Decisões IA", icon: Zap, tour: "decisoes", group: "Análise", ownerOnly: true, productModes: ["owner", "manager"] },
  { path: "/diagnostico", label: "Diagnóstico", icon: Sparkles, tour: "diagnostico", group: "Análise", ownerOnly: true, productModes: ["owner", "manager"] },

  { path: "/team", label: "Equipe", icon: Users, tour: "team", group: "Gestão", ownerOnly: true, productModes: ["owner", "agency"] },
  { path: "/internal-structure", label: "Estrutura Interna", icon: Network, tour: "internal-structure", group: "Gestão", ownerOnly: true, productModes: ["owner"] },
  { path: "/governance", label: "Governança", icon: ShieldCheck, tour: "governance", group: "Gestão", ownerOnly: true, productModes: ["owner", "agency"] },
  { path: "/integrations", label: "Integrações", icon: Plug, tour: "integrations", group: "Gestão", ownerOnly: true, productModes: ["owner", "manager", "agency"] },
  { path: "/settings", label: "Configurações", icon: Settings, tour: "settings", group: "Gestão", ownerOnly: true, productModes: ["owner", "manager", "agency"] },
  { path: "/chat", label: "Chat Orion", icon: MessageSquare, tour: "chat", group: "Gestão", productModes: ["owner", "manager", "agency"] },
];

export const getNavigationItems = (viewMode: OrionViewMode): NavigationItem[] => (
  viewMode === "simplified" ? simplifiedItems : proItems
);
