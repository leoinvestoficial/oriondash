import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// ===== META ADS SYNC =====
async function syncMetaAds(integration: any) {
  const { access_token, account_id, user_id, id: integrationId } = integration;
  if (!access_token || !account_id) return { synced: 0 };

  const actId = account_id.startsWith("act_") ? account_id : `act_${account_id}`;

  // Get campaigns
  const campRes = await fetch(
    `https://graph.facebook.com/v19.0/${actId}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time&access_token=${access_token}`
  );
  const campData = await campRes.json();
  if (campData.error) throw new Error(`Meta API: ${campData.error.message}`);

  let synced = 0;
  const today = new Date().toISOString().split("T")[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];

  for (const camp of campData.data || []) {
    // Upsert campaign
    const { data: existingCamp } = await supabase
      .from("campaigns")
      .select("id")
      .eq("user_id", user_id)
      .eq("external_id", camp.id)
      .eq("platform", "meta_ads")
      .maybeSingle();

    const campRow = {
      user_id,
      integration_id: integrationId,
      platform: "meta_ads",
      external_id: camp.id,
      name: camp.name,
      status: camp.status?.toLowerCase() === "active" ? "active" : camp.status?.toLowerCase() || "paused",
      objective: camp.objective || null,
      budget_daily: camp.daily_budget ? Number(camp.daily_budget) / 100 : null,
      budget_total: camp.lifetime_budget ? Number(camp.lifetime_budget) / 100 : null,
      start_date: camp.start_time ? camp.start_time.split("T")[0] : null,
      end_date: camp.stop_time ? camp.stop_time.split("T")[0] : null,
    };

    let campaignId: string;
    if (existingCamp) {
      await supabase.from("campaigns").update(campRow).eq("id", existingCamp.id);
      campaignId = existingCamp.id;
    } else {
      const { data: newCamp } = await supabase.from("campaigns").insert(campRow).select("id").single();
      campaignId = newCamp!.id;
    }

    // Get insights for last 7 days
    const insightsRes = await fetch(
      `https://graph.facebook.com/v19.0/${camp.id}/insights?fields=spend,impressions,clicks,actions,cpc,ctr,cost_per_action_type&time_range={"since":"${sevenDaysAgo}","until":"${today}"}&time_increment=1&access_token=${access_token}`
    );
    const insightsData = await insightsRes.json();

    for (const day of insightsData.data || []) {
      const conversions = day.actions?.find((a: any) => a.action_type === "offsite_conversion.fb_pixel_purchase")?.value
        || day.actions?.find((a: any) => a.action_type === "lead")?.value || 0;
      const revenue = Number(conversions) * 100; // Placeholder — real revenue from purchase value
      const spend = Number(day.spend || 0);

      const metrics = {
        campaign_id: campaignId,
        user_id,
        date: day.date_start,
        spend,
        impressions: Number(day.impressions || 0),
        clicks: Number(day.clicks || 0),
        conversions: Number(conversions),
        revenue,
        cpc: day.cpc ? Number(day.cpc) : null,
        ctr: day.ctr ? Number(day.ctr) : null,
        cpa: spend > 0 && Number(conversions) > 0 ? spend / Number(conversions) : null,
        roas: spend > 0 && revenue > 0 ? revenue / spend : null,
      };

      // Upsert by campaign_id + date
      const { data: existingMetric } = await supabase
        .from("campaign_metrics")
        .select("id")
        .eq("campaign_id", campaignId)
        .eq("date", day.date_start)
        .maybeSingle();

      if (existingMetric) {
        await supabase.from("campaign_metrics").update(metrics).eq("id", existingMetric.id);
      } else {
        await supabase.from("campaign_metrics").insert(metrics);
      }
      synced++;
    }

    // Update campaign metrics_snapshot with latest totals
    const { data: latestMetrics } = await supabase
      .from("campaign_metrics")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("date", { ascending: false })
      .limit(7);

    if (latestMetrics?.length) {
      const totalSpend = latestMetrics.reduce((s, m) => s + Number(m.spend), 0);
      const totalClicks = latestMetrics.reduce((s, m) => s + m.clicks, 0);
      const totalImpressions = latestMetrics.reduce((s, m) => s + m.impressions, 0);
      const totalConversions = latestMetrics.reduce((s, m) => s + m.conversions, 0);
      const totalRevenue = latestMetrics.reduce((s, m) => s + Number(m.revenue), 0);

      await supabase.from("campaigns").update({
        metrics_snapshot: {
          spend_7d: totalSpend,
          clicks_7d: totalClicks,
          impressions_7d: totalImpressions,
          conversions_7d: totalConversions,
          revenue_7d: totalRevenue,
          ctr: totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : null,
          cpc: totalClicks > 0 ? (totalSpend / totalClicks).toFixed(2) : null,
          cpa: totalConversions > 0 ? (totalSpend / totalConversions).toFixed(2) : null,
          roas: totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(2) : null,
          last_sync: new Date().toISOString(),
        },
      }).eq("id", campaignId);
    }
  }

  return { synced, campaigns: campData.data?.length || 0 };
}

