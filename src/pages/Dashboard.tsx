import { AppLayout } from "@/components/layout/AppLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ChannelChart } from "@/components/dashboard/ChannelChart";
import { AlertsFeed } from "@/components/dashboard/AlertsFeed";
import { CampaignTable } from "@/components/dashboard/CampaignTable";
import { useCompanyDNA } from "@/hooks/useCompanyDNA";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { Link } from "react-router-dom";
import { Brain, Sparkles, ArrowRight, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

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
      <h3 className="text-heading text-foreground mb-2">Nenhuma campanha conectada</h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
        Conecte Meta Ads, Google Ads ou TikTok Ads na página de Integrações para ver métricas reais.
      </p>
      <div className="flex gap-3 justify-center">
        <Link to="/integrations">
          <Button className="orion-gradient text-primary-foreground gap-2">
            <Sparkles className="w-4 h-4" />
            Conectar plataformas
          </Button>
        </Link>
        <Link to="/chat">
          <Button variant="outline" className="border-border text-muted-foreground gap-2">
            Peça ao Orion para planejar
          </Button>
        </Link>
      </div>
    </div>
  </div>
);

const LiveDashboard = ({ companyName, metrics, onSync }: {
  companyName: string | null;
  metrics: NonNullable<ReturnType<typeof useDashboardMetrics>["metrics"]>;
  onSync: () => void;
}) => {
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await supabase.functions.invoke("sync-metrics", { body: {} });
      toast.success("Métricas sincronizadas!");
      onSync();
    } catch { toast.error("Erro ao sincronizar"); }
    finally { setSyncing(false); }
  };

  const formatCurrency = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {companyName ? `${companyName} — ` : ""}Dados reais dos últimos 7 dias
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing} className="gap-2">
          {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Sincronizar
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Gasto total" value={formatCurrency(metrics.totalSpend)} />
        <MetricCard label="ROAS geral" value={metrics.overallRoas ? `${metrics.overallRoas.toFixed(2)}x` : "—"} />
        <MetricCard label="Conversões" value={metrics.totalConversions.toLocaleString("pt-BR")} />
        <MetricCard label="CPA médio" value={metrics.overallCpa ? formatCurrency(metrics.overallCpa) : "—"} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <ChannelChart data={metrics.dailyData} byPlatform={metrics.byPlatform} />
        </div>
        <AlertsFeed metrics={metrics} />
      </div>

      <CampaignTable campaigns={metrics.campaignsList} />
    </div>
  );
};

const Dashboard = () => {
  const { dna, loading: dnaLoading } = useCompanyDNA();
  const { metrics, loading: metricsLoading, refetch } = useDashboardMetrics(7);

  if (dnaLoading || metricsLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 rounded-lg orion-gradient animate-pulse-glow" />
        </div>
      </AppLayout>
    );
  }

  if (!dna) {
    return <AppLayout><EmptyDashboard hasStartedOnboarding={false} /></AppLayout>;
  }

  if (!dna.onboarding_completed) {
    return <AppLayout><EmptyDashboard hasStartedOnboarding={true} /></AppLayout>;
  }

  if (!metrics?.hasData) {
    return <AppLayout><NoCampaignsDashboard companyName={dna.company_name} /></AppLayout>;
  }

  return (
    <AppLayout>
      <LiveDashboard companyName={dna.company_name} metrics={metrics} onSync={refetch} />
    </AppLayout>
  );
};

export default Dashboard;
