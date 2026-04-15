import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { TrendingUp, DollarSign, Target, BarChart3 } from "lucide-react";

interface BusinessContextStepProps {
  data: Record<string, string>;
  onUpdate: (key: string, value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const STAGES = [
  { value: "pre_launch", label: "Pré-lançamento", desc: "Ainda não lancei, foco em validação e awareness" },
  { value: "launch", label: "Lançamento", desc: "Lançando agora, foco em aquisição inicial" },
  { value: "growth", label: "Crescimento", desc: "Produto validado, foco em escalar" },
  { value: "scale", label: "Escala", desc: "Operação madura, otimizando eficiência" },
  { value: "consolidation", label: "Consolidação", desc: "Líder de mercado, defendendo posição" },
];

const STRATEGIES = [
  { value: "organic", label: "Orgânico", desc: "Conteúdo, SEO, comunidade" },
  { value: "paid", label: "Mídia paga", desc: "Meta Ads, Google Ads, etc." },
  { value: "mixed", label: "Misto", desc: "Orgânico + pago combinados" },
  { value: "partnerships", label: "Parcerias", desc: "Influencers, co-marketing, afiliados" },
];

export const BusinessContextStep = ({ data, onUpdate, onNext, onBack }: BusinessContextStepProps) => {
  const filledCount = [
    data.revenue_monthly, data.budget_monthly, data.business_stage,
    data.focus_strategy, data.avg_ticket, data.cac_target,
  ].filter(Boolean).length;

  return (
    <div className="max-w-2xl w-full mx-auto animate-fade-in">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="w-10 h-10 rounded-xl orion-gradient flex items-center justify-center text-primary-foreground">
            <TrendingUp className="w-5 h-5" />
          </span>
          <div>
            <p className="text-xs text-muted-foreground font-mono">CONTEXTO DE NEGÓCIO</p>
            <h2 className="text-display text-foreground">Números & Estratégia</h2>
          </div>
        </div>
        <p className="text-muted-foreground">
          Esses dados fazem o Orion adaptar 100% das recomendações à sua realidade financeira e estágio.
        </p>
        <div className="mt-4 h-1 bg-muted rounded-full overflow-hidden">
          <div className="h-full orion-gradient transition-all duration-500" style={{ width: `${(filledCount / 6) * 100}%` }} />
        </div>
        <p className="text-xs text-muted-foreground mt-1">{filledCount} de 6 campos preenchidos</p>
      </div>

      <div className="space-y-6">
        {/* Revenue & Budget */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-foreground mb-2 font-medium">
              <DollarSign className="w-3.5 h-3.5 inline mr-1" />Faturamento mensal (R$)
            </label>
            <Input value={data.revenue_monthly || ""} onChange={(e) => onUpdate("revenue_monthly", e.target.value)}
              placeholder="Ex: 200000" type="number" className="bg-orion-surface-2 border-border" />
          </div>
          <div>
            <label className="block text-sm text-foreground mb-2 font-medium">
              <DollarSign className="w-3.5 h-3.5 inline mr-1" />Budget mensal de marketing (R$)
            </label>
            <Input value={data.budget_monthly || ""} onChange={(e) => onUpdate("budget_monthly", e.target.value)}
              placeholder="Ex: 20000" type="number" className="bg-orion-surface-2 border-border" />
          </div>
        </div>

        {/* Budget ratio insight */}
        {data.revenue_monthly && data.budget_monthly && (
          <div className="bg-primary/5 border border-primary/10 rounded-xl p-3 flex items-center gap-3">
            <BarChart3 className="w-4 h-4 text-orion-violet-light shrink-0" />
            <p className="text-xs text-foreground">
              Ratio budget/faturamento: <strong className="text-primary">
                {((Number(data.budget_monthly) / Number(data.revenue_monthly)) * 100).toFixed(1)}%
              </strong>
              {Number(data.budget_monthly) / Number(data.revenue_monthly) < 0.05 && " — Conservador. Orion vai priorizar eficiência e ROI."}
              {Number(data.budget_monthly) / Number(data.revenue_monthly) >= 0.05 && Number(data.budget_monthly) / Number(data.revenue_monthly) < 0.15 && " — Saudável. Orion vai balancear crescimento e eficiência."}
              {Number(data.budget_monthly) / Number(data.revenue_monthly) >= 0.15 && " — Agressivo. Orion vai focar em escala e aquisição."}
            </p>
          </div>
        )}

        {/* Business Stage */}
        <div>
          <label className="block text-sm text-foreground mb-3 font-medium">Estágio do negócio</label>
          <div className="grid grid-cols-1 gap-2">
            {STAGES.map((stage) => (
              <button key={stage.value} onClick={() => onUpdate("business_stage", stage.value)}
                className={cn(
                  "text-left p-3 rounded-xl border transition-all",
                  data.business_stage === stage.value
                    ? "border-primary bg-primary/5"
                    : "border-border bg-orion-surface-2 hover:border-muted-foreground/30"
                )}>
                <p className="text-sm text-foreground font-medium">{stage.label}</p>
                <p className="text-xs text-muted-foreground">{stage.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Focus Strategy */}
        <div>
          <label className="block text-sm text-foreground mb-3 font-medium">Foco estratégico principal</label>
          <div className="grid grid-cols-2 gap-2">
            {STRATEGIES.map((strat) => (
              <button key={strat.value} onClick={() => onUpdate("focus_strategy", strat.value)}
                className={cn(
                  "text-left p-3 rounded-xl border transition-all",
                  data.focus_strategy === strat.value
                    ? "border-primary bg-primary/5"
                    : "border-border bg-orion-surface-2 hover:border-muted-foreground/30"
                )}>
                <p className="text-sm text-foreground font-medium">{strat.label}</p>
                <p className="text-xs text-muted-foreground">{strat.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Additional metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-foreground mb-2 font-medium">
              <Target className="w-3.5 h-3.5 inline mr-1" />Ticket médio (R$)
            </label>
            <Input value={data.avg_ticket || ""} onChange={(e) => onUpdate("avg_ticket", e.target.value)}
              placeholder="Ex: 150" type="number" className="bg-orion-surface-2 border-border" />
          </div>
          <div>
            <label className="block text-sm text-foreground mb-2 font-medium">
              <Target className="w-3.5 h-3.5 inline mr-1" />CAC alvo (R$)
            </label>
            <Input value={data.cac_target || ""} onChange={(e) => onUpdate("cac_target", e.target.value)}
              placeholder="Ex: 50" type="number" className="bg-orion-surface-2 border-border" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-foreground mb-2 font-medium">LTV estimado (R$)</label>
            <Input value={data.ltv || ""} onChange={(e) => onUpdate("ltv", e.target.value)}
              placeholder="Ex: 1200" type="number" className="bg-orion-surface-2 border-border" />
          </div>
          <div>
            <label className="block text-sm text-foreground mb-2 font-medium">Tamanho da equipe</label>
            <Input value={data.team_size || ""} onChange={(e) => onUpdate("team_size", e.target.value)}
              placeholder="Ex: 5" type="number" className="bg-orion-surface-2 border-border" />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-10 pt-6 border-t border-border">
        <Button variant="ghost" onClick={onBack} className="text-muted-foreground">← Voltar</Button>
        <Button onClick={onNext} className="orion-gradient text-primary-foreground px-6 orion-glow hover:opacity-90 transition-opacity">
          Próximo bloco →
        </Button>
      </div>
    </div>
  );
};
