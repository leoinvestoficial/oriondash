// Helper pra gravar entradas em ai_call_log.
// Edge functions usam service_role, então bypassam RLS no INSERT.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import type { AiCallLogEntry } from "./types.ts";

let cachedClient: ReturnType<typeof createClient> | null = null;

function getServiceClient() {
  if (cachedClient) return cachedClient;
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) throw new Error("SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausente");
  cachedClient = createClient(url, key);
  return cachedClient;
}

/**
 * Log fire-and-forget. Falhas em logging não devem derrubar a request principal.
 */
export async function logAiCall(entry: AiCallLogEntry): Promise<void> {
  try {
    const client = getServiceClient();
    const { error } = await client.from("ai_call_log").insert({
      user_id: entry.user_id,
      call_type: entry.call_type,
      provider: entry.provider,
      model: entry.model ?? null,
      agent: entry.agent ?? null,
      tokens_in: entry.tokens_in ?? null,
      tokens_out: entry.tokens_out ?? null,
      cost_usd: entry.cost_usd ?? null,
      latency_ms: entry.latency_ms ?? null,
      status: entry.status ?? "success",
      error_message: entry.error_message ?? null,
      request_id: entry.request_id ?? null,
      metadata: entry.metadata ?? {},
    });
    if (error) console.error("logAiCall error", error.message);
  } catch (e) {
    console.error("logAiCall exception", e instanceof Error ? e.message : String(e));
  }
}
