import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingStep, ONBOARDING_STEPS } from "@/types/companyDNA";
import { OnboardingSidebar } from "@/components/onboarding/OnboardingSidebar";
import { OnboardingStepView } from "@/components/onboarding/OnboardingStepView";
import { OnboardingWelcome } from "@/components/onboarding/OnboardingWelcome";
import { OnboardingComplete } from "@/components/onboarding/OnboardingComplete";
import { BrandAssetsStep } from "@/components/onboarding/BrandAssetsStep";
import { BusinessContextStep } from "@/components/onboarding/BusinessContextStep";
import { EconomicsStep } from "@/components/onboarding/EconomicsStep";
import { FunnelSnapshotStep } from "@/components/onboarding/FunnelSnapshotStep";
import { CreativesUploadStep } from "@/components/onboarding/CreativesUploadStep";
import { PositioningStep } from "@/components/onboarding/PositioningStep";
import { TeamRolesStep } from "@/components/onboarding/TeamRolesStep";
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
  const navigate = useNavigate();
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
    if (stepId !== "economics" && stepId !== "funnelSnapshot") return;
    const eco = formData.economics || {};
    const fun = formData.funnelSnapshot || {};
    const hasAny =
      Object.values(eco).some((v) => v?.trim()) || Object.values(fun).some((v) => v?.trim());
    if (!hasAny) return;
    await saveSnapshot({
      avg_ticket: numOrNull(eco.avg_ticket),
      avg_margin_pct: numOrNull(eco.avg_margin_pct),
      cac_current: numOrNull(eco.cac_current),
      ltv_estimated: numOrNull(eco.ltv_estimated),
      payback_months: numOrNull(eco.payback_months),
      monthly_revenue: numOrNull(eco.monthly_revenue),
      monthly_traffic: intOrNull(fun.monthly_traffic),
      conversion_rate_pct: numOrNull(fun.conversion_rate_pct),
      avg_roas: numOrNull(fun.avg_roas),
      team_size: intOrNull(fun.team_size),
      perceived_bottlenecks: fun.perceived_bottlenecks || null,
      current_tools: fun.current_tools || null,
      notes: eco.notes || null,
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

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(-1, prev - 1));
  };

  const handleStart = () => setCurrentStep(0);

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

      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        {isWelcome && <OnboardingWelcome onStart={handleStart} />}
        {isComplete && <OnboardingComplete data={formData} />}

        {step?.isCustom && step.id === "brandAssets" && (
          <BrandAssetsStep
            data={getStepData(step.block)}
            onUpdate={(key, value) => updateField(step.block, key, value)}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {step?.isCustom && step.id === "businessContext" && (
          <BusinessContextStep
            data={getStepData(step.block)}
            onUpdate={(key, value) => updateField(step.block, key, value)}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {step?.isCustom && step.id === "economics" && (
          <EconomicsStep
            data={getStepData(step.block)}
            onUpdate={(key, value) => updateField(step.block, key, value)}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {step?.isCustom && step.id === "funnelSnapshot" && (
          <FunnelSnapshotStep
            data={getStepData(step.block)}
            onUpdate={(key, value) => updateField(step.block, key, value)}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {step?.isCustom && step.id === "creativesUpload" && (
          <CreativesUploadStep
            companyDnaId={dna?.id}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {step?.isCustom && step.id === "positioning" && (
          <PositioningStep
            data={getStepData(step.block)}
            onUpdate={(key, value) => updateField(step.block, key, value)}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {step?.isCustom && step.id === "teamRoles" && (
          <TeamRolesStep
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
