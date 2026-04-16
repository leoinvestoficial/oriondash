import { AppLayout } from "@/components/layout/AppLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ChannelChart } from "@/components/dashboard/ChannelChart";
import { AlertsFeed } from "@/components/dashboard/AlertsFeed";
import { CampaignTable } from "@/components/dashboard/CampaignTable";
import { useCompanyDNA } from "@/hooks/useCompanyDNA";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { Link } from "react-router-dom";
import { Brain, Sparkles, ArrowRight, RefreshCw, Loader2, Megaphone, CalendarDays, ListTodo, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useState, useEffect } from "react";

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

interface CampaignSummary {
  total: number;
  active: number;
  totalBudget: number;
  upcoming: number;
}
interface ContentSummary {
  total: number;
  scheduled: number;
  thisWeek: number;
}
interface TaskSummary {
  total: number;
  todo: number;
  overdue: number;
}

const OperationalDashboard = ({ companyName, campaigns, content, tasks, metrics, onSync }: {
  companyName: string | null;
  campaigns: CampaignSummary;
  content: ContentSummary;
  tasks: TaskSummary;
  metrics: ReturnType<typeof useDashboardMetrics>["metrics"];
  onSync: () => void;
}) => {
  const [syncing, setSyncing] = useState(false);
  const hasMetrics = metrics?.hasData;

  const handleSync = async () => {
    setSyncing(true);
    try {
      await supabase.functions.invoke("sync-metrics", { body: {} });
      toast.success("Métricas sincronizadas!");
      onSync();
    } catch { toast.error("Erro ao sincronizar"); }
    finally { setSyncing(false); }
  };

  const formatCurrency = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {companyName ? `${companyName} — ` : ""}Visão geral de marketing
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/campaigns">
            <Button variant="outline" size="sm" className="gap-2">
              <Plus className="w-3 h-3" /> Nova campanha
            </Button>
          </Link>
          {hasMetrics && (
            <Button variant="outline" size="sm" onClick={handleSync} disabled={syncing} className="gap-2">
              {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Sincronizar
            </Button>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/campaigns" className="block">
          <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Megaphone className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{campaigns.total}</p>
                <p className="text-[10px] text-muted-foreground">Campanhas</p>
              </div>
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span><span className="text-orion-success font-medium">{campaigns.active}</span> ativas</span>
              <span>R$ {campaigns.totalBudget.toLocaleString("pt-BR")} investidos</span>
            </div>
          </div>
        </Link>

        <Link to="/calendar" className="block">
          <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-orion-teal/10 flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-orion-teal" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{content.total}</p>
                <p className="text-[10px] text-muted-foreground">Conteúdos planejados</p>
              </div>
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span><span className="text-orion-info font-medium">{content.scheduled}</span> agendados</span>
              <span><span className="text-orion-warning font-medium">{content.thisWeek}</span> esta semana</span>
            </div>
          </div>
        </Link>

        <Link to="/tasks" className="block">
          <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-orion-coral/10 flex items-center justify-center">
                <ListTodo className="w-5 h-5 text-orion-coral" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{tasks.total}</p>
                <p className="text-[10px] text-muted-foreground">Tarefas</p>
              </div>
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span><span className="text-muted-foreground font-medium">{tasks.todo}</span> a fazer</span>
              {tasks.overdue > 0 && <span className="text-orion-coral font-medium">{tasks.overdue} atrasadas</span>}
            </div>
          </div>
        </Link>
      </div>

      {/* Metrics section — real or placeholder */}
      {hasMetrics && metrics ? (
        <>
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
        </>
      ) : (
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-orion-surface-2 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-orion-violet-light" />
            </div>
            <div>
              <h3 className="text-heading text-foreground mb-1">Métricas de anúncios</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Conecte Meta Ads, Google Ads ou TikTok Ads para ver métricas de performance em tempo real.
              </p>
              <div className="flex gap-3">
                <Link to="/integrations">
                  <Button size="sm" className="orion-gradient text-primary-foreground gap-2">
                    <Sparkles className="w-3 h-3" /> Conectar plataformas
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const { dna, loading: dnaLoading } = useCompanyDNA();
  const { metrics, loading: metricsLoading, refetch } = useDashboardMetrics(7);

  const [campaignSummary, setCampaignSummary] = useState<CampaignSummary>({ total: 0, active: 0, totalBudget: 0, upcoming: 0 });
  const [contentSummary, setContentSummary] = useState<ContentSummary>({ total: 0, scheduled: 0, thisWeek: 0 });
  const [taskSummary, setTaskSummary] = useState<TaskSummary>({ total: 0, todo: 0, overdue: 0 });

  useEffect(() => {
    if (!user) return;
    const fetchSummaries = async () => {
      const [campRes, contentRes, taskRes] = await Promise.all([
        supabase.from("campaigns").select("status, budget_total").eq("user_id", user.id),
        supabase.from("content_calendar").select("status, scheduled_date").eq("user_id", user.id),
        supabase.from("tasks").select("status, due_date").eq("user_id", user.id),
      ]);

      if (campRes.data) {
        setCampaignSummary({
          total: campRes.data.length,
          active: campRes.data.filter(c => c.status === "active").length,
          totalBudget: campRes.data.reduce((s, c) => s + (Number(c.budget_total) || 0), 0),
          upcoming: campRes.data.filter(c => c.status === "draft").length,
        });
      }

      if (contentRes.data) {
        const now = new Date();
        const weekEnd = new Date(now);
        weekEnd.setDate(weekEnd.getDate() + 7);
        setContentSummary({
          total: contentRes.data.length,
          scheduled: contentRes.data.filter(c => c.status === "scheduled").length,
          thisWeek: contentRes.data.filter(c => {
            const d = new Date(c.scheduled_date);
            return d >= now && d <= weekEnd;
          }).length,
        });
      }

      if (taskRes.data) {
        setTaskSummary({
          total: taskRes.data.length,
          todo: taskRes.data.filter(t => t.status === "todo").length,
          overdue: taskRes.data.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== "done").length,
        });
      }
    };
    fetchSummaries();
  }, [user]);

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

  return (
    <AppLayout>
      <OperationalDashboard
        companyName={dna.company_name}
        campaigns={campaignSummary}
        content={contentSummary}
        tasks={taskSummary}
        metrics={metrics}
        onSync={refetch}
      />
    </AppLayout>
  );
};

export default Dashboard;
