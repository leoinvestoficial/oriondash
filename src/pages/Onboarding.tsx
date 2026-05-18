import { useState, useEffect } from "react";
import { OnboardingStep, ONBOARDING_STEPS } from "@/types/companyDNA";
import { OnboardingSidebar } from "@/components/onboarding/OnboardingSidebar";
import { OnboardingWelcome } from "@/components/onboarding/OnboardingWelcome";
import { OnboardingComplete } from "@/components/onboarding/OnboardingComplete";
import { BrandAssetsStep } from "@/components/onboarding/BrandAssetsStep";
import { IdentityStep } from "@/components/onboarding/IdentityStep";
import { MarketPositioningStep } from "@/components/onboarding/MarketPositioningStep";
import { AudienceStep } from "@/components/onboarding/AudienceStep";
import { MetricsStep } from "@/components/onboarding/MetricsStep";
import { SalesProductStep } from "@/components/onboarding/SalesProductStep";
import { GoalsConstraintsStep } from "@/components/onboarding/GoalsConstraintsStep";
import { CreativesUploadStep } from "@/components/onboarding/CreativesUploadStep";
import { TeamRolesStep } from "@/components/onboarding/TeamRolesStep";
import { WebsiteScanStep } from "@/components/onboarding/WebsiteScanStep";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCompanyDNA } from "@/hooks/useCompanyDNA";
import { useBusinessMetrics } from "@/hooks/useBusinessMetrics";

const numOrNull = (v: string | undefined) => {
  if (!v) return null;
  const n = parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
};
const intOrNull = (v: string | undefined) => {
  if (!v) return null;
  const n = parseInt(String(v).replace(/\D/g, ""), 10);
  return Number.isFinite(n) ? n : null;
};

const Onboarding = () => {
  const { dna, loading, saveDNA } = useCompanyDNA();
  const { saveSnapshot } = useBusinessMetrics(dna?.id);
  const [currentStep, setCurrentStep] = useState(-1);
  const [formData, setFormData] = useState<Record<string, Record<string, string>>>({});
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (dna?.dna_data && Object.keys(dna.dna_data).length > 0) {
      setFormData(dna.dna_data);
      const completed = new Set<string>();
      ONBOARDING_STEPS.forEach((step) => {
        const blockData = dna.dna_data[step.block];
        if (blockData && Object.values(blockData).some((v) => v?.trim())) {
          completed.add(step.id);
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

  const persistMetricsIfRelevant = async (stepId: string) => {
    if (stepId !== "metrics") return;
    const m = formData.metrics || {};
    const hasAny = Object.values(m).some((v) => v?.trim());
    if (!hasAny) return;
    await saveSnapshot({
      avg_ticket: numOrNull(m.avg_ticket),
      avg_margin_pct: numOrNull(m.avg_margin_pct),
      cac_current: numOrNull(m.cac_current),
      ltv_estimated: numOrNull(m.ltv_estimated),
      payback_months: null,
      monthly_revenue: numOrNull(m.monthly_revenue),
      monthly_traffic: intOrNull(m.monthly_traffic),
      conversion_rate_pct: numOrNull(m.conversion_rate_pct),
      avg_roas: numOrNull(m.avg_roas),
      team_size: null,
      perceived_bottlenecks: m.perceived_bottlenecks || null,
      current_tools: m.current_tools || null,
      notes: null,
    });
  };

  const handleNext = async () => {
    if (step) {
      setCompletedSteps((prev) => new Set([...prev, step.id]));
      await persistMetricsIfRelevant(step.id);
    }
    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);
    await saveDNA(formData, nextStep >= ONBOARDING_STEPS.length);
  };

  const handleBack = () => setCurrentStep((prev) => Math.max(-1, prev - 1));
  const handleStart = () => setCurrentStep(0);
  const getStepData = (block: string) => formData[block] || {};

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-lg orion-gradient animate-pulse-glow" />
      </div>
    );
  }

  if (step?.id === "websiteScan") {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto px-4 py-8">
          <WebsiteScanStep onComplete={handleNext} />
        </div>
      </AppLayout>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background">
      {!isWelcome && !isComplete && (
        <OnboardingSidebar
          steps={ONBOARDING_STEPS}
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={setCurrentStep}
        />
      )}

      <div className="flex-1 flex items-start md:items-center justify-center p-4 sm:p-6 md:p-8 overflow-y-auto">
        {isWelcome && <OnboardingWelcome onStart={handleStart} />}
        {isComplete && <OnboardingComplete data={formData} />}

        {step?.id === "brandAssets" && (
          <BrandAssetsStep
            data={getStepData(step.block)}
            onUpdate={(k, v) => updateField(step.block, k, v)}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {step?.id === "identity" && (
          <IdentityStep
            data={getStepData(step.block)}
            onUpdate={(k, v) => updateField(step.block, k, v)}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {step?.id === "marketPositioning" && (
          <MarketPositioningStep
            data={getStepData(step.block)}
            onUpdate={(k, v) => updateField(step.block, k, v)}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {step?.id === "audience" && (
          <AudienceStep
            data={getStepData(step.block)}
            onUpdate={(k, v) => updateField(step.block, k, v)}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {step?.id === "salesProduct" && (
          <SalesProductStep
            data={getStepData(step.block)}
            onUpdate={(k, v) => updateField(step.block, k, v)}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {step?.id === "metrics" && (
          <MetricsStep
            data={getStepData(step.block)}
            onUpdate={(k, v) => updateField(step.block, k, v)}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {step?.id === "goalsConstraints" && (
          <GoalsConstraintsStep
            data={getStepData(step.block)}
            onUpdate={(k, v) => updateField(step.block, k, v)}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {step?.id === "teamRoles" && (
          <TeamRolesStep
            data={getStepData(step.block)}
            onUpdate={(k, v) => updateField(step.block, k, v)}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {step?.id === "creativesUpload" && (
          <CreativesUploadStep
            companyDnaId={dna?.id}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
      </div>
    </div>
  );
};

export default Onboarding;
