import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const PLATFORM_CONFIG: Record<string, {
  authUrl: string;
  scopes: string;
  clientIdEnv: string;
  extraParams?: Record<string, string>;
}> = {
  meta_ads: {
    authUrl: "https://www.facebook.com/v19.0/dialog/oauth",
    scopes: "ads_management,ads_read,read_insights,business_management",
    clientIdEnv: "META_ADS_CLIENT_ID",
  },
  google_ads: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    scopes: "https://www.googleapis.com/auth/adwords",
    clientIdEnv: "GOOGLE_ADS_CLIENT_ID",
    extraParams: { access_type: "offline", prompt: "consent" },
  },
  tiktok_ads: {
    authUrl: "https://business-api.tiktok.com/portal/auth",
    scopes: "",
    clientIdEnv: "TIKTOK_ADS_APP_ID",
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { platform, redirectUri } = await req.json();

    if (!platform || !PLATFORM_CONFIG[platform]) {
      return new Response(JSON.stringify({ error: "Platform inválida" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
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
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return new Response(JSON.stringify({ error: "Usuário inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const config = PLATFORM_CONFIG[platform];
    const clientId = Deno.env.get(config.clientIdEnv);
    if (!clientId) {
      return new Response(JSON.stringify({ error: `Credenciais de ${platform} não configuradas. Configure ${config.clientIdEnv} nas secrets.` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create state token with user ID for security
    const state = btoa(JSON.stringify({ userId: user.id, platform, ts: Date.now() }));

    let authorizationUrl: string;

    if (platform === "meta_ads") {
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: config.scopes,
        response_type: "code",
        state,
      });
      authorizationUrl = `${config.authUrl}?${params}`;
    } else if (platform === "google_ads") {
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: config.scopes,
        response_type: "code",
        state,
        access_type: "offline",
        prompt: "consent",
      });
      authorizationUrl = `${config.authUrl}?${params}`;
    } else if (platform === "tiktok_ads") {
      const params = new URLSearchParams({
        app_id: clientId,
        redirect_uri: redirectUri,
        state,
      });
      authorizationUrl = `${config.authUrl}?${params}`;
    } else {
      return new Response(JSON.stringify({ error: "Plataforma não suportada" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ url: authorizationUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("OAuth initiate error:", error);
    return new Response(JSON.stringify({ error: "Erro interno ao iniciar OAuth" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
