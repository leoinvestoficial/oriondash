// Media Buyer agent — decisões de mídia, alocação de orçamento e escalonamento.
//
// Analisa desempenho de campanhas ativas e gera um plano de mídia estruturado:
// onde alocar budget, o que pausar, o que escalar e novos públicos para testar.

import { DEFAULT_MODEL } from "../anthropic.ts";

export const MEDIA_BUYER_MODEL = DEFAULT_MODEL;
export const MEDIA_BUYER_MAX_TOKENS = 2800;

export interface CampaignInput {
  id: string;
  name?: string;
  platform: string;       // ex: "meta", "google", "tiktok"
  spend: number;          // gasto no período (R$)
  roas: number;           // return on ad spend
  cpa: number;            // custo por aquisição (R$)
  ctr: number;            // click-through rate (%)
  [key: string]: unknown; // campos extras (impressions, clicks etc.)
}

export interface MediaBuyerContext {
  campaigns: CampaignInput[];
  totalBudget: number;                               // orçamento total disponível (R$)
  objective: "awareness" | "conversion" | "retention";
  playbooks: unknown[];                              // playbooks relevantes do histórico
}

export interface BudgetAllocation {
  campaign_id: string;
  platform: string;
  recommended_budget: number;
  rationale: string;
}

export interface PauseRecommendation {
  campaign_id: string;
  reason: string;
}

export interface ScaleRecommendation {
  campaign_id: string;
  scale_factor: number;
  rationale: string;
}

export interface NewAudienceSuggestion {
  description: string;
  estimated_cpa: number;
  platform: string;
}

export interface MediaBuyerResult {
  budget_allocation: BudgetAllocation[];
  pause_recommendations: PauseRecommendation[];
  scale_recommendations: ScaleRecommendation[];
  new_audience_suggestions: NewAudienceSuggestion[];
  weekly_focus: string;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
}

const SYSTEM_PROMPT = "Você é o Media Buyer do Orion. Analisa desempenho de campanhas e aloca orçamento para maximizar ROAS e minimizar CAC. Decide onde escalar, pausar e testar novos públicos.";

const TOOL_DEFINITION = {
  name: "generate_media_plan",
  description: "Gera plano de mídia completo com alocação de budget, recomendações de pausa/escalonamento e sugestões de novos públicos.",
  input_schema: {
    type: "object",
    properties: {
      budget_allocation: {
        type: "array",
        description: "Alocação de orçamento por campanha",
        items: {
          type: "object",
          properties: {
            campaign_id: { type: "string" },
            platform: { type: "string" },
            recommended_budget: { type: "number" },
            rationale: { type: "string" },
          },
          required: ["campaign_id", "platform", "recommended_budget", "rationale"],
        },
      },
      pause_recommendations: {
        type: "array",
        description: "Campanhas que devem ser pausadas e o motivo",
        items: {
          type: "object",
          properties: {
            campaign_id: { type: "string" },
            reason: { type: "string" },
          },
          required: ["campaign_id", "reason"],
        },
      },
      scale_recommendations: {
        type: "array",
        description: "Campanhas que devem ser escalonadas, com fator e justificativa",
        items: {
          type: "object",
          properties: {
            campaign_id: { type: "string" },
            scale_factor: { type: "number" },
            rationale: { type: "string" },
          },
          required: ["campaign_id", "scale_factor", "rationale"],
        },
      },
      new_audience_suggestions: {
        type: "array",
        description: "Novos públicos para testar, com CPA estimado e plataforma",
        items: {
          type: "object",
          properties: {
            description: { type: "string" },
            estimated_cpa: { type: "number" },
            platform: { type: "string" },
          },
          required: ["description", "estimated_cpa", "platform"],
        },
      },
      weekly_focus: {
        type: "string",
        description: "Foco principal da semana em uma frase objetiva",
      },
    },
    required: [
      "budget_allocation",
      "pause_recommendations",
      "scale_recommendations",
      "new_audience_suggestions",
      "weekly_focus",
    ],
  },
};

function buildUserPrompt(ctx: MediaBuyerContext): string {
  return [
    `# Orçamento Total Disponível`,
    `R$ ${ctx.totalBudget.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
    ``,
    `# Objetivo da Campanha`,
    ctx.objective,
    ``,
    `# Campanhas Ativas (últimos 7–14 dias)`,
    JSON.stringify(ctx.campaigns, null, 2),
    ``,
    `# Playbooks Relevantes`,
    ctx.playbooks.length
      ? JSON.stringify(ctx.playbooks, null, 2)
      : "Nenhum playbook relevante ainda.",
    ``,
    `Com base nesses dados, gere o plano de mídia usando a ferramenta generate_media_plan.`,
  ].join("\n");
}

export async function runMediaBuyer(ctx: MediaBuyerContext): Promise<MediaBuyerResult> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY não configurada nos secrets do Supabase");

  const body = {
    model: MEDIA_BUYER_MODEL,
    max_tokens: MEDIA_BUYER_MAX_TOKENS,
    temperature: 0.4,
    system: SYSTEM_PROMPT,
    tools: [TOOL_DEFINITION],
    tool_choice: { type: "tool", name: "generate_media_plan" },
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
    throw new Error(`Media Buyer Anthropic ${resp.status}: ${errText.slice(0, 300)}`);
  }

  const data = await resp.json();
  const tokensIn: number = data?.usage?.input_tokens ?? 0;
  const tokensOut: number = data?.usage?.output_tokens ?? 0;
  const costUsd: number = ((tokensIn / 1_000_000) * 3.0) + ((tokensOut / 1_000_000) * 15.0);

  const toolUseBlock = (data?.content ?? []).find(
    (block: { type: string }) => block.type === "tool_use",
  );
  if (!toolUseBlock) {
    throw new Error("Media Buyer: resposta sem tool_use block");
  }

  const input = toolUseBlock.input as {
    budget_allocation: BudgetAllocation[];
    pause_recommendations: PauseRecommendation[];
    scale_recommendations: ScaleRecommendation[];
    new_audience_suggestions: NewAudienceSuggestion[];
    weekly_focus: string;
  };

  return {
    budget_allocation: input.budget_allocation ?? [],
    pause_recommendations: input.pause_recommendations ?? [],
    scale_recommendations: input.scale_recommendations ?? [],
    new_audience_suggestions: input.new_audience_suggestions ?? [],
    weekly_focus: input.weekly_focus ?? "",
    tokensIn,
    tokensOut,
    costUsd,
  };
}
