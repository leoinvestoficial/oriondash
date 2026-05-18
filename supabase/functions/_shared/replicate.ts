// Wrapper de Replicate API pra geração de imagens.
// Modelos suportados (FLUX da Black Forest Labs — qualidade comercial, custo razoável):
//   - flux-schnell: rascunho rápido (~3s, US$ 0.003/img). Default pra primeira passada.
//   - flux-dev:     final de qualidade superior (~10s, US$ 0.025/img). Pra peças aprovadas.
//   - flux-1.1-pro: top quality (~15s, US$ 0.04/img). Pra hero shots da campanha.
//
// Replicate API tem 2 modos: sync (espera completar) e async (poll). Usamos sync com
// `Prefer: wait` que faz a request bloquear até completar — mais simples, OK pra schnell.

const REPLICATE_API_BASE = "https://api.replicate.com/v1";

// Versões fixadas dos modelos (pinning evita breaking changes silenciosos).
// Ver versões em https://replicate.com/black-forest-labs/<model>/versions
const MODELS = {
  schnell: "black-forest-labs/flux-schnell",
  dev: "black-forest-labs/flux-dev",
  pro: "black-forest-labs/flux-1.1-pro",
} as const;

export type ReplicateModelKey = keyof typeof MODELS;

export type ImageFormat = "1:1" | "9:16" | "16:9" | "4:5";

const COST_PER_IMAGE: Record<ReplicateModelKey, number> = {
  schnell: 0.003,
  dev: 0.025,
  pro: 0.04,
};

export interface GenerateImageParams {
  prompt: string;
  format?: ImageFormat;
  model?: ReplicateModelKey;
  numOutputs?: number;
  seed?: number;
  // Negative/avoid prompt — FLUX schnell ignora; dev/pro usam.
  vetoText?: string;
}

export interface GenerateImageResult {
  imageUrls: string[];      // URLs públicas TEMPORÁRIAS no Replicate (expiram em ~1h)
  model: string;
  costUsdPerImage: number;
  totalCostUsd: number;
}

export async function generateImages(params: GenerateImageParams): Promise<GenerateImageResult> {
  const apiKey = Deno.env.get("REPLICATE_API_TOKEN");
  if (!apiKey) throw new Error("REPLICATE_API_TOKEN não configurado nos secrets");

  const modelKey = params.model ?? "schnell";
  const model = MODELS[modelKey];
  const aspectRatio = params.format ?? "1:1";
  const numOutputs = Math.min(params.numOutputs ?? 1, 4);

  // Input shape varia por modelo. FLUX schnell e dev aceitam basicamente o mesmo.
  const input: Record<string, unknown> = {
    prompt: params.prompt,
    aspect_ratio: aspectRatio,
    num_outputs: numOutputs,
    output_format: "webp",
    output_quality: 90,
  };

  if (params.seed !== undefined) input.seed = params.seed;
  if (params.vetoText && modelKey !== "schnell") {
    // schnell ignora negative prompt; só dev/pro
    input.negative_prompt = params.vetoText;
  }

  // Sync API: blocking até resultado disponível. Timeout default da Replicate é 60s.
  const resp = await fetch(`${REPLICATE_API_BASE}/models/${model}/predictions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Prefer: "wait=60",
    },
    body: JSON.stringify({ input }),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    throw new Error(`Replicate ${resp.status}: ${errText.slice(0, 300)}`);
  }

  const data = await resp.json();

  // Status pode ser "succeeded", "failed", "starting", "processing" (se demorou > 60s).
  if (data.status === "failed") {
    throw new Error(`Replicate generation failed: ${data.error ?? "unknown"}`);
  }
  if (data.status !== "succeeded") {
    // Demorou demais — fallback pra polling. Por simplicidade, só erra. Schnell é raro precisar.
    throw new Error(`Replicate ainda processando após 60s (status=${data.status}). Tente schnell ou aumente Prefer:wait.`);
  }

  const output = data.output;
  const imageUrls: string[] = Array.isArray(output) ? output : [output];

  return {
    imageUrls: imageUrls.filter((u): u is string => typeof u === "string"),
    model,
    costUsdPerImage: COST_PER_IMAGE[modelKey],
    totalCostUsd: COST_PER_IMAGE[modelKey] * imageUrls.length,
  };
}

// Helper: baixar uma URL temporária do Replicate como bytes.
// Usado pra mover a imagem do Replicate Storage pro nosso Supabase Storage.
export async function downloadImageBytes(url: string): Promise<Uint8Array> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Falha ao baixar imagem: ${resp.status}`);
  const buf = await resp.arrayBuffer();
  return new Uint8Array(buf);
}
