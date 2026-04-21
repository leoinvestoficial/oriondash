import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Compass } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  data: Record<string, string>;
  onUpdate: (key: string, value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const GOALS = [
  { value: "growth", label: "Crescimento", desc: "Volume acima de tudo" },
  { value: "profit", label: "Lucro", desc: "Margem e eficiência" },
  { value: "validation", label: "Validação", desc: "Provar product-market fit" },
  { value: "scale", label: "Escala", desc: "Operação madura escalando" },
];

export const GoalsConstraintsStep = ({ data, onUpdate, onNext, onBack }: Props) => {
  return (
    <div className="max-w-2xl w-full mx-auto animate-fade-in">
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="w-10 h-10 rounded-xl orion-gradient flex items-center justify-center text-primary-foreground shrink-0">
            <Compass className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-mono">OBJETIVOS & RESTRIÇÕES</p>
            <h2 className="text-display text-foreground">Onde quer chegar e o que evitar</h2>
          </div>
        </div>
        <p className="text-muted-foreground text-sm sm:text-base">
          Objetivo principal, canais e regras claras pro Orion não fazer besteira.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm text-foreground mb-3 font-medium">Objetivo principal agora</label>
          <div className="grid grid-cols-2 gap-2">
            {GOALS.map((g) => {
              const active = data.primary_goal === g.value;
              return (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => onUpdate("primary_goal", g.value)}
                  className={cn(
                    "text-left p-3 rounded-lg border transition-all",
                    active
                      ? "bg-primary/10 border-primary"
                      : "bg-orion-surface-2 border-border hover:border-primary/40"
                  )}
                >
                  <p className="text-sm font-medium text-foreground">{g.label}</p>
                  <p className="text-xs text-muted-foreground">{g.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm text-foreground mb-2 font-medium">
            Meta concreta (CAC alvo, ROAS mínimo, leads/mês...)
          </label>
          <Textarea
            rows={2}
            value={data.target_metric || ""}
            onChange={(e) => onUpdate("target_metric", e.target.value)}
            placeholder="Ex: CAC ≤ R$80, ROAS ≥ 3, 200 leads qualificados/mês..."
            className="bg-orion-surface-2 border-border focus:border-primary resize-none"
          />
        </div>

        <div>
          <label className="block text-sm text-foreground mb-2 font-medium">Canais (prioritários e proibidos)</label>
          <Textarea
            rows={2}
            value={data.channels || ""}
            onChange={(e) => onUpdate("channels", e.target.value)}
            placeholder="Prioritários: Meta Ads, Google Search. Fora: TikTok (não cabe no público)..."
            className="bg-orion-surface-2 border-border focus:border-primary resize-none"
          />
        </div>

        <div>
          <label className="block text-sm text-foreground mb-2 font-medium">
            Restrições / temas proibidos
          </label>
          <Textarea
            rows={2}
            value={data.forbidden || ""}
            onChange={(e) => onUpdate("forbidden", e.target.value)}
            placeholder="Ex: nada de comparação direta com concorrente, nada de política, sem clickbait..."
            className="bg-orion-surface-2 border-border focus:border-primary resize-none"
          />
        </div>

        <div>
          <label className="block text-sm text-foreground mb-2 font-medium">
            O que já foi tentado e o que aprendeu? (opcional)
          </label>
          <Textarea
            rows={3}
            value={data.history || ""}
            onChange={(e) => onUpdate("history", e.target.value)}
            placeholder="Campanha X funcionou, Y não. Influencer Z deu retorno mas público errado..."
            className="bg-orion-surface-2 border-border focus:border-primary resize-none"
          />
        </div>
      </div>

      <div className="flex items-center justify-between mt-8 pt-6 border-t border-border gap-2">
        <Button variant="ghost" onClick={onBack} className="text-muted-foreground">← Voltar</Button>
        <Button onClick={onNext} className="orion-gradient text-primary-foreground px-4 sm:px-6 orion-glow hover:opacity-90">
          Próximo →
        </Button>
      </div>
    </div>
  );
};
