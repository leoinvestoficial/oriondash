import { useState } from "react";
import { OnboardingStep, ONBOARDING_STEPS } from "@/types/companyDNA";
import { OnboardingSidebar } from "@/components/onboarding/OnboardingSidebar";
import { OnboardingStepView } from "@/components/onboarding/OnboardingStepView";
import { OnboardingWelcome } from "@/components/onboarding/OnboardingWelcome";
import { OnboardingComplete } from "@/components/onboarding/OnboardingComplete";

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(-1); // -1 = welcome
  const [formData, setFormData] = useState<Record<string, Record<string, string>>>({});
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const isWelcome = currentStep === -1;
  const isComplete = currentStep >= ONBOARDING_STEPS.length;
  const step = ONBOARDING_STEPS[currentStep] as OnboardingStep | undefined;

  const updateField = (block: string, key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [block]: { ...prev[block], [key]: value },
    }));
  };

  const handleNext = () => {
    if (step) {
      setCompletedSteps((prev) => new Set([...prev, step.id]));
    }
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(-1, prev - 1));
  };

  const handleStart = () => {
    setCurrentStep(0);
  };

  const getStepData = (block: string) => formData[block] || {};

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      {!isWelcome && !isComplete && (
        <OnboardingSidebar
          steps={ONBOARDING_STEPS}
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={setCurrentStep}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex items-center justify-center p-8">
        {isWelcome && <OnboardingWelcome onStart={handleStart} />}
        {isComplete && <OnboardingComplete data={formData} />}
        {step && (
          <OnboardingStepView
            step={step}
            data={getStepData(step.block)}
            onUpdate={(key, value) => updateField(step.block, key, value)}
            onNext={handleNext}
            onBack={handleBack}
            isFirst={currentStep === 0}
            isLast={currentStep === ONBOARDING_STEPS.length - 1}
            stepNumber={currentStep + 1}
            totalSteps={ONBOARDING_STEPS.length}
          />
        )}
      </div>
    </div>
  );
};

export default Onboarding;
