import { ArrowRight, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PlaybookSuggestion {
  id?: string;
  success_rate?: number | null;
  sample_size?: number | null;
  action_pattern?: Record<string, unknown> | null;
  situation_pattern?: Record<string, unknown> | null;
}

interface ForecastPanelProps {
  currentRevenue: number;
  currentRoas?: number | null;
  currentSpend?: number | null;
  playbook?: PlaybookSuggestion | null;
  onApplySuggestion?: () => void;
}

const money = (value: number) => `R$ ${value.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;

export function ForecastPanel({
  currentRevenue,
  currentRoas,
  currentSpend = 0,
  playbook,
  onApplySuggestion,
}: ForecastPanelProps) {
  const successRate = Number(playbook?.success_rate ?? 0);
  const sampleSize = Number(playbook?.sample_size ?? 0);
  const conservativeLift = successRate > 0 ? Math.min(successRate * 0.35, 0.3) : 0.08;
  const forecastRevenue = currentRevenue + Math.max(currentRevenue * conservativeLift, currentSpend * conservativeLift * (currentRoas || 1));
  const delta = forecastRevenue - currentRevenue;
  const actionType = String(playbook?.action_pattern?.action_type || "sugestao do playbook");

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-orion-success" />
            <h3 className="text-sm font-semibold text-foreground">Forecast do playbook</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Estimativa conservadora se aplicar o padrao analogo mais parecido.
          </p>
        </div>
        <Badge variant="outline" className="border-orion-success/30 text-orion-success">
          +{Math.round(conservativeLift * 100)}%
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-background/50 border border-border p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Atual</p>
          <p className="text-sm font-semibold text-foreground">{money(currentRevenue)}</p>
        </div>
        <div className="rounded-lg bg-background/50 border border-border p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Estimado</p>
          <p className="text-sm font-semibold text-foreground">{money(forecastRevenue)}</p>
        </div>
        <div className="rounded-lg bg-orion-success/10 border border-orion-success/20 p-3">
          <p className="text-[10px] uppercase tracking-wider text-orion-success mb-1">Delta</p>
          <p className="text-sm font-semibold text-foreground">+{money(delta)}</p>
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        Playbook: <span className="text-foreground">{actionType}</span>
        {sampleSize > 0 && <> com {sampleSize} amostra(s)</>}
        {successRate > 0 && <> e {(successRate * 100).toFixed(0)}% de sucesso</>}.
      </div>

      {onApplySuggestion && (
        <Button size="sm" className="gap-2" onClick={onApplySuggestion}>
          Aplicar sugestao <ArrowRight className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}

export default ForecastPanel;
