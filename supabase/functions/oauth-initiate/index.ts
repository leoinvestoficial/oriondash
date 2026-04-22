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
}> = {
  meta_ads: {
    authUrl: "https://www.facebook.com/v19.0/dialog/oauth",
    scopes: "ads_management,ads_read,read_insights,business_management",
  },
  google_ads: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    scopes: "https://www.googleapis.com/auth/adwords",
  },
  tiktok_ads: {
    authUrl: "https://business-api.tiktok.com/portal/auth",
    scopes: "",
  },
};

const encoder = new TextEncoder();

const toBase64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");

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
  return toBase64Url(new Uint8Array(signature));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { platform, redirectUri } = await req.json();

    if (!platform || !PLATFORM_CONFIG[platform]) {
      return new Response(JSON.stringify({ error: "Plataforma inválida" }), {
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

    // Load credentials from oauth_credentials table (per-user)
    const { data: creds, error: credsError } = await supabase
      .from("oauth_credentials")
      .select("client_id, client_secret, extra_config")
      .eq("user_id", user.id)
      .eq("platform", platform)
      .maybeSingle();

    if (credsError || !creds) {
      return new Response(JSON.stringify({ error: `Credenciais de ${platform} não configuradas. Acesse Integrações para configurar.` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const clientId = creds.client_id;
    const config = PLATFORM_CONFIG[platform];

    // Create state token with user ID for security
    const payload = JSON.stringify({ userId: user.id, platform, ts: Date.now() });
    const encodedPayload = toBase64Url(encoder.encode(payload));
    const signature = await signState(payload);
    const state = `${encodedPayload}.${signature}`;

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
