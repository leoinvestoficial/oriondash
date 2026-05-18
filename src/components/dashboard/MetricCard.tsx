import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, LucideIcon } from "lucide-react";
import { StatusBadge, type StatusBadgeVariant } from "@/components/shared/StatusBadge";

export interface MetricCardProps {
  /** KPI name */
  label: string;
  /** Formatted value string */
  value: string;
  /** % change vs previous period — positive = up, negative = down */
  change?: number;
  /** Lower value is better (e.g. CPA, CAC) — inverts color logic */
  lowerIsBetter?: boolean;
  /** Contextual note below value */
  note?: string;
  /** Target / goal line */
  target?: string;
  /** Status badge variant */
  status?: StatusBadgeVariant;
  /** Status label override */
  statusLabel?: string;
  /** Accent color on the value */
  accent?: "teal" | "amber" | "coral" | "primary" | "success" | "warning";
  /** Optional icon */
  icon?: LucideIcon;
  /** Data source badge */
  source?: "real" | "mock" | "estimated";
  /** Empty/no data state */
  empty?: boolean;
  /** Empty label (defaults to "Conectar dados") */
  emptyLabel?: string;
  /** Empty href */
  emptyHref?: string;
  className?: string;
}

const accentClass: Record<NonNullable<MetricCardProps["accent"]>, string> = {
  teal:    "text-orion-teal",
  amber:   "text-orion-amber",
  coral:   "text-orion-coral",
  primary: "text-primary",
  success: "text-orion-success",
  warning: "text-orion-warning",
};

export const MetricCard = ({
  label,
  value,
  change,
  lowerIsBetter = false,
  note,
  target,
  status,
  statusLabel,
  accent,
  icon: Icon,
  source,
  empty = false,
  emptyLabel = "Conectar",
  emptyHref,
  className,
}: MetricCardProps) => {
  const isUp = change !== undefined && change > 0;
  const isGood = lowerIsBetter ? !isUp : isUp;
  const isFlat = change === 0;

  return (
    <div
      className={cn(
        "bg-card border border-border rounded-xl p-4 flex flex-col gap-2.5 transition-colors",
        empty && "opacity-70",
        className
      )}
    >
      {/* Top row: label + source */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />}
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground truncate">
            {label}
          </p>
        </div>
        {source && (
          <StatusBadge
            variant={source === "real" ? "real" : source === "mock" ? "mock" : "neutral"}
            label={source === "estimated" ? "est." : undefined}
            compact
          />
        )}
      </div>

      {/* Value row */}
      {empty ? (
        <div className="flex-1 flex flex-col justify-center gap-1.5">
          <p className="text-sm text-muted-foreground/50">—</p>
          {emptyHref ? (
            <a
              href={emptyHref}
              className="text-[10px] text-primary/70 hover:text-primary transition-colors underline-offset-2 hover:underline"
            >
              {emptyLabel}
            </a>
          ) : (
            <p className="text-[10px] text-muted-foreground/40">{emptyLabel}</p>
          )}
        </div>
      ) : (
        <div className="flex items-end justify-between gap-2">
          <p
            className={cn(
              "text-2xl font-semibold leading-none",
              accent ? accentClass[accent] : "text-foreground"
            )}
          >
            {value}
          </p>

          {/* Change indicator */}
          {change !== undefined && (
            <div
              className={cn(
                "flex items-center gap-0.5 text-[11px] font-medium px-1.5 py-0.5 rounded-md shrink-0",
                isFlat
                  ? "bg-muted/30 text-muted-foreground"
                  : isGood
                  ? "bg-orion-success/10 text-orion-success"
                  : "bg-destructive/10 text-destructive"
              )}
            >
              {isFlat ? (
                <Minus className="w-3 h-3" />
              ) : isGood ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {Math.abs(change)}%
            </div>
          )}
        </div>
      )}

      {/* Target / note row */}
      {(target || note || status) && !empty && (
        <div className="flex items-center justify-between gap-2">
          {(target || note) && (
            <p className="text-[10px] text-muted-foreground truncate">
              {target ? `meta: ${target}` : note}
            </p>
          )}
          {status && (
            <StatusBadge variant={status} label={statusLabel} compact className="shrink-0" />
          )}
        </div>
      )}
    </div>
  );
};
