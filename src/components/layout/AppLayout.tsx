import { ReactNode } from "react";
import orionLogo from "@/assets/orion-logo.png";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  CheckCircle2,
  Palette,
  MessageSquare,
  Settings,
  Brain,
  Bell,
  LogOut,
  Users,
  ListTodo,
  Plug,
  Megaphone,
  CalendarDays,
  Sparkles,
  Zap,
  BrainCircuit,
} from "lucide-react";

const NAV_ITEMS = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/cerebro", label: "Cérebro", icon: BrainCircuit },
  { path: "/diagnostico", label: "Diagnóstico", icon: Sparkles },
  { path: "/decisoes", label: "Decisões IA", icon: Zap },
  { path: "/campaigns", label: "Campanhas", icon: Megaphone },
  { path: "/calendar", label: "Cronograma", icon: CalendarDays },
  { path: "/tasks", label: "Tarefas", icon: ListTodo },
  { path: "/approvals", label: "Aprovações", icon: CheckCircle2, badge: 3 },
  { path: "/studio", label: "Estúdio", icon: Palette },
  { path: "/chat", label: "Chat", icon: MessageSquare },
  { path: "/team", label: "Equipe", icon: Users },
];
const BOTTOM_ITEMS = [
  { path: "/integrations", label: "Integrações", icon: Plug },
  { path: "/onboarding", label: "Company DNA", icon: Brain },
];

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuário";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-60 border-r border-border bg-card flex flex-col shrink-0">
        <div className="flex items-center justify-center px-5 py-5 border-b border-border">
          <img src={orionLogo} alt="Orion" className="w-10 h-10 rounded-lg object-cover" />
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                )}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="w-5 h-5 rounded-full bg-orion-coral text-[10px] flex items-center justify-center text-primary-foreground font-medium">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 pb-4 space-y-1 border-t border-border pt-4">
          {BOTTOM_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                )}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="px-4 py-3 border-t border-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-orion-surface-3 flex items-center justify-center text-xs text-muted-foreground">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-foreground truncate">{displayName}</p>
            <p className="text-[10px] text-muted-foreground">{user?.email}</p>
          </div>
          <button onClick={handleSignOut} className="text-muted-foreground hover:text-foreground transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
};
