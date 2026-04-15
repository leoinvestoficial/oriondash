import { OnboardingStep } from "@/types/companyDNA";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface OnboardingStepViewProps {
  step: OnboardingStep;
  data: Record<string, string>;
  onUpdate: (key: string, value: string) => void;
  onNext: () => void;
  onBack: () => void;
  isFirst: boolean;
  isLast: boolean;
  stepNumber: number;
  totalSteps: number;
}

export const OnboardingStepView = ({
  step,
  data,
  onUpdate,
  onNext,
  onBack,
  isFirst,
  isLast,
  stepNumber,
  totalSteps,
}: OnboardingStepViewProps) => {
  const filledCount = step.questions.filter((q) => data[q.key]?.trim()).length;
  const progress = (filledCount / step.questions.length) * 100;

  return (
    <div className="max-w-2xl w-full mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="w-10 h-10 rounded-xl orion-gradient flex items-center justify-center text-lg text-primary-foreground">
            {step.icon}
          </span>
          <div>
            <p className="text-xs text-muted-foreground font-mono">
              BLOCO {stepNumber}/{totalSteps}
            </p>
            <h2 className="text-display text-foreground">{step.title}</h2>
          </div>
        </div>
        <p className="text-muted-foreground">{step.subtitle}</p>

        {/* Progress bar */}
        <div className="mt-4 h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full orion-gradient transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {filledCount} de {step.questions.length} campos preenchidos
        </p>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {step.questions.map((question) => (
          <div key={question.key} className="group">
            <label className="block text-sm text-foreground mb-2 font-medium">
              {question.label}
            </label>
            {question.type === "text" ? (
              <Input
                value={data[question.key] || ""}
                onChange={(e) => onUpdate(question.key, e.target.value)}
                placeholder={question.placeholder}
                className="bg-orion-surface-2 border-border focus:border-primary transition-colors"
              />
            ) : (
              <Textarea
                value={data[question.key] || ""}
                onChange={(e) => onUpdate(question.key, e.target.value)}
                placeholder={question.placeholder}
                rows={3}
                className="bg-orion-surface-2 border-border focus:border-primary transition-colors resize-none"
              />
            )}
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-10 pt-6 border-t border-border">
        <Button
          variant="ghost"
          onClick={onBack}
          disabled={isFirst}
          className="text-muted-foreground"
        >
          ← Voltar
        </Button>

        <Button
          onClick={onNext}
          className="orion-gradient text-primary-foreground px-6 orion-glow hover:opacity-90 transition-opacity"
        >
          {isLast ? "Finalizar Company DNA" : "Próximo bloco →"}
        </Button>
      </div>
    </div>
  );
};
