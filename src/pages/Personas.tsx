import { useCallback, useEffect, useState } from "react";
import { UserCircle, Wand2, Loader2, RefreshCw, HeartHandshake, Megaphone, Target } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHelpBanner } from "@/components/help/PageHelpBanner";
import { PAGE_HELP } from "@/lib/pageHelp";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyDNA } from "@/hooks/useCompanyDNA";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Persona {
  name: string;
  age_range: string;
  occupation: string;
  location: string;
  income_range: string;
  pains: string[];
  motivations: string[];
  preferred_channels: string[];
  purchase_triggers: string[];
  resonating_message: string;
  avatar_emoji: string;
}

// ─── Persona Card ──────────────────────────────────────────────────────────────

const GRADIENTS = [
  "from-purple-500 to-blue-500",
  "from-emerald-500 to-teal-500",
  "from-orange-500 to-rose-500",
];

function PersonaCard({ persona, index }: { persona: Persona; index: number }) {
  const gradient = GRADIENTS[index % GRADIENTS.length];
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-white/5 bg-card overflow-hidden">
      {/* Header */}
      <div className={cn("bg-gradient-to-br p-6 text-white", gradient)}>
        <div className="flex items-start gap-4">
          <span className="text-4xl" role="img" aria-label={persona.name}>
            {persona.avatar_emoji || "👤"}
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg">{persona.name}</h3>
            <p className="text-sm text-white/80">{persona.occupation}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge className="bg-white/20 text-white border-0 text-xs">{persona.age_range}</Badge>
              <Badge className="bg-white/20 text-white border-0 text-xs">{persona.location}</Badge>
              <Badge className="bg-white/20 text-white border-0 text-xs">{persona.income_range}</Badge>
            </div>
          </div>
        </div>
        <div className="mt-4 rounded-lg bg-black/20 p-3 text-sm text-white/90 italic">
          "{persona.resonating_message}"
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4">
        {/* Channels */}
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Megaphone className="w-3.5 h-3.5" /> Canais preferidos
          </p>
          <div className="flex flex-wrap gap-1.5">
            {persona.preferred_channels.map((ch) => (
              <Badge key={ch} variant="secondary" className="text-xs">
                {ch}
              </Badge>
            ))}
          </div>
        </div>

        {/* Pains */}
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <HeartHandshake className="w-3.5 h-3.5" /> Principais dores
          </p>
          <ul className="space-y-1">
            {persona.pains.slice(0, expanded ? undefined : 2).map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="text-red-400 mt-0.5">•</span>
                <span className="text-muted-foreground">{p}</span>
              </li>
            ))}
          </ul>
        </div>

        {expanded && (
          <>
            {/* Motivations */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" /> Motivações
              </p>
              <ul className="space-y-1">
                {persona.motivations.map((m, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-emerald-400 mt-0.5">•</span>
                    <span className="text-muted-foreground">{m}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Purchase triggers */}
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                Gatilhos de compra
              </p>
              <ul className="space-y-1">
                {persona.purchase_triggers.map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-blue-400 mt-0.5">→</span>
                    <span className="text-muted-foreground">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs text-muted-foreground"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Ver menos" : "Ver mais detalhes"}
        </Button>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PersonaSkeleton() {
  return (
    <div className="rounded-xl border border-white/5 bg-card overflow-hidden animate-pulse">
      <div className="h-40 bg-muted/20" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-muted/20 rounded w-2/3" />
        <div className="h-3 bg-muted/20 rounded w-1/2" />
        <div className="h-3 bg-muted/20 rounded w-3/4" />
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function Personas() {
  const { user } = useAuth();
  const { dna, loading: dnaLoading } = useCompanyDNA();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [generating, setGenerating] = useState(false);

  // Load saved personas from dna_data.generatedPersonas
  useEffect(() => {
    if (!dna) return;
    const saved = (dna.dna_data as Record<string, unknown>)?.generatedPersonas;
    if (Array.isArray(saved) && saved.length > 0) {
      setPersonas(saved as Persona[]);
    }
  }, [dna]);

  const handleGenerate = useCallback(async () => {
    if (!user) return;
    setGenerating(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;

      const resp = await fetch(`${supabaseUrl}/functions/v1/generate-personas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      const data = await resp.json();

      if (!resp.ok || data.error) {
        throw new Error(data.error || "Erro ao gerar personas");
      }

      if (Array.isArray(data.personas) && data.personas.length > 0) {
        setPersonas(data.personas as Persona[]);
        toast.success(`${data.personas.length} personas geradas com sucesso!`);
      } else {
        toast.warning("Nenhuma persona retornada. Verifique o Company DNA.");
      }
    } catch (err) {
      console.error("generate-personas error:", err);
      toast.error(String(err));
    } finally {
      setGenerating(false);
    }
  }, [user]);

  const loading = dnaLoading;

  return (
    <AppLayout>
      <div className="space-y-6 p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <UserCircle className="w-6 h-6 text-primary" />
              Personas
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Perfis de cliente ideal gerados por IA com base no DNA da sua marca
            </p>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={generating || loading}
            className="gap-2"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : personas.length > 0 ? (
              <RefreshCw className="w-4 h-4" />
            ) : (
              <Wand2 className="w-4 h-4" />
            )}
            {personas.length > 0 ? "Regenerar personas" : "Gerar personas com IA"}
          </Button>
        </div>

        {PAGE_HELP.personas && (
          <PageHelpBanner content={PAGE_HELP.personas} />
        )}

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <PersonaSkeleton />
            <PersonaSkeleton />
            <PersonaSkeleton />
          </div>
        ) : personas.length === 0 ? (
          <EmptyState
            icon={UserCircle}
            title="Nenhuma persona criada ainda"
            description={
              !dna?.onboarding_completed
                ? "Complete o onboarding (Company DNA) primeiro para que a IA possa criar personas precisas."
                : "Clique em 'Gerar personas com IA' para criar perfis de cliente ideal baseados no DNA da sua marca."
            }
            actionLabel={dna?.onboarding_completed ? "Gerar personas com IA" : "Completar Company DNA"}
            onAction={dna?.onboarding_completed ? handleGenerate : () => window.location.href = "/onboarding"}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {personas.map((p, i) => (
              <PersonaCard key={i} persona={p} index={i} />
            ))}
          </div>
        )}

        {/* Info footer */}
        {personas.length > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            Personas geradas com base no DNA da empresa · Regenere após atualizar o Company DNA
          </p>
        )}
      </div>
    </AppLayout>
  );
}
