import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
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
import { ChevronDown, LogOut, PlayCircle, Menu } from "lucide-react";

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

// ─── Nav item ─────────────────────────────────────────────────────────────────
const NavItem = ({
  item,
  isActive,
  onNavigate,
}: {
  item: NavigationItem;
  isActive: boolean;
  onNavigate?: () => void;
}) => (
  <Link
    to={item.path}
    data-tour={`nav-${item.tour}`}
    onClick={onNavigate}
    className={cn(
      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all min-h-[40px]",
      isActive
        ? "bg-primary/12 text-primary font-medium"
        : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
    )}
  >
    <item.icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground/70")} />
    <span className="flex-1 min-w-0 truncate">{item.label}</span>
    {item.badge != null && item.badge > 0 && (
      <span className="min-w-[18px] h-[18px] rounded-full bg-destructive text-[10px] flex items-center justify-center text-primary-foreground font-semibold px-1">
        {item.badge > 99 ? "99+" : item.badge}
      </span>
    )}
  </Link>
);

// ─── Section divider ─────────────────────────────────────────────────────────
const SectionDivider = ({ label }: { label: string }) => (
  <div className="flex items-center gap-2 px-3 pt-4 pb-1">
    <div className="flex-1 h-px bg-border/60" />
    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 shrink-0">
      {label}
    </p>
  </div>
);

