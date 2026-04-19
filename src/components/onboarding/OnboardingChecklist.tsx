import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useCompanyDNA } from "@/hooks/useCompanyDNA";
import { useUserRole } from "@/hooks/useUserRole";
import { CheckCircle2, Circle, ArrowRight, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ChecklistItem {
  key: string;
  label: string;
  description: string;
  href: string;
  cta: string;
  done: boolean;
}

export const OnboardingChecklist = () => {
  const { user } = useAuth();
  const { dna } = useCompanyDNA();
  const { isOwner, loading: roleLoading } = useUserRole();
  const { prefs, isBannerHidden, hideBanner, showBanner } = useUserPreferences();
  const [collapsed, setCollapsed] = useState(false);
  const [hasIntegration, setHasIntegration] = useState(false);
  const [hasTeam, setHasTeam] = useState(false);
  const [hasDecision, setHasDecision] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [intRes, teamRes, decRes] = await Promise.all([
        supabase.from("ad_integrations").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "connected"),
        supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "employee"),
        supabase.from("ai_decisions").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      ]);
      setHasIntegration((intRes.count || 0) > 0);
      setHasTeam((teamRes.count || 0) > 0);
      setHasDecision((decRes.count || 0) > 0);
    })();
  }, [user, dna]);

  if (roleLoading || !isOwner) return null;

  const items: ChecklistItem[] = [
    {
      key: "dna",
      label: "Completar Company DNA",
      description: "Base do conhecimento da IA sobre sua empresa",
      href: "/onboarding",
      cta: "Continuar",
      done: !!dna?.onboarding_completed,
    },
    {
      key: "integration",
      label: "Conectar Meta ou Google Ads",
      description: "Necessário para sincronizar métricas reais",
      href: "/integrations",
      cta: "Conectar",
      done: hasIntegration,
    },
    {
      key: "team",
      label: "Convidar primeiro funcionário",
      description: "Adicione membros da equipe ao Orion",
      href: "/team",
      cta: "Convidar",
      done: hasTeam,
    },
    {
      key: "decision",
      label: "Gerar primeira decisão IA",
      description: "Veja a IA analisando seus dados em ação",
      href: "/decisoes",
      cta: "Gerar",
      done: hasDecision,
    },
  ];

  const completed = items.filter((i) => i.done).length;
  const total = items.length;
  const allDone = completed === total;
  const dismissId = "checklist-onboarding";

  if (allDone || isBannerHidden(dismissId)) return null;

  return (
    <div className="mb-6 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-orion-violet/5 overflow-hidden">
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center justify-between p-4 hover:bg-primary/5 transition-colors"
      >
        <div className="flex items-center gap-3 text-left">
          <div className="w-10 h-10 rounded-lg orion-gradient flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground">
              Comece com o Orion — {completed}/{total} concluídos
            </h3>
            <p className="text-xs text-muted-foreground">
              Configure os pilares para a IA operar com máxima precisão
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-32 h-1.5 bg-muted/30 rounded-full overflow-hidden">
            <div
              className="h-full orion-gradient transition-all"
              style={{ width: `${(completed / total) * 100}%` }}
            />
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              hideBanner(dismissId);
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </button>

      {!collapsed && (
        <div className="border-t border-border/50 divide-y divide-border/30">
          {items.map((item) => (
            <div key={item.key} className="flex items-center gap-3 p-3 px-4">
              {item.done ? (
                <CheckCircle2 className="w-5 h-5 text-orion-success shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${item.done ? "text-muted-foreground line-through" : "text-foreground"}`}>
                  {item.label}
                </p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
              {!item.done && (
                <Link
                  to={item.href}
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1 shrink-0"
                >
                  {item.cta}
                  <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
