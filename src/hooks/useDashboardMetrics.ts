import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface DashboardMetrics {
  totalSpend: number;
  totalRevenue: number;
  totalClicks: number;
  totalImpressions: number;
  totalConversions: number;
  overallRoas: number | null;
  overallCtr: number | null;
  overallCpc: number | null;
  overallCpa: number | null;
  dailyData: Array<{
    date: string;
    spend: number;
    clicks: number;
    impressions: number;
    conversions: number;
    revenue: number;
  }>;
  campaignsList: Array<{
    id: string;
    name: string;
    platform: string;
    status: string;
    spend: number;
    clicks: number;
    impressions: number;
    conversions: number;
    roas: number | null;
    ctr: number | null;
    cpa: number | null;
  }>;
  byPlatform: Record<string, { spend: number; clicks: number; impressions: number; conversions: number; revenue: number }>;
  hasData: boolean;
  hasMockData: boolean;
}

export const useDashboardMetrics = (days: number = 7) => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    const sinceDate = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];

    const [campaignsRes, metricsRes] = await Promise.all([
      supabase.from("campaigns").select("*").eq("user_id", user.id),
      supabase.from("campaign_metrics").select("*").eq("user_id", user.id).gte("date", sinceDate).order("date"),
    ]);

    const campaigns = campaignsRes.data || [];
    const metricRows = metricsRes.data || [];

    if (!campaigns.length && !metricRows.length) {
      setMetrics({ totalSpend: 0, totalRevenue: 0, totalClicks: 0, totalImpressions: 0, totalConversions: 0, overallRoas: null, overallCtr: null, overallCpc: null, overallCpa: null, dailyData: [], campaignsList: [], byPlatform: {}, hasData: false, hasMockData: false });
      setLoading(false);
      return;
    }

    // Aggregate metrics
    let totalSpend = 0, totalRevenue = 0, totalClicks = 0, totalImpressions = 0, totalConversions = 0;
    const dailyMap: Record<string, { spend: number; clicks: number; impressions: number; conversions: number; revenue: number }> = {};
    const campaignMetrics: Record<string, { spend: number; clicks: number; impressions: number; conversions: number; revenue: number }> = {};
    const platformMetrics: Record<string, { spend: number; clicks: number; impressions: number; conversions: number; revenue: number }> = {};

    for (const m of metricRows) {
      totalSpend += Number(m.spend);
      totalRevenue += Number(m.revenue);
      totalClicks += m.clicks;
      totalImpressions += m.impressions;
      totalConversions += m.conversions;

      if (!dailyMap[m.date]) dailyMap[m.date] = { spend: 0, clicks: 0, impressions: 0, conversions: 0, revenue: 0 };
      dailyMap[m.date].spend += Number(m.spend);
      dailyMap[m.date].clicks += m.clicks;
      dailyMap[m.date].impressions += m.impressions;
      dailyMap[m.date].conversions += m.conversions;
      dailyMap[m.date].revenue += Number(m.revenue);

      if (!campaignMetrics[m.campaign_id]) campaignMetrics[m.campaign_id] = { spend: 0, clicks: 0, impressions: 0, conversions: 0, revenue: 0 };
      campaignMetrics[m.campaign_id].spend += Number(m.spend);
      campaignMetrics[m.campaign_id].clicks += m.clicks;
      campaignMetrics[m.campaign_id].impressions += m.impressions;
      campaignMetrics[m.campaign_id].conversions += m.conversions;
      campaignMetrics[m.campaign_id].revenue += Number(m.revenue);
    }

    // Build campaign list with platform info
    const campaignsList = campaigns.map(c => {
      const cm = campaignMetrics[c.id] || { spend: 0, clicks: 0, impressions: 0, conversions: 0, revenue: 0 };
      
      if (!platformMetrics[c.platform]) platformMetrics[c.platform] = { spend: 0, clicks: 0, impressions: 0, conversions: 0, revenue: 0 };
      platformMetrics[c.platform].spend += cm.spend;
      platformMetrics[c.platform].clicks += cm.clicks;
      platformMetrics[c.platform].impressions += cm.impressions;
      platformMetrics[c.platform].conversions += cm.conversions;
      platformMetrics[c.platform].revenue += cm.revenue;

      return {
        id: c.id,
        name: c.name,
        platform: c.platform,
        status: c.status,
        spend: cm.spend,
        clicks: cm.clicks,
        impressions: cm.impressions,
        conversions: cm.conversions,
        roas: cm.spend > 0 && cm.revenue > 0 ? cm.revenue / cm.spend : null,
        ctr: cm.impressions > 0 ? (cm.clicks / cm.impressions) * 100 : null,
        cpa: cm.conversions > 0 ? cm.spend / cm.conversions : null,
      };
    });
    const hasMockData = campaigns.some((c) => {
      const snapshot = c.metrics_snapshot as { source?: string } | null;
      return snapshot?.source === "mock_seed";
    });

    const dailyData = Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({ date, ...data }));

    setMetrics({
      totalSpend,
      totalRevenue,
      totalClicks,
      totalImpressions,
      totalConversions,
      overallRoas: totalSpend > 0 && totalRevenue > 0 ? totalRevenue / totalSpend : null,
      overallCtr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : null,
      overallCpc: totalClicks > 0 ? totalSpend / totalClicks : null,
      overallCpa: totalConversions > 0 ? totalSpend / totalConversions : null,
      dailyData,
      campaignsList,
      byPlatform: platformMetrics,
      hasData: metricRows.length > 0,
      hasMockData,
    });
    setLoading(false);
  }, [user, days]);

  useEffect(() => { fetchMetrics(); }, [fetchMetrics]);

  return { metrics, loading, refetch: fetchMetrics };
};
