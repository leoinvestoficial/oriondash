import { useEffect, useRef } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { startEmployeeTour, startOwnerTour } from "@/lib/tours";
import { useLocation } from "react-router-dom";

/**
 * Inicia automaticamente o tour da primeira vez (owner ou employee)
 * apenas quando o usuário está em /central (tela principal).
 */
export const TourLauncher = () => {
  const location = useLocation();
  const { can, loading: permLoading } = usePermissions();
  const { prefs, loading: prefsLoading, completeTour } = useUserPreferences();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    if (permLoading || prefsLoading) return;
    if (prefs.tour_completed) return;
    if (location.pathname !== "/central") return;

    started.current = true;
    const t = setTimeout(() => {
      const onDone = () => completeTour();
      if (can("governance.view")) {
        startOwnerTour(onDone);
      } else {
        startEmployeeTour(onDone);
      }
    }, 800);
    return () => clearTimeout(t);
  }, [permLoading, can, prefs.tour_completed, prefsLoading, location.pathname, completeTour]);

  return null;
};
