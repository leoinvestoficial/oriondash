import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Sparkles } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string;
  change: number;
  insight: string;
  accent?: "teal" | "amber" | "coral";
}

export const MetricCard = ({ label, value, change, insight, accent }: MetricCardProps) => {
  const isPositive = change > 0;
  const isGoodChange = label === "CAC médio" ? !isPositive : isPositive;

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-3">
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      <div className="flex items-end justify-between">
        <p className={cn(
          "text-2xl font-medium",
          accent === "teal" && "text-orion-teal",
          accent === "amber" && "text-orion-amber",
          accent === "coral" && "text-orion-coral",
          !accent && "text-foreground"
        )}>
          {value}
        </p>
        <div className={cn(
          "flex items-center gap-1 text-xs px-2 py-1 rounded-md",
          isGoodChange ? "bg-orion-success/10 text-orion-success" : "bg-destructive/10 text-destructive"
        )}>
          {isGoodChange ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(change)}%
        </div>
      </div>
      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-orion-surface-2 rounded-lg p-2.5">
        <Sparkles className="w-3 h-3 text-orion-violet-light mt-0.5 shrink-0" />
        <span>{insight}</span>
      </div>
    </div>
  );
};
