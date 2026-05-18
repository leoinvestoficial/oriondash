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

interface OAuthCreds {
  client_id: string;
  client_secret: string;
  extra_config: Record<string, string>;
}

const encoder = new TextEncoder();

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
  return atob(normalized + padding);
}

async function signState(payload: string) {
  const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!secret) throw new Error("Missing signing secret");

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function exchangeMetaToken(code: string, redirectUri: string, creds: OAuthCreds): Promise<TokenExchangeResult> {
  const { client_id: clientId, client_secret: clientSecret } = creds;

  const tokenRes = await fetch("https://graph.facebook.com/v19.0/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, code }),
  });
  const tokenData = await tokenRes.json();
  if (tokenData.error) throw new Error(tokenData.error.message);

  const longRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${tokenData.access_token}`);
  const longData = await longRes.json();

  const accountsRes = await fetch(`https://graph.facebook.com/v19.0/me/adaccounts?fields=name,account_id,account_status&access_token=${longData.access_token || tokenData.access_token}`);
  const accountsData = await accountsRes.json();
  const firstAccount = accountsData.data?.[0];

  return {
    accessToken: longData.access_token || tokenData.access_token,
    refreshToken: longData.access_token,
    accountId: firstAccount?.account_id || null,
    accountName: firstAccount?.name || "Meta Ads",
    expiresIn: longData.expires_in || 5184000,
    metadata: { accounts: accountsData.data || [] },
  };
}

async function exchangeGoogleToken(code: string, redirectUri: string, creds: OAuthCreds): Promise<TokenExchangeResult> {
  const { client_id: clientId, client_secret: clientSecret, extra_config } = creds;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: "authorization_code" }),
  });
  const tokenData = await tokenRes.json();
  if (tokenData.error) throw new Error(tokenData.error_description || tokenData.error);

  const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const userData = await userRes.json();

  const developerToken = extra_config?.developer_token;
  let customers: unknown[] = [];
  if (developerToken) {
    try {
      const custRes = await fetch("https://googleads.googleapis.com/v16/customers:listAccessibleCustomers", {
        headers: { Authorization: `Bearer ${tokenData.access_token}`, "developer-token": developerToken },
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

async function exchangeTikTokToken(code: string, _redirectUri: string, creds: OAuthCreds): Promise<TokenExchangeResult> {
  const { client_id: appId, client_secret: appSecret } = creds;

  const tokenRes = await fetch("https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ app_id: appId, secret: appSecret, auth_code: code }),
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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { code, state, redirectUri } = await req.json();

    if (!code || !state) {
      return new Response(JSON.stringify({ error: "Código ou state ausente" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let stateData: { userId: string; platform: string; ts: number };
    try {
      const [encodedPayload, signature] = state.split(".");
      if (!encodedPayload || !signature) throw new Error("invalid_state_format");

      const payload = fromBase64Url(encodedPayload);
      const expectedSignature = await signState(payload);
      if (signature !== expectedSignature) throw new Error("invalid_state_signature");

      stateData = JSON.parse(payload);
    } catch {
      return new Response(JSON.stringify({ error: "State inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (Date.now() - stateData.ts > 600000) {
      return new Response(JSON.stringify({ error: "State expirado, tente novamente" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { platform, userId } = stateData;

    if (userId !== user.id) {
      return new Response(JSON.stringify({ error: "State não corresponde ao usuário autenticado" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load user's OAuth credentials from DB
    const { data: creds } = await supabase
      .from("oauth_credentials")
      .select("client_id, client_secret, extra_config")
      .eq("user_id", userId)
      .eq("platform", platform)
      .maybeSingle();

    if (!creds) {
      return new Response(JSON.stringify({ error: "Credenciais OAuth não encontradas" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Exchange token based on platform
    let result: TokenExchangeResult;
    if (platform === "meta_ads") {
      result = await exchangeMetaToken(code, redirectUri, creds as OAuthCreds);
    } else if (platform === "google_ads") {
      result = await exchangeGoogleToken(code, redirectUri, creds as OAuthCreds);
    } else if (platform === "tiktok_ads") {
      result = await exchangeTikTokToken(code, redirectUri, creds as OAuthCreds);
    } else {
      return new Response(JSON.stringify({ error: "Plataforma desconhecida" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Store in ad_integrations
    const { data: existing } = await supabase
      .from("ad_integrations")
      .select("id")
      .eq("user_id", userId)
      .eq("platform", platform)
      .maybeSingle();

    const integrationData = {
      access_token: result.accessToken,
      refresh_token: result.refreshToken || null,
      account_id: result.accountId || null,
      account_name: result.accountName || null,
      status: "connected",
      metadata: result.metadata || {},
      token_expires_at: result.expiresIn ? new Date(Date.now() + result.expiresIn * 1000).toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      await supabase.from("ad_integrations").update(integrationData).eq("id", existing.id);
    } else {
      await supabase.from("ad_integrations").insert({ ...integrationData, user_id: userId, platform });
    }

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
