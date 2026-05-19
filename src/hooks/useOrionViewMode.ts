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
// Bump this when the default changes so old stored values are ignored for eligible roles
const STORAGE_VERSION = "v2";

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
    // One-time migration: if the stored version doesn't match current, reset to new default
    const versionKey = `${storageKey}:version`;
    if (window.localStorage.getItem(versionKey) !== STORAGE_VERSION) {
      window.localStorage.setItem(storageKey, defaultMode);
      window.localStorage.setItem(versionKey, STORAGE_VERSION);
      return defaultMode;
    }
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
