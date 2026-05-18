// Researcher agent — pesquisa de mercado, análise de concorrentes e tendências.
//
// Analisa o DNA da empresa, dados de concorrentes e sinais de mercado para
// identificar oportunidades, ameaças e recomendar experimentos acionáveis.

import { DEFAULT_MODEL } from "../anthropic.ts";

export const RESEARCHER_MODEL = DEFAULT_MODEL;
export const RESEARCHER_MAX_TOKENS = 3000;

export interface ResearcherContext {
  companyDna: unknown;         // objeto company_dna completo ou resumo
  competitors: unknown[];      // array de dados de concorrentes
  marketSignals: unknown[];    // array de sinais de mercado (tendências, notícias, dados)
  industry: string;            // setor/nicho da empresa
}

export interface MarketOpportunity {
  title: string;
  description: string;
  urgency: "high" | "medium" | "low";
  potential_revenue_impact: string;
}

export interface CompetitiveThreat {
  competitor: string;
  threat: string;
  recommended_response: string;
}

export interface BenchmarkGap {
  metric: string;
  our_value: number;
  benchmark: number;
  gap_pct: number;
}

export interface RecommendedTest {
  hypothesis: string;
  expected_impact: string;
  effort: "low" | "medium" | "high";
}

export interface ResearcherResult {
  market_opportunities: MarketOpportunity[];
  competitive_threats: CompetitiveThreat[];
  trending_topics: string[];
  benchmark_gaps: BenchmarkGap[];
  recommended_tests: RecommendedTest[];
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
}

const SYSTEM_PROMPT = "Você é o Researcher do Orion. Analisa mercado, concorrentes e sinais para identificar oportunidades e ameaças. Traduz dados externos em decisões de negócio acionáveis.";

const TOOL_DEFINITION = {
  name: "generate_research_insights",
  description: "Gera insights de pesquisa com oportunidades de mercado, ameaças competitivas, tópicos em alta, gaps de benchmark e testes recomendados.",
  input_schema: {
    type: "object",
    properties: {
      market_opportunities: {
        type: "array",
        description: "Oportunidades identificadas no mercado",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            urgency: { type: "string", enum: ["high", "medium", "low"] },
            potential_revenue_impact: { type: "string" },
          },
          required: ["title", "description", "urgency", "potential_revenue_impact"],
        },
      },
      competitive_threats: {
        type: "array",
        description: "Ameaças identificadas na concorrência",
        items: {
          type: "object",
          properties: {
            competitor: { type: "string" },
            threat: { type: "string" },
            recommended_response: { type: "string" },
          },
          required: ["competitor", "threat", "recommended_response"],
        },
      },
      trending_topics: {
        type: "array",
        items: { type: "string" },
        description: "Tópicos e tendências em alta relevantes para o negócio",
      },
      benchmark_gaps: {
        type: "array",
        description: "Gaps entre métricas da empresa e benchmarks do setor",
        items: {
          type: "object",
          properties: {
            metric: { type: "string" },
            our_value: { type: "number" },
            benchmark: { type: "number" },
            gap_pct: { type: "number" },
          },
          required: ["metric", "our_value", "benchmark", "gap_pct"],
        },
      },
      recommended_tests: {
        type: "array",
        description: "Experimentos e testes recomendados com hipótese e esforço",
        items: {
          type: "object",
          properties: {
            hypothesis: { type: "string" },
            expected_impact: { type: "string" },
            effort: { type: "string", enum: ["low", "medium", "high"] },
          },
          required: ["hypothesis", "expected_impact", "effort"],
        },
      },
    },
    required: [
      "market_opportunities",
      "competitive_threats",
      "trending_topics",
      "benchmark_gaps",
      "recommended_tests",
    ],
  },
};

function buildUserPrompt(ctx: ResearcherContext): string {
  return [
    `# Setor / Nicho`,
    ctx.industry || "Não informado.",
    ``,
    `# DNA da Empresa`,
    typeof ctx.companyDna === "string"
      ? ctx.companyDna
      : JSON.stringify(ctx.companyDna, null, 2),
    ``,
    `# Dados de Concorrentes`,
    ctx.competitors.length
      ? JSON.stringify(ctx.competitors, null, 2)
      : "Nenhum dado de concorrente fornecido.",
    ``,
    `# Sinais de Mercado`,
    ctx.marketSignals.length
      ? JSON.stringify(ctx.marketSignals, null, 2)
      : "Nenhum sinal de mercado fornecido.",
    ``,
    `Com base nesse contexto, gere os insights de pesquisa usando a ferramenta generate_research_insights.`,
  ].join("\n");
}

export async function runResearcher(ctx: ResearcherContext): Promise<ResearcherResult> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY não configurada nos secrets do Supabase");

  const body = {
    model: RESEARCHER_MODEL,
    max_tokens: RESEARCHER_MAX_TOKENS,
    temperature: 0.5,
    system: SYSTEM_PROMPT,
    tools: [TOOL_DEFINITION],
    tool_choice: { type: "tool", name: "generate_research_insights" },
    messages: [
      { role: "user", content: buildUserPrompt(ctx) },
    ],
  };

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errText = await resp.text().catch(() => "");
    throw new Error(`Researcher Anthropic ${resp.status}: ${errText.slice(0, 300)}`);
  }

  const data = await resp.json();
  const tokensIn: number = data?.usage?.input_tokens ?? 0;
  const tokensOut: number = data?.usage?.output_tokens ?? 0;
  const costUsd: number = ((tokensIn / 1_000_000) * 3.0) + ((tokensOut / 1_000_000) * 15.0);

  const toolUseBlock = (data?.content ?? []).find(
    (block: { type: string }) => block.type === "tool_use",
  );
  if (!toolUseBlock) {
    throw new Error("Researcher: resposta sem tool_use block");
  }

  const input = toolUseBlock.input as {
    market_opportunities: MarketOpportunity[];
    competitive_threats: CompetitiveThreat[];
    trending_topics: string[];
    benchmark_gaps: BenchmarkGap[];
    recommended_tests: RecommendedTest[];
  };

  return {
    market_opportunities: input.market_opportunities ?? [],
    competitive_threats: input.competitive_threats ?? [],
    trending_topics: input.trending_topics ?? [],
    benchmark_gaps: input.benchmark_gaps ?? [],
    recommended_tests: input.recommended_tests ?? [],
    tokensIn,
    tokensOut,
    costUsd,
  };
}
