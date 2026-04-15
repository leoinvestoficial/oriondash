import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CheckCircle2,
  Palette,
  MessageSquare,
  Settings,
  Brain,
  Bell,
} from "lucide-react";

const NAV_ITEMS = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/approvals", label: "Aprovações", icon: CheckCircle2, badge: 3 },
  { path: "/studio", label: "Estúdio", icon: Palette },
  { path: "/chat", label: "Chat", icon: MessageSquare },
];

const BOTTOM_ITEMS = [
  { path: "/onboarding", label: "Company DNA", icon: Brain },
  { path: "/settings", label: "Configurações", icon: Settings },
];

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-60 border-r border-border bg-card flex flex-col shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
          <div className="w-8 h-8 rounded-lg orion-gradient flex items-center justify-center orion-glow">
            <span className="text-sm text-primary-foreground font-bold">O</span>
          </div>
          <span className="text-heading text-foreground font-medium">Orion</span>
        </div>

        {/* Navigation */}
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

        {/* Bottom */}
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

        {/* User */}
        <div className="px-4 py-3 border-t border-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-orion-surface-3 flex items-center justify-center text-xs text-muted-foreground">
            JD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-foreground truncate">João Demo</p>
            <p className="text-[10px] text-muted-foreground">Admin</p>
          </div>
          <Bell className="w-4 h-4 text-muted-foreground" />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
};
