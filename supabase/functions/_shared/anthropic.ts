// Wrapper da Anthropic Messages API com streaming.
//
// CRÍTICO: o frontend (src/lib/chatStream.ts) espera SSE no formato OpenAI:
//   data: {"choices":[{"delta":{"content":"..."}}]}
//   data: [DONE]
//
// A Anthropic API retorna formato diferente:
//   event: content_block_delta
//   data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"..."}}
//
// Esse wrapper consome o stream da Anthropic e re-emite no formato OpenAI,
// pra não quebrar o parser existente do frontend.

import type { ChatMessage } from "./types.ts";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

// Modelo padrão. Se mudar pra outro Claude, manter aqui (string única source of truth).
export const DEFAULT_MODEL = "claude-sonnet-4-5-20250929";

// Custos em USD por 1M tokens (input/output). Atualizar se Anthropic mudar.
const MODEL_COSTS: Record<string, { in: number; out: number }> = {
  "claude-sonnet-4-5-20250929": { in: 3.00, out: 15.00 },
  "claude-haiku-4-5-20251001": { in: 1.00, out: 5.00 },
  // fallback genérico
  default: { in: 3.00, out: 15.00 },
};

export function estimateAnthropicCost(model: string, tokensIn: number, tokensOut: number): number {
  const c = MODEL_COSTS[model] ?? MODEL_COSTS.default;
  return (tokensIn / 1_000_000) * c.in + (tokensOut / 1_000_000) * c.out;
}

export interface AnthropicCallParams {
  systemPrompt: string;
  messages: ChatMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

// Mensagem com suporte a vision: pode ser texto puro OU array com blocos image+text.
// Anthropic API aceita content como string ou como array de content blocks.
export type VisionContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; source: { type: "base64"; media_type: string; data: string } }
  | { type: "image"; source: { type: "url"; url: string } };

export interface VisionMessage {
  role: "user" | "assistant";
  content: string | VisionContentBlock[];
}

export interface AnthropicVisionParams {
  systemPrompt: string;
  messages: VisionMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

// Chamada non-streaming com suporte a vision (para analyze-brand-visuals).
// Diferença do callAnthropic: aceita content blocks com imagens.
export async function callAnthropicVision(params: AnthropicVisionParams): Promise<AnthropicNonStreamResult> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY não configurada nos secrets do Supabase");

  const model = params.model ?? DEFAULT_MODEL;
  const body = {
    model,
    max_tokens: params.maxTokens ?? 2048,
    temperature: params.temperature ?? 0.3,  // mais baixo pra extração estruturada
    system: params.systemPrompt,
    messages: params.messages,
  };

  const resp = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    throw new Error(`Anthropic vision ${resp.status}: ${errText.slice(0, 300)}`);
  }

  const data = await resp.json();
  const text = (data?.content ?? [])
    .filter((block: { type: string }) => block.type === "text")
    .map((block: { text: string }) => block.text)
    .join("");
  const tokensIn = data?.usage?.input_tokens ?? 0;
  const tokensOut = data?.usage?.output_tokens ?? 0;

  return {
    text,
    tokensIn,
    tokensOut,
    costUsd: estimateAnthropicCost(model, tokensIn, tokensOut),
    model,
    stopReason: data?.stop_reason ?? null,
  };
}

export interface AnthropicNonStreamResult {
  text: string;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  model: string;
  stopReason: string | null;
}

// Chamada non-streaming — usada quando o caller quer o texto completo (ex: análise interna).
export async function callAnthropic(params: AnthropicCallParams): Promise<AnthropicNonStreamResult> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY não configurada nos secrets do Supabase");

  const model = params.model ?? DEFAULT_MODEL;
  const body = {
    model,
    max_tokens: params.maxTokens ?? 2048,
    temperature: params.temperature ?? 0.7,
    system: params.systemPrompt,
    messages: params.messages.filter((m) => m.role !== "system").map((m) => ({
      role: m.role,
      content: m.content,
    })),
  };

  const resp = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    throw new Error(`Anthropic ${resp.status}: ${errText.slice(0, 300)}`);
  }

  const data = await resp.json();
  const text = (data?.content ?? [])
    .filter((block: { type: string }) => block.type === "text")
    .map((block: { text: string }) => block.text)
    .join("");
  const tokensIn = data?.usage?.input_tokens ?? 0;
  const tokensOut = data?.usage?.output_tokens ?? 0;

  return {
    text,
    tokensIn,
    tokensOut,
    costUsd: estimateAnthropicCost(model, tokensIn, tokensOut),
    model,
    stopReason: data?.stop_reason ?? null,
  };
}

