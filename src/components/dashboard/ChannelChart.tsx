import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const data = [
  { day: "01", meta: 4200, google: 3100, tiktok: 1800, linkedin: 900 },
  { day: "05", meta: 3800, google: 3400, tiktok: 2200, linkedin: 1100 },
  { day: "10", meta: 5100, google: 2900, tiktok: 2800, linkedin: 800 },
  { day: "15", meta: 4600, google: 3600, tiktok: 3100, linkedin: 1200 },
  { day: "20", meta: 5400, google: 3200, tiktok: 2500, linkedin: 1400 },
  { day: "25", meta: 4900, google: 3800, tiktok: 3300, linkedin: 1000 },
  { day: "30", meta: 5800, google: 4100, tiktok: 2900, linkedin: 1300 },
];

export const ChannelChart = () => {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-heading text-foreground">Performance por canal</h3>
          <p className="text-xs text-muted-foreground">Gasto diário — últimos 30 dias</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(233 20% 22%)" />
          <XAxis dataKey="day" stroke="hsl(230 15% 55%)" fontSize={11} />
          <YAxis stroke="hsl(230 15% 55%)" fontSize={11} tickFormatter={(v) => `${v / 1000}k`} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(232 38% 12%)",
              border: "1px solid hsl(233 20% 22%)",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: "11px", color: "hsl(230 15% 55%)" }}
          />
          <Area type="monotone" dataKey="meta" name="Meta Ads" stackId="1" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.3} />
          <Area type="monotone" dataKey="google" name="Google Ads" stackId="1" stroke="#4ECDC4" fill="#4ECDC4" fillOpacity={0.3} />
          <Area type="monotone" dataKey="tiktok" name="TikTok Ads" stackId="1" stroke="#FF6B6B" fill="#FF6B6B" fillOpacity={0.3} />
          <Area type="monotone" dataKey="linkedin" name="LinkedIn" stackId="1" stroke="#FFE66D" fill="#FFE66D" fillOpacity={0.3} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
