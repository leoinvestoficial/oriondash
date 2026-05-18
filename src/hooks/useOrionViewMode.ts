import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import {
  canUseProView,
  defaultViewModeForRole,
  normalizeOrionRole,
  type OrionRole,
  type OrionViewMode,
} from "@/lib/productRoles";

const STORAGE_KEY = "orion:view_mode";

const isViewMode = (value: string | null): value is OrionViewMode =>
  value === "simplified" || value === "pro";

export const useOrionViewMode = () => {
  const { user } = useAuth();
  const { role } = useUserRole();
  const productRole = useMemo<OrionRole>(() => normalizeOrionRole(role), [role]);
  const canUsePro = canUseProView(productRole);
  const defaultMode = defaultViewModeForRole(productRole);
  // storageKey defined before useState so the initializer uses the correct per-user key
  const storageKey = user?.id ? `${STORAGE_KEY}:${user.id}` : `${STORAGE_KEY}:${productRole}`;

  const [viewMode, setViewModeState] = useState<OrionViewMode>(() => {
    if (typeof window === "undefined") return defaultMode;
    // Use storageKey (per-user) to avoid one user contaminating another's preference
    const stored = window.localStorage.getItem(storageKey);
    return isViewMode(stored) ? stored : defaultMode;
  });

  useEffect(() => {
    if (viewMode === "pro" && !canUsePro) {
      setViewModeState("simplified");
      window.localStorage.setItem(storageKey, "simplified");
      return;
    }
    const stored = window.localStorage.getItem(storageKey);
    if (!isViewMode(stored)) {
      setViewModeState(defaultMode);
      window.localStorage.setItem(storageKey, defaultMode);
    } else if (stored !== viewMode) {
      setViewModeState(stored);
    }
  }, [canUsePro, defaultMode, storageKey, viewMode]);

  const setViewMode = useCallback((next: OrionViewMode) => {
    const safeNext = next === "pro" && !canUsePro ? "simplified" : next;
    setViewModeState(safeNext);
    window.localStorage.setItem(storageKey, safeNext);
  }, [canUsePro, storageKey]);

  return {
    viewMode,
    setViewMode,
    productRole,
    canUsePro,
    storageKey,
  };
};
