import { useState } from "react";
import { OnboardingStep } from "@/types/companyDNA";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

interface OnboardingSidebarProps {
  steps: OnboardingStep[];
  currentStep: number;
  completedSteps: Set<string>;
  onStepClick: (index: number) => void;
}

const SidebarContent = ({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
  onNavigate,
}: OnboardingSidebarProps & { onNavigate?: () => void }) => (
  <>
    {/* Logo */}
    <div className="flex items-center gap-3 mb-8">
      <div className="w-8 h-8 rounded-lg orion-gradient flex items-center justify-center">
        <span className="text-sm text-primary-foreground font-bold">O</span>
      </div>
      <span className="text-heading text-foreground">Orion</span>
    </div>

    {/* Progress */}
    <div className="text-xs text-muted-foreground mb-6">
      Company DNA — {completedSteps.size}/{steps.length} blocos
    </div>

    {/* Steps */}
    <nav className="flex-1 space-y-1">
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = completedSteps.has(step.id);
        const isAccessible = index <= currentStep || isCompleted;

        return (
          <button
            key={step.id}
            onClick={() => {
              if (isAccessible) {
                onStepClick(index);
                onNavigate?.();
              }
            }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-all",
              isActive && "bg-primary/10 text-primary border border-primary/20",
              !isActive && isCompleted && "text-foreground hover:bg-muted/50",
              !isActive && !isCompleted && "text-muted-foreground",
              !isAccessible && "opacity-40 cursor-not-allowed"
            )}
          >
            <span
              className={cn(
                "w-7 h-7 rounded-md flex items-center justify-center text-xs shrink-0",
                isActive && "orion-gradient text-primary-foreground",
                isCompleted && !isActive && "bg-orion-success/20 text-orion-success",
                !isActive && !isCompleted && "bg-muted text-muted-foreground"
              )}
            >
              {isCompleted && !isActive ? "✓" : step.icon}
            </span>
            <span className="truncate">{step.title}</span>
          </button>
        );
      })}
    </nav>

    <div className="mt-6 pt-4 border-t border-border">
      <p className="text-xs text-muted-foreground">Salvo automaticamente.</p>
    </div>
  </>
);

export const OnboardingSidebar = (props: OnboardingSidebarProps) => {
  const [open, setOpen] = useState(false);
  const current = props.steps[props.currentStep];

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 border-r border-border bg-card p-6 flex-col shrink-0">
        <SidebarContent {...props} />
      </aside>

      {/* Mobile top bar + drawer */}
      <div className="md:hidden sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-card/95 backdrop-blur px-4 py-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 bg-card border-border p-6 flex flex-col">
            <SidebarContent {...props} onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] text-muted-foreground font-mono uppercase">
            Etapa {props.currentStep + 1}/{props.steps.length}
          </p>
          <p className="text-sm font-medium text-foreground truncate">
            {current?.title || "Company DNA"}
          </p>
        </div>
        <div className="text-xs text-muted-foreground shrink-0">
          {props.completedSteps.size}/{props.steps.length}
        </div>
      </div>
    </>
  );
};
