import { ArrowDownRight, ArrowUpRight, CircleDollarSign, Gauge, Target, WalletCards } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface MarketingFinanceData {
  plannedSpend: number;
  actualSpend: number;
  pacingPercentage: number;
  attributedRevenue: number;
  actualCpa: number | null;
  targetCpa: number | null;
  actualRoas: number | null;
  targetRoas: number | null;
  estimatedMargin: number | null;
  breakEvenCpa: number | null;
  estimatedProfit: number | null;
  wastedSpendEstimate: number;
}

const currency = (value: number | null | undefined) =>
  value == null ? "—" : `R$ ${value.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;

const multiplier = (value: number | null | undefined) =>
  value == null ? "—" : `${value.toFixed(2)}x`;

export const MarketingFinanceSummary = ({ finance, onConfigure }: { finance: MarketingFinanceData; onConfigure?: () => void }) => {
  const spendTone = finance.pacingPercentage > 110 ? "text-orion-coral" : finance.pacingPercentage > 90 ? "text-orion-warning" : "text-orion-success";
  const roasGood = finance.actualRoas != null && finance.targetRoas != null && finance.actualRoas >= finance.targetRoas;
  const cpaGood = finance.actualCpa != null && finance.targetCpa != null && finance.actualCpa <= finance.targetCpa;

  return (
    <Card className="border-border bg-card p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-mono text-muted-foreground">RESULTADO FINANCEIRO</p>
          <h2 className="text-lg font-semibold text-foreground">Marketing em dinheiro</h2>
        </div>
        <CircleDollarSign className="h-5 w-5 text-orion-success" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-background/40 p-3">
          <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
            <WalletCards className="h-3.5 w-3.5" /> Verba
          </div>
          <p className="text-xl font-semibold text-foreground">{currency(finance.actualSpend)}</p>
          <p className="text-[11px] text-muted-foreground">planejado {currency(finance.plannedSpend)}</p>
        </div>
        <div className="rounded-lg border border-border bg-background/40 p-3">
          <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
            <Gauge className="h-3.5 w-3.5" /> Ritmo
          </div>
          <p className={cn("text-xl font-semibold", spendTone)}>{finance.pacingPercentage.toFixed(0)}%</p>
          <p className="text-[11px] text-muted-foreground">do gasto previsto</p>
        </div>
        <div className="rounded-lg border border-border bg-background/40 p-3">
          <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
            <Target className="h-3.5 w-3.5" /> CPA
          </div>
          <p className={cn("text-xl font-semibold", cpaGood ? "text-orion-success" : "text-orion-warning")}>{currency(finance.actualCpa)}</p>
          <p className="text-[11px] text-muted-foreground">alvo {currency(finance.targetCpa)}</p>
        </div>
        <div className="rounded-lg border border-border bg-background/40 p-3">
          <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
            {roasGood ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />} ROAS
          </div>
          <p className={cn("text-xl font-semibold", roasGood ? "text-orion-success" : "text-orion-warning")}>{multiplier(finance.actualRoas)}</p>
          <p className="text-[11px] text-muted-foreground">alvo {multiplier(finance.targetRoas)}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-orion-success/5 p-3">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Receita atribuida</p>
          <p className="text-sm font-semibold text-foreground">{currency(finance.attributedRevenue)}</p>
        </div>
        <div className="rounded-lg bg-orion-info/5 p-3">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Lucro estimado</p>
          <p className="text-sm font-semibold text-foreground">{currency(finance.estimatedProfit)}</p>
        </div>
        <div className="rounded-lg bg-orion-coral/5 p-3">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Desperdicio estimado</p>
          <p className="text-sm font-semibold text-orion-coral">{currency(finance.wastedSpendEstimate)}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background/40 p-3">
        <p className="text-xs text-muted-foreground">
          {finance.estimatedMargin == null
            ? "Informe margem para o Orion recomendar escala com mais seguranca."
            : `Margem estimada: ${finance.estimatedMargin.toFixed(0)}%. Break-even CPA: ${currency(finance.breakEvenCpa)}.`}
        </p>
        <Button size="sm" variant="outline" onClick={onConfigure}>Adicionar metas financeiras</Button>
      </div>
    </Card>
  );
};