// ─── Collapsible Pro groups ───────────────────────────────────────────────────
const CollapsibleProGroups = ({
  grouped,
  pathname,
  onNavigate,
}: {
  grouped: Record<string, NavigationItem[]>;
  pathname: string;
  onNavigate?: () => void;
}) => {
  // Determine which group contains the active item so we can open it by default
  const defaultOpen = useMemo(() => {
    const open: Record<string, boolean> = {};
    for (const [group, items] of Object.entries(grouped)) {
      open[group] = items.some((i) => i.path === pathname);
    }
    return open;
  }, [grouped, pathname]);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(defaultOpen);
  const prevPathRef = useRef(pathname);

  // Auto-expand the group when the active route changes
  useEffect(() => {
    if (prevPathRef.current === pathname) return;
    prevPathRef.current = pathname;
    const update: Record<string, boolean> = {};
    for (const [group, items] of Object.entries(grouped)) {
      if (items.some((i) => i.path === pathname)) update[group] = true;
    }
    if (Object.keys(update).length > 0) setOpenGroups((prev) => ({ ...prev, ...update }));
  }, [pathname, grouped]);

  const toggle = (group: string) => setOpenGroups((prev) => ({ ...prev, [group]: !prev[group] }));

  return (
    <>
      {Object.entries(grouped).map(([group, items]) => {
        const isOpen = openGroups[group] ?? false;
        const hasActive = items.some((i) => i.path === pathname);
        return (
          <div key={group} className="space-y-0.5">
            <button
              onClick={() => toggle(group)}
              className={cn(
                "w-full flex items-center gap-2 px-3 pt-3.5 pb-1.5 transition-colors group/label",
                hasActive ? "text-primary" : "text-muted-foreground/60 hover:text-muted-foreground"
              )}
            >
              {/* active indicator dot */}
              <span className={cn(
                "w-1 h-1 rounded-full shrink-0 transition-colors",
                hasActive ? "bg-primary" : "bg-muted-foreground/30 group-hover/label:bg-muted-foreground/50"
              )} />
              <span className="flex-1 text-left text-[10px] font-semibold uppercase tracking-wider">
                {group}
              </span>
              <ChevronDown
                className={cn(
                  "w-3 h-3 shrink-0 transition-transform duration-200",
                  isOpen ? "rotate-0" : "-rotate-90"
                )}
              />
            </button>
            {isOpen && items.map((item) => (
              <NavItem
                key={`${item.path}-${item.tour}`}
                item={item}
                isActive={pathname === item.path}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        );
      })}
    </>
  );
};

// ─── Sidebar body ─────────────────────────────────────────────────────────────
const SidebarBody = ({
  visibleItems,
  pathname,
  initials,
  displayName,
  email,
  onNavigate,
  onSignOut,
  onReplayTour,
  viewMode,
  onViewModeChange,
  canUsePro,
}: SidebarBodyProps) => {
  const regularItems = visibleItems.filter((i) => !i.isolated);
  const isolatedItems = visibleItems.filter((i) => i.isolated);

  // ── Pro mode: collapsible groups by item.group ────────────────────────────
  const renderProItems = () => {
    const grouped = regularItems.reduce<Record<string, NavigationItem[]>>((acc, item) => {
      const g = item.group || "Outros";
      acc[g] = [...(acc[g] || []), item];
      return acc;
    }, {});

    return <CollapsibleProGroups grouped={grouped} pathname={pathname} onNavigate={onNavigate} />;
  };

  // ── Simplified mode: sectionLabel dividers ────────────────────────────────
  const renderSimplifiedItems = () => {
    const nodes: React.ReactNode[] = [];
    for (const item of regularItems) {
      if (item.sectionLabel) {
        nodes.push(<SectionDivider key={`sep-${item.sectionLabel}`} label={item.sectionLabel} />);
      }
      nodes.push(
        <NavItem
          key={`${item.path}-${item.tour}`}
          item={item}
          isActive={pathname === item.path}
          onNavigate={onNavigate}
        />
      );
    }
    return nodes;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-center px-5 py-4 border-b border-border/60">
        <img src={orionLogo} alt="Orion" className="w-9 h-9 rounded-lg object-cover" />
      </div>

      {/* Mode switcher */}
      <div className="border-b border-border/60 px-3 py-2.5">
        <ModeSwitcher value={viewMode} onChange={onViewModeChange} canUsePro={canUsePro} />
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto scrollbar-none">
        {viewMode === "pro" ? renderProItems() : renderSimplifiedItems()}
      </nav>

      {/* Isolated items (Company Brain) */}
      {isolatedItems.length > 0 && (
        <div className="px-2 pt-2 pb-1 border-t border-border/60">
          <div className="flex items-center gap-2 px-3 py-1.5">
            <div className="flex-1 h-px bg-border/40" />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 shrink-0">
              Memória
            </p>
          </div>
          {isolatedItems.map((item) => (
            <NavItem
              key={`${item.path}-${item.tour}`}
              item={item}
              isActive={pathname === item.path}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}

      {/* Tour */}
      <div className="px-2 pb-1 border-t border-border/60 pt-2">
        <button
          onClick={() => { onReplayTour(); onNavigate?.(); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-muted-foreground hover:text-foreground hover:bg-muted/20 min-h-[40px]"
        >
          <PlayCircle className="w-4 h-4 shrink-0 text-muted-foreground/60" />
          <span>Refazer tour</span>
        </button>
      </div>

      {/* User */}
      <div className="px-3 py-3 border-t border-border/60 flex items-center gap-3">
        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[11px] text-primary font-semibold shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-foreground font-medium truncate">{displayName}</p>
          <p className="text-[10px] text-muted-foreground truncate">{email}</p>
        </div>
        <button
          onClick={onSignOut}
          className="text-muted-foreground/60 hover:text-foreground transition-colors p-1.5 -m-1 rounded-md hover:bg-muted/20"
          title="Sair"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

// ─── App layout ───────────────────────────────────────────────────────────────
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
    if (!user || !canSeeOwnerOnly) { setPendingApprovals(0); return; }
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

  const itemsWithBadges = visibleItems.map((item) =>
    item.path === "/approvals" ? { ...item, badge: pendingApprovals || undefined } : item
  );

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuário";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  const handleSignOut = async () => { await signOut(); navigate("/auth"); };

  const replayTour = () => {
    if (canSeeOwnerOnly) startOwnerTour(() => completeTour());
    else startEmployeeTour(() => completeTour());
  };

  const sidebarProps: SidebarBodyProps = {
    visibleItems: itemsWithBadges,
    pathname: location.pathname,
    initials,
    displayName,
    email: user?.email,
    onSignOut: handleSignOut,
    onReplayTour: replayTour,
    viewMode,
    onViewModeChange: setViewMode,
    canUsePro,
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      {!isMobile && (
        <aside className="w-56 border-r border-border/60 bg-card/50 flex flex-col shrink-0 sticky top-0 h-screen">
          <SidebarBody {...sidebarProps} />
        </aside>
      )}

      <main id="orion-main-scroll" className="flex-1 overflow-auto min-w-0">
        {/* Mobile top bar */}
        {isMobile && (
          <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-card/95 backdrop-blur border-b border-border/60">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button
                  aria-label="Abrir menu"
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/20"
                >
                  <Menu className="w-5 h-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-56 bg-card border-border/60">
                <SidebarBody {...sidebarProps} onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>
            <img src={orionLogo} alt="Orion" className="w-7 h-7 rounded-md object-cover" />
            <div className="w-9" />
          </header>
        )}
        {children}
      </main>
    </div>
  );
};
