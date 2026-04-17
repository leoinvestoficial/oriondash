import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Target } from "lucide-react";

interface PositioningStepProps {
  data: Record<string, string>;
  onUpdate: (key: string, value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const TIERS = [
  { value: "premium", label: "Premium", desc: "Preço alto, alta percepção de valor" },
  { value: "popular", label: "Popular", desc: "Acessível para o público amplo" },
  { value: "niche", label: "Nichado", desc: "Específico, profundo em um nicho" },
  { value: "disruptor", label: "Disruptor", desc: "Quebrando regras da categoria" },
];

const GOALS = [
  { value: "growth", label: "Crescimento", desc: "Volume acima de tudo" },
  { value: "profit", label: "Lucro", desc: "Margem e eficiência" },
  { value: "validation", label: "Validação", desc: "Provar product-market fit" },
  { value: "scale", label: "Escala", desc: "Operação madura escalando" },
];

export const PositioningStep = ({ data, onUpdate, onNext, onBack }: PositioningStepProps) => {
  return (
    <div className="max-w-2xl w-full mx-auto animate-fade-in">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="w-10 h-10 rounded-xl orion-gradient flex items-center justify-center text-primary-foreground">
            <Target className="w-5 h-5" />
          </span>
          <div>
            <p className="text-xs text-muted-foreground font-mono">POSICIONAMENTO & OBJETIVO</p>
            <h2 className="text-display text-foreground">Onde você joga e o que quer agora</h2>
          </div>
        </div>
        <p className="text-muted-foreground">
          O Orion adapta toda recomendação de acordo com tier de mercado e objetivo principal.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm text-foreground mb-3 font-medium">Tier de mercado</label>
          <div className="grid grid-cols-2 gap-2">
            {TIERS.map((t) => {
              const active = data.market_tier === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => onUpdate("market_tier", t.value)}
                  className={`text-left p-3 rounded-lg border transition-all ${
                    active ? "bg-primary/10 border-primary" : "bg-orion-surface-2 border-border hover:border-primary/40"
                  }`}
                >
                  <p className="text-sm font-medium text-foreground">{t.label}</p>
                  <p className="text-xs text-muted-foreground">{t.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

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
                  className={`text-left p-3 rounded-lg border transition-all ${
                    active ? "bg-primary/10 border-primary" : "bg-orion-surface-2 border-border hover:border-primary/40"
                  }`}
                >
                  <p className="text-sm font-medium text-foreground">{g.label}</p>
                  <p className="text-xs text-muted-foreground">{g.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm text-foreground mb-2 font-medium">3 concorrentes diretos (URL ou nome)</label>
          <Textarea
            value={data.direct_competitors || ""}
            onChange={(e) => onUpdate("direct_competitors", e.target.value)}
            placeholder="1) competidor1.com&#10;2) competidor2.com&#10;3) competidor3.com"
            rows={3}
            className="bg-orion-surface-2 border-border focus:border-primary resize-none"
          />
        </div>

        <div>
          <label className="block text-sm text-foreground mb-2 font-medium">O que mais te diferencia deles? (1 frase)</label>
          <Input
            value={data.unique_advantage || ""}
            onChange={(e) => onUpdate("unique_advantage", e.target.value)}
            placeholder="Ex: Único do Brasil com integração nativa com X..."
            className="bg-orion-surface-2 border-border focus:border-primary"
          />
        </div>
      </div>

      <div className="flex items-center justify-between mt-10 pt-6 border-t border-border">
        <Button variant="ghost" onClick={onBack} className="text-muted-foreground">← Voltar</Button>
        <Button onClick={onNext} className="orion-gradient text-primary-foreground px-6 orion-glow hover:opacity-90">
          Próximo bloco →
        </Button>
      </div>
    </div>
  );
};
