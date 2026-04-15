import { OnboardingStep } from "@/types/companyDNA";
import { cn } from "@/lib/utils";

interface OnboardingSidebarProps {
  steps: OnboardingStep[];
  currentStep: number;
  completedSteps: Set<string>;
  onStepClick: (index: number) => void;
}

export const OnboardingSidebar = ({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
}: OnboardingSidebarProps) => {
  return (
    <div className="w-64 border-r border-border bg-card p-6 flex flex-col">
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
              onClick={() => isAccessible && onStepClick(index)}
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

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Seus dados são salvos automaticamente.
        </p>
      </div>
    </div>
  );
};
