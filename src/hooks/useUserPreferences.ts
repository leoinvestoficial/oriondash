import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ChecklistState {
  [key: string]: boolean;
}

interface UserPreferences {
  hidden_banners: string[];
  tour_completed: boolean;
  onboarding_checklist: ChecklistState;
}

const DEFAULT: UserPreferences = {
  hidden_banners: [],
  tour_completed: false,
  onboarding_checklist: {},
};

export const useUserPreferences = () => {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULT);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_preferences")
      .select("hidden_banners, tour_completed, onboarding_checklist")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data) {
      setPrefs({
        hidden_banners: data.hidden_banners || [],
        tour_completed: data.tour_completed,
        onboarding_checklist: (data.onboarding_checklist as ChecklistState) || {},
      });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    refresh();
  }, [user, refresh]);

  const persist = useCallback(
    async (next: Partial<UserPreferences>) => {
      if (!user) return;
      const merged = { ...prefs, ...next };
      setPrefs(merged);
      await supabase.from("user_preferences").upsert(
        {
          user_id: user.id,
          hidden_banners: merged.hidden_banners,
          tour_completed: merged.tour_completed,
          tour_completed_at: merged.tour_completed ? new Date().toISOString() : null,
          onboarding_checklist: merged.onboarding_checklist,
        },
        { onConflict: "user_id" }
      );
    },
    [user, prefs]
  );

  const hideBanner = (id: string) =>
    persist({ hidden_banners: [...new Set([...prefs.hidden_banners, id])] });

  const showBanner = (id: string) =>
    persist({ hidden_banners: prefs.hidden_banners.filter((b) => b !== id) });

  const isBannerHidden = (id: string) => prefs.hidden_banners.includes(id);

  const setChecklistItem = (key: string, value: boolean) =>
    persist({ onboarding_checklist: { ...prefs.onboarding_checklist, [key]: value } });

  const completeTour = () => persist({ tour_completed: true });

  return {
    prefs,
    loading,
    hideBanner,
    showBanner,
    isBannerHidden,
    setChecklistItem,
    completeTour,
    refresh,
  };
};
