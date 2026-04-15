import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingStep, ONBOARDING_STEPS } from "@/types/companyDNA";
import { OnboardingSidebar } from "@/components/onboarding/OnboardingSidebar";
import { OnboardingStepView } from "@/components/onboarding/OnboardingStepView";
import { OnboardingWelcome } from "@/components/onboarding/OnboardingWelcome";
import { OnboardingComplete } from "@/components/onboarding/OnboardingComplete";
import { BrandAssetsStep } from "@/components/onboarding/BrandAssetsStep";
import { useCompanyDNA } from "@/hooks/useCompanyDNA";

const Onboarding = () => {
  const navigate = useNavigate();
  const { dna, loading, saveDNA } = useCompanyDNA();
  const [currentStep, setCurrentStep] = useState(-1);
  const [formData, setFormData] = useState<Record<string, Record<string, string>>>({});
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (dna?.dna_data && Object.keys(dna.dna_data).length > 0) {
      setFormData(dna.dna_data);
      const completed = new Set<string>();
      ONBOARDING_STEPS.forEach((step) => {
        if (step.isCustom) {
          const blockData = dna.dna_data[step.block];
          if (blockData && Object.values(blockData).some((v) => v?.trim())) {
            completed.add(step.id);
          }
        } else {
          const blockData = dna.dna_data[step.block];
          if (blockData && Object.values(blockData).some((v) => v?.trim())) {
            completed.add(step.id);
          }
        }
      });
      setCompletedSteps(completed);
    }
  }, [dna]);

  const isWelcome = currentStep === -1;
  const isComplete = currentStep >= ONBOARDING_STEPS.length;
  const step = ONBOARDING_STEPS[currentStep] as OnboardingStep | undefined;

  const updateField = (block: string, key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [block]: { ...prev[block], [key]: value },
    }));
  };

  const handleNext = async () => {
    if (step) {
      setCompletedSteps((prev) => new Set([...prev, step.id]));
    }
    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);
    await saveDNA(formData, nextStep >= ONBOARDING_STEPS.length);
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(-1, prev - 1));
  };

  const handleStart = () => {
    setCurrentStep(0);
  };

  const getStepData = (block: string) => formData[block] || {};

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-lg orion-gradient animate-pulse-glow" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {!isWelcome && !isComplete && (
        <OnboardingSidebar
          steps={ONBOARDING_STEPS}
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={setCurrentStep}
        />
      )}

      <div className="flex-1 flex items-center justify-center p-8">
        {isWelcome && <OnboardingWelcome onStart={handleStart} />}
        {isComplete && <OnboardingComplete data={formData} />}
        {step && step.isCustom && step.id === "brandAssets" && (
          <BrandAssetsStep
            data={getStepData(step.block)}
            onUpdate={(key, value) => updateField(step.block, key, value)}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {step && !step.isCustom && (
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