// ----- Streaming + conversão Anthropic SSE → OpenAI SSE -----

/**
 * Faz streaming da Anthropic e retorna um ReadableStream<Uint8Array> já convertido
 * pro formato OpenAI-compatible que o frontend espera.
 *
 * Também invoca onUsage(tokensIn, tokensOut) ao final, pra que o caller possa logar
 * em ai_call_log.
 */
export async function streamAnthropicAsOpenAI(params: AnthropicCallParams & {
  onUsage?: (usage: { tokensIn: number; tokensOut: number; model: string; costUsd: number }) => void;
  onError?: (err: Error) => void;
}): Promise<ReadableStream<Uint8Array>> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY não configurada nos secrets do Supabase");

  const model = params.model ?? DEFAULT_MODEL;
  const body = {
    model,
    max_tokens: params.maxTokens ?? 2048,
    temperature: params.temperature ?? 0.7,
    stream: true,
    system: params.systemPrompt,
    messages: params.messages.filter((m) => m.role !== "system").map((m) => ({
      role: m.role,
      content: m.content,
    })),
  };

  const resp = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok || !resp.body) {
    const errText = await resp.text().catch(() => "");
    throw new Error(`Anthropic stream ${resp.status}: ${errText.slice(0, 300)}`);
  }

  const sourceReader = resp.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  let tokensIn = 0;
  let tokensOut = 0;
  let buffer = "";

  // Helper pra emitir chunk no formato OpenAI.
  const openaiChunk = (content: string): Uint8Array => {
    const chunk = {
      choices: [{ delta: { content } }],
    };
    return encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`);
  };

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await sourceReader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Anthropic SSE: eventos separados por \n\n.
          let separatorIdx: number;
          while ((separatorIdx = buffer.indexOf("\n\n")) !== -1) {
            const rawEvent = buffer.slice(0, separatorIdx);
            buffer = buffer.slice(separatorIdx + 2);

            // Cada evento tem linhas "event: X" e "data: {...}".
            const dataLine = rawEvent.split("\n").find((l) => l.startsWith("data: "));
            if (!dataLine) continue;

            const dataStr = dataLine.slice(6).trim();
            if (!dataStr) continue;

            try {
              const parsed = JSON.parse(dataStr);

              // content_block_delta com text_delta = chunk de texto.
              if (parsed.type === "content_block_delta" && parsed.delta?.type === "text_delta") {
                const text = parsed.delta.text as string;
                if (text) controller.enqueue(openaiChunk(text));
              }

              // message_start traz input_tokens.
              if (parsed.type === "message_start" && parsed.message?.usage?.input_tokens) {
                tokensIn = parsed.message.usage.input_tokens;
              }

              // message_delta traz output_tokens incremental.
              if (parsed.type === "message_delta" && parsed.usage?.output_tokens) {
                tokensOut = parsed.usage.output_tokens;
              }

              // message_stop = fim da mensagem.
              if (parsed.type === "message_stop") {
                // emite [DONE] no formato OpenAI.
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                params.onUsage?.({
                  tokensIn,
                  tokensOut,
                  model,
                  costUsd: estimateAnthropicCost(model, tokensIn, tokensOut),
                });
              }
            } catch (e) {
              // JSON parse error: provavelmente chunk truncado. Reinjetar no buffer
              // não é trivial — Anthropic separa eventos por \n\n então se chegou aqui
              // o evento estava completo mas o JSON estava malformado. Pular.
              console.error("anthropic parse error", e, dataStr.slice(0, 200));
            }
          }
        }
        controller.close();
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        params.onError?.(error);
        controller.error(error);
      }
    },
    cancel() {
      sourceReader.cancel().catch(() => {});
    },
  });
}
