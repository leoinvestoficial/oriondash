import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

interface ChannelChartProps {
  data?: Array<{ date: string; spend: number; clicks: number; impressions: number; conversions: number; revenue: number }>;
  byPlatform?: Record<string, { spend: number; clicks: number; impressions: number; conversions: number; revenue: number }>;
}

const PLATFORM_COLORS: Record<string, { stroke: string; fill: string; name: string }> = {
  meta_ads: { stroke: "#4F46E5", fill: "#4F46E5", name: "Meta Ads" },
  google_ads: { stroke: "#4ECDC4", fill: "#4ECDC4", name: "Google Ads" },
  tiktok_ads: { stroke: "#FF6B6B", fill: "#FF6B6B", name: "TikTok Ads" },
};

export const ChannelChart = ({ data, byPlatform }: ChannelChartProps) => {
  // Use daily spend data for chart
  const chartData = data?.map(d => ({
    day: new Date(d.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    gasto: d.spend,
    conversões: d.conversions,
    cliques: d.clicks,
  })) || [];

  const hasPlatformData = byPlatform && Object.keys(byPlatform).length > 0;

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-heading text-foreground">Performance diária</h3>
          <p className="text-xs text-muted-foreground">Gasto e conversões — últimos 7 dias</p>
        </div>
        {hasPlatformData && (
          <div className="flex gap-3">
            {Object.entries(byPlatform).map(([platform, data]) => (
              <div key={platform} className="text-right">
                <p className="text-[10px] text-muted-foreground">{PLATFORM_COLORS[platform]?.name || platform}</p>
                <p className="text-xs font-medium text-foreground">R$ {data.spend.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(233 20% 22%)" />
            <XAxis dataKey="day" stroke="hsl(230 15% 55%)" fontSize={11} />
            <YAxis stroke="hsl(230 15% 55%)" fontSize={11} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : String(v)} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(232 38% 12%)",
                border: "1px solid hsl(233 20% 22%)",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              formatter={(value: number, name: string) => [
                name === "gasto" ? `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : value.toLocaleString("pt-BR"),
                name,
              ]}
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
            <Area type="monotone" dataKey="gasto" name="Gasto" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.3} />
            <Area type="monotone" dataKey="conversões" name="Conversões" stroke="#4ECDC4" fill="#4ECDC4" fillOpacity={0.3} />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">
          Sem dados para exibir
        </div>
      )}
    </div>
  );
};
