import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MOCK_CAMPAIGNS = [
  { name: "BR | Conversão | Lookalike 1%", platform: "meta", objective: "conversions", budget_daily: 350, profile: "winning" },
  { name: "BR | Tráfego | Interesses Frio", platform: "meta", objective: "traffic", budget_daily: 220, profile: "fatigued" },
  { name: "BR | Search | Brand", platform: "google", objective: "conversions", budget_daily: 180, profile: "stable" },
  { name: "BR | YouTube | Awareness", platform: "google", objective: "awareness", budget_daily: 280, profile: "underperforming" },
];

const dayStr = (d: Date) => d.toISOString().slice(0, 10);
const rand = (min: number, max: number) => min + Math.random() * (max - min);

function generateRow(profile: string, daysAgo: number) {
  // last 7 days = recent, prev 7 = baseline
  const isRecent = daysAgo < 7;
  let baseCtr = 1.8, baseCpc = 1.6, baseCpa = 38, baseRoas = 2.8, baseSpend = 250;
  switch (profile) {
    case "winning":
      baseRoas = isRecent ? 4.2 : 3.4; baseCpa = isRecent ? 28 : 33; baseCtr = 2.6; baseSpend = 320; break;
    case "fatigued":
      baseCtr = isRecent ? 0.9 : 1.7; baseCpc = isRecent ? 2.4 : 1.5; baseRoas = isRecent ? 1.6 : 2.7; baseCpa = isRecent ? 62 : 38; baseSpend = 240; break;
    case "underperforming":
      baseRoas = isRecent ? 1.1 : 1.3; baseCpa = isRecent ? 95 : 82; baseCtr = 1.1; baseSpend = 280; break;
    case "stable":
    default:
      baseRoas = 3.2; baseCpa = 32; baseCtr = 2.1; baseSpend = 180; break;
  }
  const spend = +(baseSpend * rand(0.85, 1.15)).toFixed(2);
  const ctr = +(baseCtr * rand(0.9, 1.1)).toFixed(2);
  const cpc = +(baseCpc * rand(0.9, 1.1)).toFixed(2);
  const cpa = +(baseCpa * rand(0.9, 1.1)).toFixed(2);
  const roas = +(baseRoas * rand(0.9, 1.1)).toFixed(2);
  const impressions = Math.round(spend / Math.max(0.01, cpc / Math.max(0.001, ctr / 100)));
  const clicks = Math.round(impressions * (ctr / 100));
  const conversions = Math.max(0, Math.round(spend / cpa));
  const revenue = +(spend * roas).toFixed(2);
  return { spend, impressions, clicks, conversions, revenue, ctr, cpc, cpa, roas };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
    const userId = userData.user.id;

    let createdCampaigns = 0;
    let createdMetrics = 0;
    const today = new Date();

    for (const cfg of MOCK_CAMPAIGNS) {
      const { data: existing } = await supabase
        .from("campaigns")
        .select("id")
        .eq("user_id", userId)
        .eq("name", cfg.name)
        .maybeSingle();

      let campaignId = existing?.id;
      if (!campaignId) {
        const { data: created, error } = await supabase
          .from("campaigns")
          .insert({
            user_id: userId,
            name: cfg.name,
            platform: cfg.platform,
            objective: cfg.objective,
            budget_daily: cfg.budget_daily,
            status: "active",
            metrics_snapshot: { source: "mock_seed" },
          })
          .select()
          .single();
        if (error) throw error;
        campaignId = created.id;
        createdCampaigns++;
      }

      // Wipe previous mock data for last 14 days
      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 14);
      await supabase
        .from("campaign_metrics")
        .delete()
        .eq("campaign_id", campaignId)
        .gte("date", dayStr(startDate));

      const rows = [];
      for (let d = 0; d < 14; d++) {
        const date = new Date(today);
        date.setDate(date.getDate() - d);
        rows.push({
          user_id: userId,
          campaign_id: campaignId,
          date: dayStr(date),
          ...generateRow(cfg.profile, d),
        });
      }
      const { error: mErr } = await supabase.from("campaign_metrics").insert(rows);
      if (mErr) throw mErr;
      createdMetrics += rows.length;
    }

    return new Response(JSON.stringify({
      success: true,
      campaigns_created: createdCampaigns,
      metrics_inserted: createdMetrics,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("seed-mock-metrics error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
