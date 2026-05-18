// Retention Specialist agent — CRM, retenção e estratégia de pós-venda.
//
// Analisa base de clientes e eventos recentes para identificar oportunidades
// de recompra, recuperação de carrinho, winback, upsell e nurturing VIP.
// Gera mensagens personalizadas e sugestões de jornadas de relacionamento.

import { DEFAULT_MODEL } from "../anthropic.ts";

export const RETENTION_SPECIALIST_MODEL = DEFAULT_MODEL;
export const RETENTION_SPECIALIST_MAX_TOKENS = 3200;

export interface CustomerInput {
  id: string;
  status: string;           // ex: "active", "at_risk", "churned", "new"
  last_order_at: string;    // ISO date string
  total_revenue: number;    // receita total (R$)
  orders_count: number;     // número de pedidos
  [key: string]: unknown;   // campos extras (email, nome, tags etc.)
}

export interface RetentionContext {
  customers: CustomerInput[];
  segments: unknown[];       // segmentos de clientes existentes
  recentEvents: unknown[];   // eventos recentes (carrinhos abandonados, visitas etc.)
  brandVoice: string;        // resumo do tom de voz da marca para mensagens personalizadas
}

export type OpportunityType =
  | "repurchase"
  | "cart_recovery"
  | "winback"
  | "upsell"
  | "subscription"
  | "vip_nurture";

export type RecommendedChannel = "whatsapp" | "email" | "sms";

export type Priority = "high" | "medium" | "low";

export interface RetentionOpportunity {
  opportunity_type: OpportunityType;
  title: string;
  rationale: string;
  target_count: number;
  expected_revenue: number;
  expected_margin: number;
  recommended_channel: RecommendedChannel;
  recommended_message: string;
  priority: Priority;
}

export interface JourneySuggestion {
  name: string;
  type: string;
  steps_summary: string;
}

export interface RetentionResult {
  opportunities: RetentionOpportunity[];
  journey_suggestions: JourneySuggestion[];
  health_summary: string;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
}

const SYSTEM_PROMPT = "Você é o Retention Specialist do Orion. Especialista em CRM e pós-venda. Identifica oportunidades de recompra, recuperação de carrinho, winback e upsell. Gera mensagens personalizadas e jornadas de relacionamento.";

const TOOL_DEFINITION = {
  name: "generate_retention_plan",
  description: "Gera plano de retenção com oportunidades priorizadas, mensagens personalizadas, sugestões de jornadas e resumo da saúde da base.",
  input_schema: {
    type: "object",
    properties: {
      opportunities: {
        type: "array",
        description: "Oportunidades de retenção priorizadas",
        items: {
          type: "object",
          properties: {
            opportunity_type: {
              type: "string",
              enum: ["repurchase", "cart_recovery", "winback", "upsell", "subscription", "vip_nurture"],
            },
            title: { type: "string" },
            rationale: { type: "string" },
            target_count: { type: "number" },
            expected_revenue: { type: "number" },
            expected_margin: { type: "number" },
            recommended_channel: {
              type: "string",
              enum: ["whatsapp", "email", "sms"],
            },
            recommended_message: {
              type: "string",
              description: "Mensagem personalizada pronta para envio, no tom de voz da marca",
            },
            priority: {
              type: "string",
              enum: ["high", "medium", "low"],
            },
          },
          required: [
            "opportunity_type",
            "title",
            "rationale",
            "target_count",
            "expected_revenue",
            "expected_margin",
            "recommended_channel",
            "recommended_message",
            "priority",
          ],
        },
      },
      journey_suggestions: {
        type: "array",
        description: "Sugestões de jornadas de relacionamento automatizadas",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            type: { type: "string" },
            steps_summary: {
              type: "string",
              description: "Resumo dos passos da jornada em uma frase",
            },
          },
          required: ["name", "type", "steps_summary"],
        },
      },
      health_summary: {
        type: "string",
        description: "Resumo executivo da saúde da base de clientes em 2-3 frases",
      },
    },
    required: ["opportunities", "journey_suggestions", "health_summary"],
  },
};

function buildUserPrompt(ctx: RetentionContext): string {
  // Passa apenas amostra de clientes se a lista for muito grande
  const customerSample = ctx.customers.slice(0, 100);
  const truncated = ctx.customers.length > 100
    ? ` (amostra dos primeiros 100 de ${ctx.customers.length} clientes)`
    : "";

  return [
    `# Tom de Voz da Marca`,
    ctx.brandVoice || "Não informado.",
    ``,
    `# Base de Clientes${truncated}`,
    JSON.stringify(customerSample, null, 2),
    ``,
    `# Segmentos Existentes`,
    ctx.segments.length
      ? JSON.stringify(ctx.segments, null, 2)
      : "Nenhum segmento definido.",
    ``,
    `# Eventos Recentes (carrinhos abandonados, visitas, etc.)`,
    ctx.recentEvents.length
      ? JSON.stringify(ctx.recentEvents, null, 2)
      : "Nenhum evento recente fornecido.",
    ``,
    `Com base nesse contexto, gere o plano de retenção usando a ferramenta generate_retention_plan.`,
  ].join("\n");
}

export async function runRetentionSpecialist(ctx: RetentionContext): Promise<RetentionResult> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY não configurada nos secrets do Supabase");

  const body = {
    model: RETENTION_SPECIALIST_MODEL,
    max_tokens: RETENTION_SPECIALIST_MAX_TOKENS,
    temperature: 0.6,
    system: SYSTEM_PROMPT,
    tools: [TOOL_DEFINITION],
    tool_choice: { type: "tool", name: "generate_retention_plan" },
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
    throw new Error(`Retention Specialist Anthropic ${resp.status}: ${errText.slice(0, 300)}`);
  }

  const data = await resp.json();
  const tokensIn: number = data?.usage?.input_tokens ?? 0;
  const tokensOut: number = data?.usage?.output_tokens ?? 0;
  const costUsd: number = ((tokensIn / 1_000_000) * 3.0) + ((tokensOut / 1_000_000) * 15.0);

  const toolUseBlock = (data?.content ?? []).find(
    (block: { type: string }) => block.type === "tool_use",
  );
  if (!toolUseBlock) {
    throw new Error("Retention Specialist: resposta sem tool_use block");
  }

  const input = toolUseBlock.input as {
    opportunities: RetentionOpportunity[];
    journey_suggestions: JourneySuggestion[];
    health_summary: string;
  };

  return {
    opportunities: input.opportunities ?? [],
    journey_suggestions: input.journey_suggestions ?? [],
    health_summary: input.health_summary ?? "",
    tokensIn,
    tokensOut,
    costUsd,
  };
}