// ===== GOOGLE ADS SYNC =====
async function syncGoogleAds(integration: any) {
  const { access_token, refresh_token, account_id, user_id, id: integrationId } = integration;
  if (!access_token) return { synced: 0 };

  // Refresh token if needed
  let currentToken = access_token;
  if (refresh_token) {
    const clientId = Deno.env.get("GOOGLE_ADS_CLIENT_ID")!;
    const clientSecret = Deno.env.get("GOOGLE_ADS_CLIENT_SECRET")!;
    const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        refresh_token,
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "refresh_token",
      }),
    });
    const refreshData = await refreshRes.json();
    if (refreshData.access_token) {
      currentToken = refreshData.access_token;
      await supabase.from("ad_integrations").update({ access_token: currentToken }).eq("id", integrationId);
    }
  }

  const developerToken = Deno.env.get("GOOGLE_ADS_DEVELOPER_TOKEN");
  if (!developerToken || !account_id) return { synced: 0, note: "Developer token ou account_id ausente" };

  const today = new Date().toISOString().split("T")[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];

  // GAQL query for campaigns with metrics
  const query = `
    SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type,
           metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.conversions, metrics.conversions_value,
           metrics.ctr, metrics.average_cpc, metrics.cost_per_conversion,
           segments.date
    FROM campaign
    WHERE segments.date BETWEEN '${sevenDaysAgo}' AND '${today}'
    ORDER BY segments.date DESC
  `;

  const searchRes = await fetch(
    `https://googleads.googleapis.com/v16/customers/${account_id}/googleAds:searchStream`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${currentToken}`,
        "developer-token": developerToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    }
  );
  const searchData = await searchRes.json();

  let synced = 0;
  const results = Array.isArray(searchData) ? searchData : searchData.results ? [searchData] : [];

  for (const batch of results) {
    for (const row of batch.results || []) {
      const camp = row.campaign;
      const met = row.metrics;
      const date = row.segments?.date;

      // Upsert campaign
      const { data: existingCamp } = await supabase
        .from("campaigns").select("id")
        .eq("user_id", user_id).eq("external_id", String(camp.id)).eq("platform", "google_ads")
        .maybeSingle();

      let campaignId: string;
      const campRow = {
        user_id, integration_id: integrationId, platform: "google_ads",
        external_id: String(camp.id), name: camp.name,
        status: camp.status === "ENABLED" ? "active" : "paused",
        objective: camp.advertisingChannelType || null,
      };

      if (existingCamp) {
        await supabase.from("campaigns").update(campRow).eq("id", existingCamp.id);
        campaignId = existingCamp.id;
      } else {
        const { data: newCamp } = await supabase.from("campaigns").insert(campRow).select("id").single();
        campaignId = newCamp!.id;
      }

      const spend = (met.costMicros || 0) / 1_000_000;
      const conversions = met.conversions || 0;
      const revenue = met.conversionsValue || 0;

      const metrics = {
        campaign_id: campaignId, user_id, date,
        spend, impressions: met.impressions || 0, clicks: met.clicks || 0,
        conversions, revenue,
        cpc: met.averageCpc ? met.averageCpc / 1_000_000 : null,
        ctr: met.ctr ? met.ctr * 100 : null,
        cpa: met.costPerConversion ? met.costPerConversion / 1_000_000 : null,
        roas: spend > 0 && revenue > 0 ? revenue / spend : null,
      };

      const { data: existingMetric } = await supabase
        .from("campaign_metrics").select("id")
        .eq("campaign_id", campaignId).eq("date", date).maybeSingle();

      if (existingMetric) {
        await supabase.from("campaign_metrics").update(metrics).eq("id", existingMetric.id);
      } else {
        await supabase.from("campaign_metrics").insert(metrics);
      }
      synced++;
    }
  }

  return { synced };
}

// ===== TIKTOK ADS SYNC =====
async function syncTikTokAds(integration: any) {
  const { access_token, user_id, id: integrationId, metadata } = integration;
  if (!access_token) return { synced: 0 };

  const advertiserIds = (metadata as any)?.advertiser_ids || [];
  if (!advertiserIds.length) return { synced: 0, note: "Nenhum advertiser_id" };

  const advertiserId = advertiserIds[0];
  const today = new Date().toISOString().split("T")[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];

  // Get campaigns
  const campRes = await fetch(
    `https://business-api.tiktok.com/open_api/v1.3/campaign/get/?advertiser_id=${advertiserId}&page_size=100`,
    { headers: { "Access-Token": access_token } }
  );
  const campData = await campRes.json();

  let synced = 0;
  for (const camp of campData.data?.list || []) {
    const { data: existingCamp } = await supabase
      .from("campaigns").select("id")
      .eq("user_id", user_id).eq("external_id", String(camp.campaign_id)).eq("platform", "tiktok_ads")
      .maybeSingle();

    const campRow = {
      user_id, integration_id: integrationId, platform: "tiktok_ads",
      external_id: String(camp.campaign_id), name: camp.campaign_name,
      status: camp.status === "CAMPAIGN_STATUS_ENABLE" ? "active" : "paused",
      objective: camp.objective_type || null,
      budget_daily: camp.budget || null,
    };

    let campaignId: string;
    if (existingCamp) {
      await supabase.from("campaigns").update(campRow).eq("id", existingCamp.id);
      campaignId = existingCamp.id;
    } else {
      const { data: newCamp } = await supabase.from("campaigns").insert(campRow).select("id").single();
      campaignId = newCamp!.id;
    }

    // Get metrics
    const metricsRes = await fetch(
      `https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/`,
      {
        method: "POST",
        headers: { "Access-Token": access_token, "Content-Type": "application/json" },
        body: JSON.stringify({
          advertiser_id: advertiserId,
          report_type: "BASIC",
          dimensions: ["campaign_id", "stat_time_day"],
          data_level: "AUCTION_CAMPAIGN",
          start_date: sevenDaysAgo,
          end_date: today,
          metrics: ["spend", "impressions", "clicks", "conversion", "cpc", "ctr", "cost_per_conversion"],
          filters: [{ field_name: "campaign_ids", filter_type: "IN", filter_value: JSON.stringify([camp.campaign_id]) }],
        }),
      }
    );
    const metricsData = await metricsRes.json();

    for (const row of metricsData.data?.list || []) {
      const m = row.metrics;
      const date = row.dimensions?.stat_time_day?.split(" ")[0];
      if (!date) continue;

      const spend = Number(m.spend || 0);
      const conversions = Number(m.conversion || 0);

      const metricRow = {
        campaign_id: campaignId, user_id, date,
        spend, impressions: Number(m.impressions || 0), clicks: Number(m.clicks || 0),
        conversions, revenue: 0,
        cpc: m.cpc ? Number(m.cpc) : null,
        ctr: m.ctr ? Number(m.ctr) * 100 : null,
        cpa: m.cost_per_conversion ? Number(m.cost_per_conversion) : null,
        roas: null,
      };

      const { data: existing } = await supabase
        .from("campaign_metrics").select("id")
        .eq("campaign_id", campaignId).eq("date", date).maybeSingle();

      if (existing) {
        await supabase.from("campaign_metrics").update(metricRow).eq("id", existing.id);
      } else {
        await supabase.from("campaign_metrics").insert(metricRow);
      }
      synced++;
    }
  }

  return { synced };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Can be called per-user or as a cron for all users
    const body = await req.json().catch(() => ({}));
    const targetUserId = body.userId;

    // Build query for connected integrations
    let query = supabase.from("ad_integrations").select("*").eq("status", "connected");
    if (targetUserId) query = query.eq("user_id", targetUserId);

    const { data: integrations, error } = await query;
    if (error) throw error;
    if (!integrations?.length) {
      return new Response(JSON.stringify({ message: "Nenhuma integração conectada" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: Record<string, any> = {};

    for (const integration of integrations) {
      try {
        if (integration.platform === "meta_ads") {
          results[`meta_${integration.id}`] = await syncMetaAds(integration);
        } else if (integration.platform === "google_ads") {
          results[`google_${integration.id}`] = await syncGoogleAds(integration);
        } else if (integration.platform === "tiktok_ads") {
          results[`tiktok_${integration.id}`] = await syncTikTokAds(integration);
        }
      } catch (err) {
        console.error(`Sync error for ${integration.platform}:`, err);
        results[`${integration.platform}_${integration.id}`] = { error: err.message };

        // If token expired, mark as needs_reauth
        if (err.message?.includes("expired") || err.message?.includes("OAuthException")) {
          await supabase.from("ad_integrations").update({ status: "expired" }).eq("id", integration.id);
        }
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Sync error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
