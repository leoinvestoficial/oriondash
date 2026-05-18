// chat-v2 — Cérebro v2 com RAG + multi-agente embrionário.
//
// Mantém contrato HTTP idêntico ao chat antigo:
//   POST /functions/v1/chat-v2
//   Body: { messages: [{role, content}] }
//   Response: text/event-stream no formato OpenAI-compatible
//             (data: {"choices":[{"delta":{"content":"..."}}]})
//
// Diferenças do chat antigo:
// - Modelo: Claude Sonnet 4.5 via Anthropic API direto (não mais Lovable Gateway).
// - Retrieval: search_memory por embedding (top 8) em vez de top 30 importance.
// - System prompt enxuto (~1500 tokens) via agente especializado em vez de dump.
// - Roteamento: Copywriter pra pedidos de copy; Strategist pro resto.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { streamAnthropicAsOpenAI } from "../_shared/anthropic.ts";
import { embed, vectorToPgString } from "../_shared/embeddings.ts";
import { logAiCall } from "../_shared/log.ts";
import { chooseAgent } from "../_shared/orchestrator.ts";
import { getStrategistConfig } from "../_shared/agents/strategist.ts";
import { getCopywriterConfig } from "../_shared/agents/copywriter.ts";
import type { ChatMessage, RetrievedMemory } from "../_shared/types.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ---- Helpers de contexto ----

function buildDnaSummary(dna: Record<string, unknown> | null): string {
  if (!dna || typeof dna !== "object") return "DNA da empresa ainda não foi preenchido — incentive a completar o onboarding antes de recomendar ações que dependam dele.";

  const dnaData = (dna as { dna_data?: Record<string, Record<string, string>> }).dna_data ?? {};
  const identity = dnaData.identity ?? {};
  const marketPositioning = dnaData.marketPositioning ?? dnaData.market ?? {};
  const audience = dnaData.audience ?? {};
  const objectives = dnaData.objectives ?? {};
  const goalsConstraints = dnaData.goalsConstraints ?? {};
  const salesProduct = dnaData.salesProduct ?? {};
  const metrics = dnaData.metrics ?? {};
  const businessContext = (dna as { business_context?: Record<string, string> }).business_context ?? {};

  const lines: string[] = [];
  if (identity.companyName) lines.push(`- Empresa: ${identity.companyName}`);
  if (identity.product) lines.push(`- Produto/Serviço: ${identity.product}`);
  if (identity.positioning || identity.marketPositioning) lines.push(`- Posicionamento: ${identity.positioning || identity.marketPositioning}`);
  if (identity.toneOfVoice) lines.push(`- Tom de voz: ${identity.toneOfVoice}`);
  if (identity.values) lines.push(`- Valores: ${identity.values}`);

  if (marketPositioning.category) lines.push(`- Categoria: ${marketPositioning.category}`);
  if (marketPositioning.direct_competitors || marketPositioning.competitors) lines.push(`- Concorrentes: ${marketPositioning.direct_competitors || marketPositioning.competitors}`);
  if (marketPositioning.unique_advantage || marketPositioning.competitivePosition) lines.push(`- Diferencial: ${marketPositioning.unique_advantage || marketPositioning.competitivePosition}`);

  if (audience.idealCustomer) lines.push(`- Cliente ideal: ${audience.idealCustomer}`);
  if (audience.motivations) lines.push(`- Motivações/dores: ${audience.motivations}`);
  if (audience.objections) lines.push(`- Objeções: ${audience.objections}`);
  if (audience.triggers) lines.push(`- Gatilhos: ${audience.triggers}`);

  // Produto & Vendas
  if (salesProduct.main_offer) lines.push(`- Oferta principal: ${salesProduct.main_offer}`);
  if (salesProduct.business_model) lines.push(`- Modelo de negócio: ${salesProduct.business_model}`);
  if (salesProduct.upsells) lines.push(`- Upsell/cross-sell: ${salesProduct.upsells}`);
  if (salesProduct.purchase_frequency) lines.push(`- Frequência de compra: ${salesProduct.purchase_frequency}`);
  if (salesProduct.active_customers_count) lines.push(`- Clientes ativos: ${salesProduct.active_customers_count}`);
  if (salesProduct.churn_rate) lines.push(`- Churn mensal: ${salesProduct.churn_rate}%`);
  if (salesProduct.sales_process) lines.push(`- Processo de venda: ${salesProduct.sales_process}`);
  if (salesProduct.retention_strategy) lines.push(`- Retenção/recompra: ${salesProduct.retention_strategy}`);
  if (salesProduct.main_differentiator) lines.push(`- Diferencial decisivo: ${salesProduct.main_differentiator}`);

  // Métricas
  if (metrics.monthly_revenue || businessContext.revenue) lines.push(`- Faturamento mensal: R$${metrics.monthly_revenue || businessContext.revenue}`);
  if (metrics.budget_monthly || businessContext.budget) lines.push(`- Budget marketing: R$${metrics.budget_monthly || businessContext.budget}`);
  if (metrics.avg_ticket) lines.push(`- Ticket médio: R$${metrics.avg_ticket}`);
  if (metrics.cac_current) lines.push(`- CAC atual: R$${metrics.cac_current}`);
  if (metrics.ltv_estimated) lines.push(`- LTV: R$${metrics.ltv_estimated}`);
  if (metrics.avg_roas) lines.push(`- ROAS médio: ${metrics.avg_roas}x`);
  if (metrics.perceived_bottlenecks) lines.push(`- Gargalos: ${metrics.perceived_bottlenecks}`);

  // Objetivos
  if (objectives.okrs || goalsConstraints.primary_goal) lines.push(`- Objetivo principal: ${objectives.okrs || goalsConstraints.primary_goal}`);
  if (objectives.marketingGoals || goalsConstraints.target_metric) lines.push(`- Meta de marketing: ${objectives.marketingGoals || goalsConstraints.target_metric}`);
  if (goalsConstraints.forbidden) lines.push(`- Restrições: ${goalsConstraints.forbidden}`);
  if (goalsConstraints.history) lines.push(`- Histórico: ${goalsConstraints.history}`);

  if (lines.length === 0) return "DNA preenchido parcialmente — incentive a completar o onboarding.";
  return lines.join("\n");
}

