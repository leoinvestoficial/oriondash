import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BarChart3 } from "lucide-react";

interface FunnelSnapshotStepProps {
  data: Record<string, string>;
  onUpdate: (key: string, value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const BOTTLENECKS = [
  "Pouco tráfego",
  "Tráfego caro",
  "Baixo CTR nos anúncios",
  "Baixa conversão no site",
  "Carrinho abandonado",
  "Pouca recompra",
  "Audiência errada",
  "Oferta fraca",
];

export const FunnelSnapshotStep = ({ data, onUpdate, onNext, onBack }: FunnelSnapshotStepProps) => {
  const selected = (data.perceived_bottlenecks || "").split(",").map((s) => s.trim()).filter(Boolean);

  const toggleBottleneck = (item: string) => {
    const next = selected.includes(item) ? selected.filter((s) => s !== item) : [...selected, item];
    onUpdate("perceived_bottlenecks", next.join(", "));
  };

  return (
    <div className="max-w-2xl w-full mx-auto animate-fade-in">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="w-10 h-10 rounded-xl orion-gradient flex items-center justify-center text-primary-foreground">
            <BarChart3 className="w-5 h-5" />
          </span>
          <div>
            <p className="text-xs text-muted-foreground font-mono">FUNIL ATUAL</p>
            <h2 className="text-display text-foreground">Como o funil está performando hoje</h2>
          </div>
        </div>
        <p className="text-muted-foreground">
          Snapshot do estado atual. Vai virar o baseline contra o qual o Orion mede tudo.
        </p>
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-foreground mb-2 font-medium">Tráfego mensal (visitas)</label>
            <Input
              value={data.monthly_traffic || ""}
              onChange={(e) => onUpdate("monthly_traffic", e.target.value)}
              placeholder="Ex: 25000"
              inputMode="numeric"
              className="bg-orion-surface-2 border-border focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm text-foreground mb-2 font-medium">Conversão média (%)</label>
            <Input
              value={data.conversion_rate_pct || ""}
              onChange={(e) => onUpdate("conversion_rate_pct", e.target.value)}
              placeholder="Ex: 2.4"
              inputMode="decimal"
              className="bg-orion-surface-2 border-border focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm text-foreground mb-2 font-medium">ROAS médio atual</label>
            <Input
              value={data.avg_roas || ""}
              onChange={(e) => onUpdate("avg_roas", e.target.value)}
              placeholder="Ex: 2.8"
              inputMode="decimal"
              className="bg-orion-surface-2 border-border focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm text-foreground mb-2 font-medium">Tamanho do time de marketing</label>
            <Input
              value={data.team_size || ""}
              onChange={(e) => onUpdate("team_size", e.target.value)}
              placeholder="Ex: 3"
              inputMode="numeric"
              className="bg-orion-surface-2 border-border focus:border-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-foreground mb-2 font-medium">Onde você sente que está o gargalo?</label>
          <div className="flex flex-wrap gap-2">
            {BOTTLENECKS.map((b) => {
              const active = selected.includes(b);
              return (
                <button
                  key={b}
                  type="button"
                  onClick={() => toggleBottleneck(b)}
                  className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                    active
                      ? "bg-primary/15 border-primary/40 text-primary"
                      : "bg-orion-surface-2 border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {b}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Selecione todos que se aplicam. O Orion confirma ou refuta com dados depois.
          </p>
        </div>

        <div>
          <label className="block text-sm text-foreground mb-2 font-medium">Ferramentas atuais (CRM, ads, analytics, e-mail)</label>
          <Textarea
            value={data.current_tools || ""}
            onChange={(e) => onUpdate("current_tools", e.target.value)}
            placeholder="Ex: HubSpot, Meta Ads, Google Ads, Google Analytics, Klaviyo..."
            rows={2}
            className="bg-orion-surface-2 border-border focus:border-primary resize-none"
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
