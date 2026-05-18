import { AlertTriangle, ArrowRight, DollarSign, Users } from "lucide-react";
import type { ReactNode } from "react";

import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

interface FunnelAlert {
  id?: string;
  message?: string;
  severity?: string;
}

interface FunnelNodeMetrics {
  people_7d?: number | null;
  exit_ticket_avg?: number | null;
}

interface NextStep {
  id?: string;
  label?: string | null;
  target_node_id?: string;
}

interface NodeTooltipProps {
  children: ReactNode;
  metrics?: FunnelNodeMetrics | null;
  nextSteps?: NextStep[];
  alerts?: FunnelAlert[];
}

const money = (value?: number | null) =>
  typeof value === "number" ? `R$ ${value.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}` : "--";

export function NodeTooltip({ children, metrics, nextSteps = [], alerts = [] }: NodeTooltipProps) {
  const primaryNext = nextSteps[0];
  const primaryAlert = alerts[0];

  return (
    <HoverCard openDelay={180} closeDelay={80}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent align="start" className="w-80">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-border bg-background/50 p-3">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Users className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase tracking-wider">7 dias</span>
              </div>
              <p className="text-lg font-semibold text-foreground">{metrics?.people_7d ?? 0}</p>
              <p className="text-xs text-muted-foreground">pessoas passaram</p>
            </div>
            <div className="rounded-lg border border-border bg-background/50 p-3">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <DollarSign className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase tracking-wider">Saida</span>
              </div>
              <p className="text-lg font-semibold text-foreground">{money(metrics?.exit_ticket_avg)}</p>
              <p className="text-xs text-muted-foreground">ticket medio</p>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-background/50 p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <ArrowRight className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase tracking-wider">Proximo passo</span>
            </div>
            <p className="text-sm text-foreground">
              {primaryNext?.label || primaryNext?.target_node_id || "Nenhum proximo passo conectado"}
            </p>
          </div>

          {primaryAlert && (
            <div className="rounded-lg border border-orion-warning/30 bg-orion-warning/10 p-3">
              <div className="flex items-center gap-2 text-orion-warning mb-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase tracking-wider">Alerta Analyst</span>
              </div>
              <p className="text-sm text-foreground">{primaryAlert.message || primaryAlert.severity || "Alerta ativo neste no"}</p>
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

export default NodeTooltip;
