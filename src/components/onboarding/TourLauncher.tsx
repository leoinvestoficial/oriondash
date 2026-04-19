import { useEffect, useRef } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { startEmployeeTour, startOwnerTour } from "@/lib/tours";
import { useLocation } from "react-router-dom";

/**
 * Inicia automaticamente o tour da primeira vez (owner ou employee)
 * apenas quando o usuário está no /dashboard.
 */
export const TourLauncher = () => {
  const location = useLocation();
  const { role, loading: roleLoading } = useUserRole();
  const { prefs, loading: prefsLoading, completeTour } = useUserPreferences();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    if (roleLoading || prefsLoading) return;
    if (!role) return;
    if (prefs.tour_completed) return;
    if (location.pathname !== "/dashboard") return;

    started.current = true;
    const t = setTimeout(() => {
      const onDone = () => completeTour();
      if (role === "owner" || role === "admin") {
        startOwnerTour(onDone);
      } else {
        startEmployeeTour(onDone);
      }
    }, 800);
    return () => clearTimeout(t);
  }, [role, roleLoading, prefs.tour_completed, prefsLoading, location.pathname, completeTour]);

  return null;
};
