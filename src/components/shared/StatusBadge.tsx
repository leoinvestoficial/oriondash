import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

export type StatusBadgeVariant =
  | "mock"
  | "real"
  | "staging"
  | "pending"
  | "approved"
  | "rejected"
  | "urgent"
  | "high-impact"
  | "in-progress"
  | "blocked"
  | "ai"
  | "success"
  | "warning"
  | "info"
  | "neutral";

interface StatusBadgeProps {
  variant: StatusBadgeVariant;
  label?: string;
  className?: string;
  /** Render as an even smaller pill */
  compact?: boolean;
}

const VARIANTS: Record<StatusBadgeVariant, { base: string; dot?: string; defaultLabel: string }> = {
  mock:         { base: "bg-orion-amber/15 text-orion-amber border border-orion-amber/30",      defaultLabel: "Mock" },
  real:         { base: "bg-orion-success/15 text-orion-success border border-orion-success/30", defaultLabel: "Real" },
  staging:      { base: "bg-orion-info/15 text-orion-info border border-orion-info/30",           defaultLabel: "Staging" },
  pending:      { base: "bg-orion-warning/15 text-orion-warning border border-orion-warning/30",  defaultLabel: "Pendente" },
  approved:     { base: "bg-orion-success/15 text-orion-success border border-orion-success/30",  defaultLabel: "Aprovado" },
  rejected:     { base: "bg-destructive/15 text-destructive border border-destructive/30",         defaultLabel: "Rejeitado" },
  urgent:       { base: "bg-destructive/15 text-destructive border border-destructive/30",         defaultLabel: "Urgente" },
  "high-impact":{ base: "bg-primary/15 text-primary border border-primary/30",                     defaultLabel: "Alto impacto" },
  "in-progress":{ base: "bg-orion-info/15 text-orion-info border border-orion-info/30",            defaultLabel: "Em andamento" },
  blocked:      { base: "bg-destructive/10 text-destructive border border-destructive/20",          defaultLabel: "Bloqueado" },
  ai:           { base: "bg-primary/10 text-primary border border-primary/20",                      defaultLabel: "IA" },
  success:      { base: "bg-orion-success/15 text-orion-success border border-orion-success/30",  defaultLabel: "Concluído" },
  warning:      { base: "bg-orion-warning/15 text-orion-warning border border-orion-warning/30",   defaultLabel: "Atenção" },
  info:         { base: "bg-orion-info/15 text-orion-info border border-orion-info/30",            defaultLabel: "Info" },
  neutral:      { base: "bg-muted/50 text-muted-foreground border border-border",                  defaultLabel: "" },
};

export const StatusBadge = ({ variant, label, className, compact = false }: StatusBadgeProps) => {
  const { base, defaultLabel } = VARIANTS[variant] ?? VARIANTS.neutral;
  const text = label ?? defaultLabel;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-mono font-medium",
        compact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]",
        base,
        className
      )}
    >
      {variant === "ai" && <Sparkles className="w-2.5 h-2.5 shrink-0" />}
      {text}
    </span>
  );
};
