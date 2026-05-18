import { ReactNode, useEffect, useState } from "react";
import orionLogo from "@/assets/orion-logo.png";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useIsMobile } from "@/hooks/use-mobile";
import { useOrionViewMode } from "@/hooks/useOrionViewMode";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { startEmployeeTour, startOwnerTour } from "@/lib/tours";
import { modeForRole, normalizeOrionRole } from "@/lib/productRoles";
import { getNavigationItems, type NavigationItem } from "@/config/navigation";
import { ModeSwitcher } from "@/components/layout/ModeSwitcher";
import {
  LogOut,
  PlayCircle,
  Menu,
} from "lucide-react";

interface AppLayoutProps {
  children: ReactNode;
}

interface SidebarBodyProps {
  visibleItems: NavigationItem[];
  pathname: string;
  initials: string;
  displayName: string;
  email?: string | null;
  onNavigate?: () => void;
  onSignOut: () => void;
  onReplayTour: () => void;
  viewMode: "simplified" | "pro";
  onViewModeChange: (mode: "simplified" | "pro") => void;
  canUsePro: boolean;
}

const SidebarBody = ({
  visibleItems, pathname, initials, displayName, email, onNavigate, onSignOut, onReplayTour,
  viewMode, onViewModeChange, canUsePro,
}: SidebarBodyProps) => {
  const grouped = visibleItems.reduce<Record<string, NavigationItem[]>>((acc, item) => {
    const group = viewMode === "pro" ? item.group || "Outros" : "Simplificado";
    acc[group] = [...(acc[group] || []), item];
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-center px-5 py-5 border-b border-border">
        <img src={orionLogo} alt="Orion" className="w-10 h-10 rounded-lg object-cover" />
      </div>

      <div className="border-b border-border px-3 py-3">
        <ModeSwitcher value={viewMode} onChange={onViewModeChange} canUsePro={canUsePro} />
      </div>

      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {Object.entries(grouped).map(([group, items]) => (
          <div key={group} className="space-y-1">
            {viewMode === "pro" && (
              <p className="px-3 pb-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                {group}
              </p>
            )}
            {items.map((item) => {
        const isActive = pathname === item.path;
        return (
          <Link
            key={`${item.path}-${item.tour}`}
            to={item.path}
            data-tour={`nav-${item.tour}`}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-all min-h-[44px]",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
            )}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span className="flex-1 min-w-0 truncate">{item.label}</span>
            {item.badge && (
              <span className="w-5 h-5 rounded-full bg-orion-coral text-[10px] flex items-center justify-center text-primary-foreground font-medium">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
          </div>
        ))}
      </nav>

      <div className="px-3 pb-2 space-y-1 border-t border-border pt-4">
      <button
        onClick={() => { onReplayTour(); onNavigate?.(); }}
        className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-all text-muted-foreground hover:text-foreground hover:bg-muted/30 min-h-[44px]"
      >
        <PlayCircle className="w-4 h-4" />
        <span>Refazer tour</span>
      </button>
      </div>

      <div className="px-4 py-3 border-t border-border flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-orion-surface-3 flex items-center justify-center text-xs text-muted-foreground">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-foreground truncate">{displayName}</p>
        <p className="text-[10px] text-muted-foreground truncate">{email}</p>
      </div>
      <button onClick={onSignOut} className="text-muted-foreground hover:text-foreground transition-colors p-2 -m-2">
        <LogOut className="w-4 h-4" />
      </button>
      </div>
    </div>
  );
};

export const AppLayout = ({ children }: AppLayoutProps) => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { role, isOwner, isAdmin } = useUserRole();
  const { completeTour } = useUserPreferences();
  const isMobile = useIsMobile();
  const { viewMode, setViewMode, canUsePro } = useOrionViewMode();
  const [open, setOpen] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState(0);

  const productRole = normalizeOrionRole(role);
  const productMode = modeForRole(productRole);
  const canSeeOwnerOnly = isOwner || isAdmin || productRole === "agency_admin";
  const visibleItems = getNavigationItems(viewMode)
    .filter((item) => !item.productModes || item.productModes.includes(productMode))
    .filter((item) => !item.roles || item.roles.includes(productRole))
    .filter((item) => !item.ownerOnly || canSeeOwnerOnly);

  useEffect(() => {
    if (!user || !canSeeOwnerOnly) {
      setPendingApprovals(0);
      return;
    }

    let cancelled = false;
    supabase
      .from("approvals")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "pending")
      .then(({ count, error }) => {
        if (!cancelled && !error) setPendingApprovals(count || 0);
      });

    return () => { cancelled = true; };
  }, [user, canSeeOwnerOnly]);

  const itemsWithBadges = visibleItems.map((item) => (
    item.path === "/approvals" ? { ...item, badge: pendingApprovals || undefined } : item
  ));

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

  const replayTour = () => {
    if (canSeeOwnerOnly) startOwnerTour(() => completeTour());
    else startEmployeeTour(() => completeTour());
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      {!isMobile && (
        <aside className="w-60 border-r border-border bg-card flex flex-col shrink-0">
          <SidebarBody
            visibleItems={itemsWithBadges}
            pathname={location.pathname}
            initials={initials}
            displayName={displayName}
            email={user?.email}
            onSignOut={handleSignOut}
            onReplayTour={replayTour}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            canUsePro={canUsePro}
          />
        </aside>
      )}

      <main className="flex-1 overflow-auto min-w-0">
        {/* Mobile top bar */}
        {isMobile && (
          <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-card/95 backdrop-blur border-b border-border">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button
                  aria-label="Abrir menu"
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-foreground hover:bg-muted/30"
                >
                  <Menu className="w-5 h-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64 bg-card border-border">
                <SidebarBody
                  visibleItems={itemsWithBadges}
                  pathname={location.pathname}
                  initials={initials}
                  displayName={displayName}
                  email={user?.email}
                  onNavigate={() => setOpen(false)}
                  onSignOut={handleSignOut}
                  onReplayTour={replayTour}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  canUsePro={canUsePro}
                />
              </SheetContent>
            </Sheet>
            <img src={orionLogo} alt="Orion" className="w-8 h-8 rounded-md object-cover" />
            <div className="w-10" />
          </header>
        )}
        {children}
      </main>
    </div>
  );
};