function buildBrandVoiceSummary(profile: Record<string, unknown> | null): string {
  if (!profile) return "";
  const tone = profile.preferred_tone as { descriptors?: string[] } | undefined;
  const avoid = profile.avoid_phrases as { phrases?: string[] } | undefined;
  const sample = (profile as { sample_size?: number }).sample_size ?? 0;
  const lines: string[] = [];
  if (tone?.descriptors?.length) lines.push(`- Tom preferido: ${tone.descriptors.join(", ")}`);
  if (avoid?.phrases?.length) lines.push(`- Evitar: ${avoid.phrases.slice(0, 5).join(", ")}`);
  if (sample > 0) lines.push(`(perfil baseado em ${sample} aprovações/rejeições)`);
  return lines.join("\n");
}

function buildCopywriterCtx(dna: Record<string, unknown> | null, brandProfile: Record<string, unknown> | null) {
  const dnaData = (dna as { dna_data?: Record<string, Record<string, string>> })?.dna_data ?? {};
  const identity = dnaData.identity ?? {};
  const audience = dnaData.audience ?? {};

  return {
    companyName: identity.companyName ?? "(empresa)",
    brandVoiceSummary: buildBrandVoiceSummary(brandProfile),
    toneOfVoice: identity.toneOfVoice ?? "",
    audience: audience.idealCustomer ?? "",
    vetoedExamples: identity.vetoedExample ?? "",
    lovedExamples: identity.lovedExample ?? "",
  };
}

function buildPlaybooksSummary(playbooks: Record<string, unknown>[] | null): string {
  if (!playbooks?.length) return "";
  return playbooks
    .slice(0, 5)
    .map((playbook, index) => {
      const situation = playbook.situation_pattern as Record<string, unknown> | undefined;
      const action = playbook.action_pattern as Record<string, unknown> | undefined;
      const successRate = Number(playbook.success_rate ?? 0);
      const sampleSize = Number(playbook.sample_size ?? 0);
      return `${index + 1}. Situação ${JSON.stringify(situation ?? {})} → ação ${JSON.stringify(action ?? {})}; success_rate ${(successRate * 100).toFixed(0)}%, n=${sampleSize}`;
    })
    .join("\n");
}

