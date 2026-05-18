import { Link } from "react-router-dom";
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
  /** Empty label (defaults to "Conectar") */
  emptyLabel?: string;
  /** Empty href */
  emptyHref?: string;
  /**
   * Compact variant — reduced padding & font sizes.
   * Ideal for secondary metrics (Row 2 of a grid).
   */
  compact?: boolean;
  /**
   * When set, the entire card is rendered as a navigation link.
   * Uses react-router Link so SPA routing is preserved.
   */
  href?: string;
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
  compact = false,
  href,
  className,
}: MetricCardProps) => {
  const isUp = change !== undefined && change > 0;
  const isGood = lowerIsBetter ? !isUp : isUp;
  const isFlat = change === 0;

  const inner = (
    <div
      className={cn(
        "bg-card border border-border rounded-xl flex flex-col gap-2 transition-colors",
        compact ? "p-3" : "p-4",
        compact ? "gap-1.5" : "gap-2.5",
        empty && "opacity-70",
        href && "cursor-pointer hover:border-primary/40 hover:bg-primary/5",
        className
      )}
    >
      {/* Top row: label + source */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {Icon && (
            <Icon
              className={cn(
                "shrink-0 text-muted-foreground/60",
                compact ? "w-3 h-3" : "w-3.5 h-3.5"
              )}
            />
          )}
          <p
            className={cn(
              "font-mono uppercase tracking-wider text-muted-foreground truncate",
              compact ? "text-[9px]" : "text-[10px]"
            )}
          >
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
        <div className="flex-1 flex flex-col justify-center gap-1">
          <p className={cn("text-muted-foreground/50", compact ? "text-xs" : "text-sm")}>—</p>
          {emptyHref ? (
            <a
              href={emptyHref}
              onClick={(e) => e.stopPropagation()}
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
              "font-semibold leading-none",
              compact ? "text-xl" : "text-2xl",
              accent ? accentClass[accent] : "text-foreground"
            )}
          >
            {value}
          </p>

          {/* Change indicator */}
          {change !== undefined && (
            <div
              className={cn(
                "flex items-center gap-0.5 font-medium rounded-md shrink-0",
                compact ? "text-[10px] px-1 py-0.5" : "text-[11px] px-1.5 py-0.5",
                isFlat
                  ? "bg-muted/30 text-muted-foreground"
                  : isGood
                  ? "bg-orion-success/10 text-orion-success"
                  : "bg-destructive/10 text-destructive"
              )}
            >
              {isFlat ? (
                <Minus className={cn(compact ? "w-2.5 h-2.5" : "w-3 h-3")} />
              ) : isGood ? (
                <TrendingUp className={cn(compact ? "w-2.5 h-2.5" : "w-3 h-3")} />
              ) : (
                <TrendingDown className={cn(compact ? "w-2.5 h-2.5" : "w-3 h-3")} />
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
            <p
              className={cn(
                "text-muted-foreground truncate",
                compact ? "text-[9px]" : "text-[10px]"
              )}
            >
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

  if (href) {
    return (
      <Link to={href} aria-label={label} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
};
