import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  data: Record<string, string>;
  onUpdate: (key: string, value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const TIERS = [
  { value: "premium", label: "Premium", desc: "Preço alto, alto valor percebido" },
  { value: "popular", label: "Popular", desc: "Acessível pro público amplo" },
  { value: "niche", label: "Nichado", desc: "Específico, profundo num nicho" },
  { value: "disruptor", label: "Disruptor", desc: "Quebrando regras da categoria" },
];

export const MarketPositioningStep = ({ data, onUpdate, onNext, onBack }: Props) => {
  return (
    <div className="max-w-2xl w-full mx-auto animate-fade-in">
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="w-10 h-10 rounded-xl orion-gradient flex items-center justify-center text-primary-foreground shrink-0">
            <Target className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-mono">MERCADO & POSICIONAMENTO</p>
            <h2 className="text-display text-foreground">Onde você joga</h2>
          </div>
        </div>
        <p className="text-muted-foreground text-sm sm:text-base">
          Categoria, concorrentes, tier e o que te diferencia — em 4 campos.
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm text-foreground mb-2 font-medium">Categoria do negócio</label>
          <Input
            value={data.category || ""}
            onChange={(e) => onUpdate("category", e.target.value)}
            placeholder="Ex: SaaS de RH, e-commerce de moda, infoproduto..."
            className="bg-orion-surface-2 border-border focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm text-foreground mb-3 font-medium">Tier de mercado</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {TIERS.map((t) => {
              const active = data.market_tier === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => onUpdate("market_tier", t.value)}
                  className={cn(
                    "text-left p-3 rounded-lg border transition-all",
                    active
                      ? "bg-primary/10 border-primary"
                      : "bg-orion-surface-2 border-border hover:border-primary/40"
                  )}
                >
                  <p className="text-sm font-medium text-foreground">{t.label}</p>
                  <p className="text-xs text-muted-foreground">{t.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm text-foreground mb-2 font-medium">3 concorrentes diretos (URL ou nome)</label>
          <Textarea
            rows={3}
            value={data.direct_competitors || ""}
            onChange={(e) => onUpdate("direct_competitors", e.target.value)}
            placeholder="1) competidor1.com&#10;2) competidor2.com&#10;3) competidor3.com"
            className="bg-orion-surface-2 border-border focus:border-primary resize-none"
          />
        </div>

        <div>
          <label className="block text-sm text-foreground mb-2 font-medium">O que mais te diferencia (1 frase)</label>
          <Input
            value={data.unique_advantage || ""}
            onChange={(e) => onUpdate("unique_advantage", e.target.value)}
            placeholder="Ex: Único do Brasil com integração nativa com X..."
            className="bg-orion-surface-2 border-border focus:border-primary"
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
