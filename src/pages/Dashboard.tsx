import { AppLayout } from "@/components/layout/AppLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ChannelChart } from "@/components/dashboard/ChannelChart";
import { AlertsFeed } from "@/components/dashboard/AlertsFeed";
import { CampaignTable } from "@/components/dashboard/CampaignTable";
import { useCompanyDNA } from "@/hooks/useCompanyDNA";
import { Link } from "react-router-dom";
import { Brain, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const EmptyDashboard = ({ hasStartedOnboarding }: { hasStartedOnboarding: boolean }) => (
  <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
    <div className="w-16 h-16 rounded-2xl orion-gradient flex items-center justify-center orion-glow mb-6">
      <Sparkles className="w-8 h-8 text-primary-foreground" />
    </div>
    <h1 className="text-display text-foreground mb-3">
      {hasStartedOnboarding ? "Complete seu Company DNA" : "Bem-vindo ao Orion"}
    </h1>
    <p className="text-muted-foreground max-w-md mb-8">
      {hasStartedOnboarding
        ? "Você começou o onboarding mas ainda não finalizou. Complete todas as etapas para o Orion entender seu negócio e começar a operar."
        : "Para o Orion operar como seu head de marketing, ele precisa entender profundamente sua empresa. Comece pelo onboarding do Company DNA."}
    </p>
    <Link to="/onboarding">
      <Button className="orion-gradient text-primary-foreground rounded-xl px-6 py-3 gap-2">
        <Brain className="w-4 h-4" />
        {hasStartedOnboarding ? "Continuar Onboarding" : "Iniciar Company DNA"}
        <ArrowRight className="w-4 h-4" />
      </Button>
    </Link>
  </div>
);

const NoCampaignsDashboard = ({ companyName }: { companyName: string | null }) => (
  <div className="p-6 space-y-6">
    <div>
      <h1 className="text-display text-foreground">Dashboard</h1>
      <p className="text-sm text-muted-foreground">
        {companyName ? `${companyName} — ` : ""}Visão consolidada de todos os canais
      </p>
    </div>

    <div className="grid grid-cols-4 gap-4">
      {["Gasto total", "ROAS geral", "Leads gerados", "CAC médio"].map((label) => (
        <div key={label} className="bg-card border border-border rounded-xl p-5 space-y-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-medium text-foreground">—</p>
          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-orion-surface-2 rounded-lg p-2.5">
            <Sparkles className="w-3 h-3 text-orion-violet-light mt-0.5 shrink-0" />
            <span>Conecte seus canais de Ads para ver dados reais aqui</span>
          </div>
        </div>
      ))}
    </div>

    <div className="bg-card border border-border rounded-xl p-8 text-center">
      <div className="w-12 h-12 rounded-xl bg-orion-surface-2 flex items-center justify-center mx-auto mb-4">
        <Sparkles className="w-6 h-6 text-orion-violet-light" />
      </div>
      <h3 className="text-heading text-foreground mb-2">Nenhuma campanha ativa</h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
        Quando você conectar seus canais (Meta Ads, Google Ads, etc.), o Orion vai puxar dados em tempo real e exibir métricas, gráficos e alertas aqui.
      </p>
      <Link to="/chat">
        <Button variant="outline" className="border-border text-muted-foreground gap-2">
          <Sparkles className="w-4 h-4" />
          Peça ao Orion para planejar sua primeira campanha
        </Button>
      </Link>
    </div>
  </div>
);

const Dashboard = () => {
  const { dna, loading } = useCompanyDNA();

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 rounded-lg orion-gradient animate-pulse-glow" />
        </div>
      </AppLayout>
    );
  }

  // No DNA at all → prompt onboarding
  if (!dna) {
    return (
      <AppLayout>
        <EmptyDashboard hasStartedOnboarding={false} />
      </AppLayout>
    );
  }

  // DNA started but not completed
  if (!dna.onboarding_completed) {
    return (
      <AppLayout>
        <EmptyDashboard hasStartedOnboarding={true} />
      </AppLayout>
    );
  }

  // DNA completed but no ad channels connected → show empty metrics
  // For now, since we don't have real integrations, show this state
  const hasBudget = dna.dna_data?.constraints?.budget && 
    !dna.dna_data.constraints.budget.toLowerCase().includes("não") &&
    !dna.dna_data.constraints.budget.toLowerCase().includes("zero") &&
    !dna.dna_data.constraints.budget.toLowerCase().includes("nenhum") &&
    dna.dna_data.constraints.budget.trim() !== "0" &&
    dna.dna_data.constraints.budget.trim() !== "";

  // Always show the "no campaigns" state since there are no real integrations yet
  return (
    <AppLayout>
      <NoCampaignsDashboard companyName={dna.company_name} />
    </AppLayout>
  );
};

export default Dashboard;