function buildCentralContextSummary(context: Record<string, unknown> | null): string {
  if (!context || context.source !== "central_orion") return "";
  const priority = context.priority as Record<string, unknown> | undefined;
  const dataQuality = context.data_quality as Record<string, unknown> | undefined;
  const finance = context.finance as Record<string, unknown> | undefined;
  const topActions = Array.isArray(context.top_actions) ? context.top_actions as Record<string, unknown>[] : [];
  const alerts = Array.isArray(context.alerts) ? context.alerts as Record<string, unknown>[] : [];
  const orchestrations = Array.isArray(context.prepared_orchestrations) ? context.prepared_orchestrations as Record<string, unknown>[] : [];
  const approvals = Array.isArray(context.pending_approvals) ? context.pending_approvals as Record<string, unknown>[] : [];
  const campaigns = Array.isArray(context.campaigns) ? context.campaigns as Record<string, unknown>[] : [];
  const learnings = Array.isArray(context.learnings) ? context.learnings as Record<string, unknown>[] : [];
  const publications = Array.isArray(context.publications) ? context.publications as Record<string, unknown>[] : [];

  const lines: string[] = [
    "## CONTEXTO ESTRUTURADO DA CENTRAL ORION",
    `- Snapshot: ${context.central_snapshot_timestamp || "nao informado"}`,
    `- Papel do usuario: ${context.user_role || "owner"} / modo: ${context.product_mode || "owner"}`,
    `- Experiencia atual: ${context.view_mode || "simplified"}`,
    `- Origem dos dados: ${dataQuality?.source || "unknown"}`,
  ];
  if (dataQuality?.notice) lines.push(`- Aviso de dados: ${dataQuality.notice}`);
  if (priority) {
    lines.push(
      "",
      "### Prioridade numero 1",
      `- Titulo: ${priority.title || "nao definida"}`,
      `- Motivo: ${priority.reason || "nao informado"}`,
      `- Evidencia: ${priority.evidence || "nao informada"}`,
      `- Impacto: ${priority.impact || "nao estimado"}`,
      `- Acao preparada/recomendada: ${priority.recommended_action || "nao definida"}`,
    );
  }
  if (topActions.length) {
    lines.push("", "### Top acoes");
    topActions.slice(0, 3).forEach((action, index) => {
      lines.push(`${index + 1}. ${action.title || "Acao"} (${action.type || "geral"}) - ${action.expected_impact || action.reason || "sem impacto estimado"}`);
    });
  }
  if (alerts.length) {
    lines.push("", "### Alertas");
    alerts.slice(0, 4).forEach((alert) => lines.push(`- ${alert.title || "Alerta"}: ${alert.description || ""}`));
  }
  if (orchestrations.length) {
    lines.push("", "### O que o Orion ja preparou");
    orchestrations.slice(0, 4).forEach((item) => lines.push(`- ${item.title || "Orquestracao"} [${item.status || "sem status"}]: ${item.recommended_action || item.detected_signal || ""}`));
  }
  if (approvals.length) {
    lines.push("", "### Aprovacoes pendentes");
    approvals.slice(0, 5).forEach((item) => lines.push(`- ${item.title || "Aprovacao"} (${item.type || "geral"}): ${item.impact || "impacto nao informado"}`));
  }
  if (campaigns.length) {
    lines.push("", "### Campanhas relevantes");
    campaigns.slice(0, 5).forEach((campaign) => lines.push(`- ${campaign.name || "Campanha"}: ${campaign.status || "status?"}, ${campaign.channel || "canal?"}, gasto ${campaign.spend ?? "?"}, resultado ${campaign.result || "?"}`));
  }
  if (finance) {
    lines.push(
      "",
      "### Metas financeiras",
      `- Budget mensal: ${finance.monthly_budget ?? "nao configurado"}`,
      `- CPA alvo: ${finance.target_cpa ?? "nao configurado"}`,
      `- CAC alvo: ${finance.target_cac ?? "nao configurado"}`,
      `- ROAS alvo: ${finance.target_roas ?? "nao configurado"}`,
      `- Margem estimada: ${finance.estimated_margin ?? "nao configurada"}`,
      `- Break-even CPA: ${finance.break_even_cpa ?? "nao configurado"}`,
    );
  }
  if (learnings.length) {
    lines.push("", "### Aprendizados recentes");
    learnings.slice(0, 5).forEach((learning) => lines.push(`- ${learning.title || "Aprendizado"}: ${learning.description || ""}`));
  }
  if (publications.length) {
    lines.push("", "### Publicacoes e agendamentos");
    publications.slice(0, 5).forEach((publication) => {
      lines.push(`- ${publication.title || "Publicacao"}: ${publication.channel || "canal?"}, status ${publication.status || "?"}, origem ${publication.data_origin || "unknown"}, horario ${publication.scheduled_at || "nao definido"}`);
    });
  }
  lines.push(
    "",
    "Regras para responder com este contexto:",
    "- Nao invente numeros ausentes.",
    "- Se os dados forem mock/demo/estimados, diga isso de forma clara.",
    "- Se a experiencia atual for simplified, responda curto, sem jargao e com no maximo 3 prioridades.",
    "- Se a experiencia atual for pro, pode trazer evidencias, riscos, hipoteses, filtros e backlog operacional.",
    "- Para dono, fale em dinheiro e proxima acao. Para gestor, fale em operacao. Para agencia, fale em alinhamento e aprovacao.",
    "- Sempre termine com uma proxima acao concreta.",
  );
  return lines.join("\n");
}

