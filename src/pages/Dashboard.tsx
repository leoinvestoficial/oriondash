import { AppLayout } from "@/components/layout/AppLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ChannelChart } from "@/components/dashboard/ChannelChart";
import { AlertsFeed } from "@/components/dashboard/AlertsFeed";
import { CampaignTable } from "@/components/dashboard/CampaignTable";

const Dashboard = () => {
  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-display text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Visão consolidada de todos os canais em tempo real
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4">
          <MetricCard
            label="Gasto total"
            value="R$ 42.350"
            change={-8.2}
            insight="Redução por otimização automática de budget no Meta"
          />
          <MetricCard
            label="ROAS geral"
            value="3.8x"
            change={12.5}
            insight="Melhora impulsionada por criativos de vídeo curto"
            accent="teal"
          />
          <MetricCard
            label="Leads gerados"
            value="1.247"
            change={22.1}
            insight="Volume 22% acima da meta mensal de 1.020"
            accent="amber"
          />
          <MetricCard
            label="CAC médio"
            value="R$ 34"
            change={-15.3}
            insight="Queda consistente nas últimas 3 semanas"
            accent="coral"
          />
        </div>

        {/* Charts + Alerts */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <ChannelChart />
          </div>
          <div>
            <AlertsFeed />
          </div>
        </div>

        {/* Campaigns Table */}
        <CampaignTable />
      </div>
    </AppLayout>
  );
};

export default Dashboard;
