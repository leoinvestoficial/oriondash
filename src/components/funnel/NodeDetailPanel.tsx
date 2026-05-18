import { Activity, BarChart2, Target, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RegenerateNodeButton } from "@/components/funnel/RegenerateNodeButton";
import { ForecastPanel } from "@/components/funnel/ForecastPanel";
import { getNodeTypeConf } from "@/pages/Funnels";
import { cn } from "@/lib/utils";

interface FunnelNode {
  id: string;
  title: string;
  description?: string | null;
  node_type?: string;
  data?: Record<string, unknown>;
  metrics?: {
    revenue?: number;
    spend?: number;
    roas?: number | null;
    conversions?: number;
    people_7d?: number;
    exit_ticket_avg?: number | null;
  };
}

interface NodeDetailPanelProps {
  node: FunnelNode | null;
  playbook?: {
    id?: string;
    success_rate?: number | null;
    sample_size?: number | null;
    action_pattern?: Record<string, unknown> | null;
    situation_pattern?: Record<string, unknown> | null;
  } | null;
  onNodeUpdated?: () => void;
  onApplyForecast?: () => void;
}

const fmt = (n: number) =>
  `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export function NodeDetailPanel({ node, playbook, onNodeUpdated, onApplyForecast }: NodeDetailPanelProps) {
  if (!node) {
    return (
      <aside className="bg-card h-full p-6 flex flex-col items-center justify-center text-center gap-3">
        <BarChart2 className="w-8 h-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Selecione um passo no canvas para ver detalhes e métricas.</p>
      </aside>
    );
  }

  const metrics = node.metrics ?? {};
  const conf = getNodeTypeConf(node.node_type);
  const hasMetrics = (metrics.revenue ?? 0) > 0 || (metrics.spend ?? 0) > 0;

  return (
    <aside className="bg-card h-full overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-start justify-between gap-2">
          <Badge
            variant="outline"
            className={cn("text-xs border", conf.bg, conf.color, conf.border)}
          >
            {conf.label}
          </Badge>
          <RegenerateNodeButton nodeId={node.id} onRegenerated={onNodeUpdated} />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground leading-snug">{node.title}</h2>
          {node.description && (
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{node.description}</p>
          )}
        </div>
      </div>

      {/* Node data / copy fields */}
      {node.data && Object.keys(node.data).some((k) => node.data![k]) && (
        <div className="p-4 border-b border-border space-y-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
            Configuração
          </p>
          <div className="space-y-1.5">
            {Object.entries(node.data)
              .filter(([, v]) => v !== null && v !== undefined && v !== "")
              .map(([key, value]) => (
                <div key={key} className="flex gap-2 text-xs">
                  <span className="text-muted-foreground capitalize min-w-[70px] shrink-0">
                    {key.replace(/_/g, " ")}
                  </span>
                  <span className="text-foreground break-all">{String(value)}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Metrics */}
      <div className="p-4 space-y-3">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
          Métricas
        </p>

        {hasMetrics ? (
          <div className="grid grid-cols-2 gap-2">
            {/* Receita */}
            <div className="rounded-lg border border-border bg-background/50 p-3">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                <Activity className="w-3 h-3" />
                <span className="text-[10px] uppercase tracking-wider">Receita</span>
              </div>
              <p className="text-sm font-bold text-foreground">
                {fmt(Number(metrics.revenue ?? 0))}
              </p>
            </div>

            {/* ROAS */}
            <div className="rounded-lg border border-border bg-background/50 p-3">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                <Target className="w-3 h-3" />
                <span className="text-[10px] uppercase tracking-wider">ROAS</span>
              </div>
              <p className={cn(
                "text-sm font-bold",
                typeof metrics.roas === "number"
                  ? metrics.roas >= 2 ? "text-green-400" : metrics.roas >= 1 ? "text-amber-400" : "text-red-400"
                  : "text-muted-foreground",
              )}>
                {typeof metrics.roas === "number" ? `${metrics.roas.toFixed(2)}x` : "--"}
              </p>
            </div>

            {/* Conversões */}
            {(metrics.conversions ?? 0) > 0 && (
              <div className="rounded-lg border border-border bg-background/50 p-3">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <BarChart2 className="w-3 h-3" />
                  <span className="text-[10px] uppercase tracking-wider">Conversões</span>
                </div>
                <p className="text-sm font-bold text-foreground">{metrics.conversions}</p>
              </div>
            )}

            {/* Pessoas 7d */}
            {(metrics.people_7d ?? 0) > 0 && (
              <div className="rounded-lg border border-border bg-background/50 p-3">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <Users className="w-3 h-3" />
                  <span className="text-[10px] uppercase tracking-wider">Pessoas 7d</span>
                </div>
                <p className="text-sm font-bold text-foreground">{metrics.people_7d?.toLocaleString("pt-BR")}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-background/30 p-4 text-center">
            <BarChart2 className="w-5 h-5 text-muted-foreground/40 mx-auto mb-1.5" />
            <p className="text-xs text-muted-foreground">
              Métricas disponíveis após integração com campanhas ativas.
            </p>
          </div>
        )}
      </div>

      <Separator />

      {/* Forecast panel */}
      <div className="p-4">
        <ForecastPanel
          currentRevenue={Number(metrics.revenue ?? 0)}
          currentSpend={Number(metrics.spend ?? 0)}
          currentRoas={metrics.roas}
          playbook={playbook}
          onApplySuggestion={onApplyForecast}
        />
      </div>
    </aside>
  );
}

export default NodeDetailPanel;