// ---- Handler ----

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const startedAt = Date.now();
  let userId: string | null = null;
  let agentName: "strategist" | "copywriter" = "strategist";
  let chosenModel = "";

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    userId = user.id;

    const { messages, context } = await req.json() as { messages: ChatMessage[]; context?: Record<string, unknown> };
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages vazio" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- Carregamento paralelo: DNA + brand_voice_profile + retrieval semântico ----
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const queryText = lastUser?.content || "";

    // Embedding da última msg do user — usado pra retrieval semântico.
    let memories: RetrievedMemory[] = [];
    let embeddingTokens = 0;
    let embeddingCost = 0;
    try {
      const e = await embed(queryText);
      embeddingTokens = e.tokens;
      embeddingCost = e.costUsd;

      const { data: searchResult, error: searchError } = await supabase.rpc("search_memory", {
        query_embedding: vectorToPgString(e.vector),
        p_user_id: userId,
        match_count: 8,
        match_threshold: 0.4,
      });
      if (searchError) {
        console.error("search_memory error", searchError);
      } else if (Array.isArray(searchResult)) {
        memories = searchResult as RetrievedMemory[];
      }
    } catch (e) {
      // Fallback: se embedding falhar (e.g. OPENAI_API_KEY ausente em staging), seguimos sem memórias.
      // Logamos pra investigar mas não derrubamos a request.
      console.error("embedding/retrieval failed, continuing without RAG:", e instanceof Error ? e.message : e);
    }

    const centralContextSummary = buildCentralContextSummary(context || null);

    const [dnaRes, profileRes, playbooksRes] = await Promise.all([
      supabase.from("company_dna").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("brand_voice_profile").select("*").eq("user_id", userId).maybeSingle(),
      supabase
        .from("ai_playbooks")
        .select("*")
        .or(`user_id.eq.${userId},user_id.is.null`)
        .gte("success_rate", 0.7)
        .gte("sample_size", 3)
        .order("success_rate", { ascending: false })
        .limit(5),
    ]);

    const dna = dnaRes.data;
    const profile = profileRes.data;
    const companyName = (dna as { company_name?: string })?.company_name ?? "(empresa)";

    const today = new Date().toLocaleDateString("pt-BR", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });

    // ---- Roteamento ----
    const choice = chooseAgent(messages);
    agentName = choice.primary;

    let agentConfig;
    if (choice.primary === "copywriter") {
      agentConfig = getCopywriterConfig(buildCopywriterCtx(dna, profile));
    } else {
      agentConfig = getStrategistConfig({
        companyName,
        dnaSummary: [buildDnaSummary(dna), centralContextSummary].filter(Boolean).join("\n\n"),
        brandVoiceSummary: buildBrandVoiceSummary(profile),
        playbooksSummary: buildPlaybooksSummary((playbooksRes.data ?? []) as Record<string, unknown>[]),
        retrievedMemories: memories,
        todayHuman: today,
      });
    }
    chosenModel = agentConfig.model;

    // ---- Streaming via Anthropic ----
    const stream = await streamAnthropicAsOpenAI({
      systemPrompt: agentConfig.systemPrompt,
      messages,
      model: agentConfig.model,
      maxTokens: agentConfig.maxTokens,
      onUsage: ({ tokensIn, tokensOut, model, costUsd }) => {
        const totalLatency = Date.now() - startedAt;
        // fire-and-forget log
        logAiCall({
          user_id: userId!,
          call_type: "chat",
          provider: "anthropic",
          model,
          agent: agentName,
          tokens_in: tokensIn,
          tokens_out: tokensOut,
          cost_usd: costUsd + embeddingCost,
          latency_ms: totalLatency,
          status: "success",
          metadata: {
            embedding_tokens: embeddingTokens,
            embedding_cost_usd: embeddingCost,
            memories_retrieved: memories.length,
            avg_similarity: memories.length
              ? memories.reduce((s, m) => s + m.similarity, 0) / memories.length
              : null,
          },
        }).catch(() => {});
      },
      onError: (err) => {
        logAiCall({
          user_id: userId!,
          call_type: "chat",
          provider: "anthropic",
          model: chosenModel,
          agent: agentName,
          status: "error",
          error_message: err.message.slice(0, 500),
          latency_ms: Date.now() - startedAt,
        }).catch(() => {});
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : "Erro desconhecido";
    console.error("chat-v2 error:", errMsg);

    if (userId) {
      logAiCall({
        user_id: userId,
        call_type: "chat",
        provider: "anthropic",
        model: chosenModel || undefined,
        agent: agentName,
        status: "error",
        error_message: errMsg.slice(0, 500),
        latency_ms: Date.now() - startedAt,
      }).catch(() => {});
    }

    return new Response(JSON.stringify({ error: errMsg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
