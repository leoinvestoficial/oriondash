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
// Bump when the default changes — forces a one-time migration per storageKey
const STORAGE_VERSION = "v2";

const isViewMode = (value: string | null): value is OrionViewMode =>
  value === "simplified" || value === "pro";

const migrateKey = (storageKey: string, defaultMode: OrionViewMode): OrionViewMode => {
  if (typeof window === "undefined") return defaultMode;
  const versionKey = `${storageKey}:version`;
  if (window.localStorage.getItem(versionKey) !== STORAGE_VERSION) {
    // Old value — reset to new default
    window.localStorage.setItem(storageKey, defaultMode);
    window.localStorage.setItem(versionKey, STORAGE_VERSION);
    return defaultMode;
  }
  const stored = window.localStorage.getItem(storageKey);
  return isViewMode(stored) ? stored : defaultMode;
};

export const useOrionViewMode = () => {
  const { user } = useAuth();
  const { role } = useUserRole();
  const productRole = useMemo<OrionRole>(() => normalizeOrionRole(role), [role]);
  const canUsePro = canUseProView(productRole);
  const defaultMode = defaultViewModeForRole(productRole);

  // Per-user key — during initial render user may be null (auth async),
  // so we use role-based key as fallback. The effect below handles the
  // transition once the real user.id is known.
  const storageKey = user?.id ? `${STORAGE_KEY}:${user.id}` : `${STORAGE_KEY}:${productRole}`;

  const [viewMode, setViewModeState] = useState<OrionViewMode>(() =>
    migrateKey(storageKey, defaultMode)
  );

  // Re-run migration whenever storageKey changes (e.g. user.id resolves after
  // auth loads). This ensures the per-user key is migrated to v2 even if the
  // initial render ran on the role-based key.
  useEffect(() => {
    // If Pro not allowed, force simplified regardless
    if (!canUsePro) {
      setViewModeState("simplified");
      window.localStorage.setItem(storageKey, "simplified");
      return;
    }
    const migrated = migrateKey(storageKey, defaultMode);
    setViewModeState(migrated);
  }, [storageKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const setViewMode = useCallback((next: OrionViewMode) => {
    const safeNext = next === "pro" && !canUsePro ? "simplified" : next;
    setViewModeState(safeNext);
    window.localStorage.setItem(storageKey, safeNext);
    // Mark as migrated so future loads respect user's explicit choice
    window.localStorage.setItem(`${storageKey}:version`, STORAGE_VERSION);
  }, [canUsePro, storageKey]);

  return {
    viewMode,
    setViewMode,
    productRole,
    canUsePro,
    storageKey,
  };
};
