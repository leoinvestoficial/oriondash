/**
 * OperationalLoopAnimation
 * Animated loop: Detectar → Decidir → Executar → Medir → Aprender
 *
 * Uses CSS animations only — no Framer Motion dependency.
 */
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Search,
  Zap,
  PlayCircle,
  BarChart2,
  Lightbulb,
} from "lucide-react";

const STEPS = [
  { label: "Detectar",  icon: Search,     color: "text-orion-teal",    bg: "bg-orion-teal/10",    ring: "ring-orion-teal/40"    },
  { label: "Decidir",   icon: Zap,        color: "text-orion-amber",   bg: "bg-orion-amber/10",   ring: "ring-orion-amber/40"   },
  { label: "Executar",  icon: PlayCircle, color: "text-primary",       bg: "bg-primary/10",       ring: "ring-primary/40"       },
  { label: "Medir",     icon: BarChart2,  color: "text-orion-success", bg: "bg-orion-success/10", ring: "ring-orion-success/40" },
  { label: "Aprender",  icon: Lightbulb,  color: "text-orion-coral",   bg: "bg-orion-coral/10",   ring: "ring-orion-coral/40"   },
] as const;

interface OperationalLoopAnimationProps {
  /** Compact variant — smaller nodes, no labels */
  compact?: boolean;
  /** Show step labels under icons */
  showLabels?: boolean;
  /** Controlled active step (0-based) */
  activeStep?: number;
  /** Auto-cycle through steps. Ignored when activeStep is provided. */
  autoPlay?: boolean;
  /** Interval between steps in ms (default: 1800) */
  interval?: number;
  className?: string;
}

export const OperationalLoopAnimation = ({
  compact = false,
  showLabels = true,
  activeStep,
  autoPlay = true,
  interval = 1800,
  className,
}: OperationalLoopAnimationProps) => {
  const [internal, setInternal] = useState(0);
  const active = activeStep !== undefined ? activeStep : internal;

  useEffect(() => {
    if (!autoPlay || activeStep !== undefined) return;
    const id = setInterval(() => setInternal((p) => (p + 1) % STEPS.length), interval);
    return () => clearInterval(id);
  }, [autoPlay, activeStep, interval]);

  const nodeSize = compact ? "w-9 h-9" : "w-12 h-12";
  const iconSize = compact ? "w-4 h-4" : "w-5 h-5";
  const connectorW = compact ? "w-5" : "w-8";

  return (
    <div
      className={cn(
        "flex items-center justify-center select-none",
        showLabels && !compact && "flex-col gap-3",
        className
      )}
      aria-label="Loop operacional: Detectar, Decidir, Executar, Medir, Aprender"
    >
      <div className="flex items-center gap-0">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const isActive = active === i;
          const wasPrev = active === (i + STEPS.length - 1) % STEPS.length;

          return (
            <div key={step.label} className="flex items-center">
              {/* Node */}
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "rounded-full flex items-center justify-center transition-all duration-500",
                    nodeSize,
                    step.bg,
                    step.color,
                    isActive
                      ? cn("ring-2", step.ring, "scale-110 shadow-lg")
                      : "opacity-40 scale-90"
                  )}
                  style={{
                    boxShadow: isActive
                      ? `0 0 12px 2px var(--orion-glow, rgba(99,102,241,0.2))`
                      : undefined,
                  }}
                >
                  <Icon className={cn(iconSize, "transition-transform duration-300", isActive && "scale-110")} />
                </div>
                {showLabels && (
                  <p
                    className={cn(
                      "font-mono uppercase tracking-widest transition-all duration-300",
                      compact ? "text-[7px]" : "text-[9px]",
                      isActive ? cn(step.color, "font-semibold") : "text-muted-foreground/40"
                    )}
                  >
                    {step.label}
                  </p>
                )}
              </div>

              {/* Connector arrow */}
              {i < STEPS.length - 1 && (
                <div className={cn("flex items-center self-start mt-4", connectorW)}>
                  <div
                    className={cn(
                      "h-px flex-1 transition-all duration-500",
                      isActive || wasPrev
                        ? "bg-border/80"
                        : "bg-border/25"
                    )}
                  />
                  <svg
                    className={cn(
                      "w-2 h-2 shrink-0 transition-all duration-500",
                      isActive || wasPrev ? "text-border/80" : "text-border/25"
                    )}
                    viewBox="0 0 6 6"
                    fill="none"
                  >
                    <path d="M1 1 L5 3 L1 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}

              {/* Wrap-around connector (last → first, shown below on full variant) */}
              {i === STEPS.length - 1 && !compact && showLabels && (
                <div
                  aria-hidden
                  className={cn(
                    "absolute hidden xl:flex items-center gap-1 mt-14 text-[8px] font-mono text-muted-foreground/30 transition-opacity duration-700",
                    active === STEPS.length - 1 && "opacity-100",
                    active !== STEPS.length - 1 && "opacity-0"
                  )}
                >
                  ↩ loop contínuo
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
