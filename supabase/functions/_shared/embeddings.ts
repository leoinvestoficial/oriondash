// Wrapper de embeddings via OpenAI text-embedding-3-large com dimensions=1536.
// Custo: ~US$ 0.00013 / 1k tokens. Latência típica: 100-300ms.
//
// Decisão de dimensions: nativa é 3072. Reduzimos pra 1536 pra:
//   1) reduzir storage por linha (8KB → 4KB)
//   2) acelerar IVFFlat search ~30%
//   3) encaixar no índice ivfflat com lists=100 sem warning
// OpenAI documenta que 1536 mantém ~99% da qualidade do 3072.

const OPENAI_EMBEDDINGS_URL = "https://api.openai.com/v1/embeddings";
const EMBEDDING_MODEL = "text-embedding-3-large";
const EMBEDDING_DIMENSIONS = 1536;

export interface EmbeddingResult {
  vector: number[];
  tokens: number;       // tokens consumidos (pra log de custo)
  costUsd: number;      // estimativa de custo em USD
}

const COST_PER_1K_TOKENS = 0.00013; // USD, 3-large com 1536 dim

function estimateCost(tokens: number): number {
  return (tokens / 1000) * COST_PER_1K_TOKENS;
}

export async function embed(text: string): Promise<EmbeddingResult> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY não configurada nos secrets do Supabase");
  }

  // Trim agressivo: input máximo OpenAI é 8191 tokens (~32k chars).
  // Se vier maior, truncar — em prática raramente passa de 4k.
  const input = text.slice(0, 32000).trim();
  if (!input) {
    throw new Error("embed() recebeu texto vazio");
  }

  const resp = await fetch(OPENAI_EMBEDDINGS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input,
      dimensions: EMBEDDING_DIMENSIONS,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    throw new Error(`OpenAI embeddings ${resp.status}: ${errText.slice(0, 200)}`);
  }

  const data = await resp.json();
  const vector = data?.data?.[0]?.embedding;
  const tokens = data?.usage?.total_tokens ?? 0;

  if (!Array.isArray(vector) || vector.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(`OpenAI embeddings retornou shape inesperado (length=${vector?.length})`);
  }

  return {
    vector,
    tokens,
    costUsd: estimateCost(tokens),
  };
}

// Helper pra Postgres: vector(1536) é serializado como string "[0.1,0.2,...]".
export function vectorToPgString(vec: number[]): string {
  return `[${vec.join(",")}]`;
}
