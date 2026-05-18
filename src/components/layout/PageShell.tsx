import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageShellProps {
  /** Page title */
  title: string;
  /** Short subtitle or context */
  subtitle?: string;
  /** Badge/label beside the title (e.g. "Mock", "Pro") */
  badge?: ReactNode;
  /** Buttons or controls rendered at top-right */
  actions?: ReactNode;
  /** Max width override — defaults to "5xl" */
  maxWidth?: "3xl" | "4xl" | "5xl" | "6xl" | "7xl" | "full";
  /** Padding variant */
  tight?: boolean;
  children: ReactNode;
  className?: string;
}

const maxWidthClass: Record<NonNullable<PageShellProps["maxWidth"]>, string> = {
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
  "full": "max-w-none",
};

export const PageShell = ({
  title,
  subtitle,
  badge,
  actions,
  maxWidth = "5xl",
  tight = false,
  children,
  className,
}: PageShellProps) => (
  <div className={cn("min-h-screen bg-background", className)}>
    <div className={cn("mx-auto w-full", maxWidthClass[maxWidth], tight ? "p-4 sm:p-5" : "p-4 sm:p-6")}>
      {/* Page header */}
      {(title || actions) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold text-foreground">{title}</h1>
              {badge}
            </div>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {actions && (
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {actions}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  </div>
);
