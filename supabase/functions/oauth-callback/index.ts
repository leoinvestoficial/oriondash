import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TokenExchangeResult {
  accessToken: string;
  refreshToken?: string;
  accountId?: string;
  accountName?: string;
  expiresIn?: number;
  metadata?: Record<string, unknown>;
}

async function exchangeMetaToken(code: string, redirectUri: string): Promise<TokenExchangeResult> {
  const clientId = Deno.env.get("META_ADS_CLIENT_ID")!;
  const clientSecret = Deno.env.get("META_ADS_CLIENT_SECRET")!;

  // Exchange code for short-lived token
  const tokenRes = await fetch("https://graph.facebook.com/v19.0/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      code,
    }),
  });
  const tokenData = await tokenRes.json();
  if (tokenData.error) throw new Error(tokenData.error.message);

  // Exchange for long-lived token
  const longRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${tokenData.access_token}`);
  const longData = await longRes.json();

  // Get ad accounts
  const accountsRes = await fetch(`https://graph.facebook.com/v19.0/me/adaccounts?fields=name,account_id,account_status&access_token=${longData.access_token || tokenData.access_token}`);
  const accountsData = await accountsRes.json();
  const firstAccount = accountsData.data?.[0];

  return {
    accessToken: longData.access_token || tokenData.access_token,
    refreshToken: longData.access_token, // Long-lived token serves as refresh
    accountId: firstAccount?.account_id || null,
    accountName: firstAccount?.name || "Meta Ads",
    expiresIn: longData.expires_in || 5184000, // ~60 days
    metadata: { accounts: accountsData.data || [] },
  };
}

async function exchangeGoogleToken(code: string, redirectUri: string): Promise<TokenExchangeResult> {
  const clientId = Deno.env.get("GOOGLE_ADS_CLIENT_ID")!;
  const clientSecret = Deno.env.get("GOOGLE_ADS_CLIENT_SECRET")!;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const tokenData = await tokenRes.json();
  if (tokenData.error) throw new Error(tokenData.error_description || tokenData.error);

  // Get user info for account name
  const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const userData = await userRes.json();

  // Try to get Google Ads customer IDs
  const developerToken = Deno.env.get("GOOGLE_ADS_DEVELOPER_TOKEN");
  let customers: unknown[] = [];
  if (developerToken) {
    try {
      const custRes = await fetch("https://googleads.googleapis.com/v16/customers:listAccessibleCustomers", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          "developer-token": developerToken,
        },
      });
      const custData = await custRes.json();
      customers = custData.resourceNames || [];
    } catch { /* optional */ }
  }

  return {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    accountId: customers[0]?.toString()?.replace("customers/", "") || null,
    accountName: userData.email || "Google Ads",
    expiresIn: tokenData.expires_in,
    metadata: { email: userData.email, customers },
  };
}

async function exchangeTikTokToken(code: string, _redirectUri: string): Promise<TokenExchangeResult> {
  const appId = Deno.env.get("TIKTOK_ADS_APP_ID")!;
  const appSecret = Deno.env.get("TIKTOK_ADS_APP_SECRET")!;

  const tokenRes = await fetch("https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      app_id: appId,
      secret: appSecret,
      auth_code: code,
    }),
  });
  const tokenData = await tokenRes.json();
  if (tokenData.code !== 0) throw new Error(tokenData.message || "TikTok OAuth failed");

  const data = tokenData.data;
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || null,
    accountId: data.advertiser_ids?.[0] || null,
    accountName: `TikTok Ads (${data.advertiser_ids?.length || 0} contas)`,
    expiresIn: data.expires_in,
    metadata: { advertiser_ids: data.advertiser_ids || [] },
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, state, redirectUri } = await req.json();

    if (!code || !state) {
      return new Response(JSON.stringify({ error: "Código ou state ausente" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse state
    let stateData: { userId: string; platform: string; ts: number };
    try {
      stateData = JSON.parse(atob(state));
    } catch {
      return new Response(JSON.stringify({ error: "State inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate state age (max 10 min)
    if (Date.now() - stateData.ts > 600000) {
      return new Response(JSON.stringify({ error: "State expirado, tente novamente" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { platform, userId } = stateData;

    // Exchange token based on platform
    let result: TokenExchangeResult;
    if (platform === "meta_ads") {
      result = await exchangeMetaToken(code, redirectUri);
    } else if (platform === "google_ads") {
      result = await exchangeGoogleToken(code, redirectUri);
    } else if (platform === "tiktok_ads") {
      result = await exchangeTikTokToken(code, redirectUri);
    } else {
      return new Response(JSON.stringify({ error: "Plataforma desconhecida" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Store in database
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Upsert: update if exists, insert if not
    const { data: existing } = await supabase
      .from("ad_integrations")
      .select("id")
      .eq("user_id", userId)
      .eq("platform", platform)
      .maybeSingle();

    if (existing) {
      await supabase.from("ad_integrations").update({
        access_token: result.accessToken,
        refresh_token: result.refreshToken || null,
        account_id: result.accountId || null,
        account_name: result.accountName || null,
        status: "connected",
        metadata: result.metadata || {},
        updated_at: new Date().toISOString(),
      }).eq("id", existing.id);
    } else {
      await supabase.from("ad_integrations").insert({
        user_id: userId,
        platform,
        access_token: result.accessToken,
        refresh_token: result.refreshToken || null,
        account_id: result.accountId || null,
        account_name: result.accountName || null,
        status: "connected",
        metadata: result.metadata || {},
      });
    }

    // Log business event
    await supabase.from("business_events").insert({
      user_id: userId,
      event_type: "integration_connected",
      title: `${platform} conectado`,
      description: `Conta ${result.accountName || platform} conectada via OAuth`,
      source: "oauth",
    });

    return new Response(JSON.stringify({
      success: true,
      platform,
      accountName: result.accountName,
      accountId: result.accountId,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("OAuth callback error:", error);
    return new Response(JSON.stringify({ error: error.message || "Erro ao trocar token OAuth" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
