import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { LucideIcon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  /** Lucide icon */
  icon?: LucideIcon;
  /** Short module name (e.g. "Campanhas") */
  title: string;
  /** What the module does or why it matters */
  description: string;
  /** Primary CTA label */
  actionLabel?: string;
  /** Primary CTA handler */
  onAction?: () => void;
  /** Primary CTA href (use instead of onAction for links) */
  actionHref?: string;
  /** How the AI can help (shown in a tip box) */
  aiTip?: string;
  /** Override container class */
  className?: string;
  /** Extra content below actions */
  children?: ReactNode;
  /** Compact version for use inside cards */
  compact?: boolean;
}

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  aiTip,
  className,
  children,
  compact = false,
}: EmptyStateProps) => (
  <div
    className={cn(
      "flex flex-col items-center text-center",
      compact ? "py-8 px-4 gap-3" : "py-16 px-6 gap-4",
      className
    )}
  >
    {Icon && (
      <div
        className={cn(
          "rounded-2xl bg-primary/10 flex items-center justify-center text-primary",
          compact ? "w-10 h-10" : "w-14 h-14"
        )}
      >
        <Icon className={cn(compact ? "w-5 h-5" : "w-7 h-7")} />
      </div>
    )}

    <div className="space-y-1.5 max-w-sm">
      <h3 className={cn("font-semibold text-foreground", compact ? "text-sm" : "text-base")}>
        {title}
      </h3>
      <p className={cn("text-muted-foreground leading-relaxed", compact ? "text-xs" : "text-sm")}>
        {description}
      </p>
    </div>

    {(actionLabel || children) && (
      <div className="flex flex-wrap items-center justify-center gap-2">
        {actionLabel && (
          actionHref ? (
            <a href={actionHref}>
              <Button size={compact ? "sm" : "default"}>{actionLabel}</Button>
            </a>
          ) : (
            <Button size={compact ? "sm" : "default"} onClick={onAction}>
              {actionLabel}
            </Button>
          )
        )}
        {children}
      </div>
    )}

    {aiTip && (
      <div className="flex items-start gap-2 bg-primary/5 border border-primary/15 rounded-xl px-4 py-3 max-w-sm text-left">
        <Sparkles className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">{aiTip}</p>
      </div>
    )}
  </div>
);
