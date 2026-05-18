import { supabase } from "@/integrations/supabase/client";
import type { DataSourceKind } from "@/components/central/DataSourceBadge";
import { normalizeOrionRole, modeForRole, type OrionMode, type OrionRole } from "@/lib/productRoles";

export interface CentralChatContext {
  source: "central_orion";
  company_id: string | null;
  company_name: string | null;
  user_role: OrionRole;
  product_mode: OrionMode;
  data_quality: {
    source: DataSourceKind;
    has_mock_or_demo: boolean;
    has_estimated: boolean;
    notice: string | null;
  };
  central_snapshot_timestamp: string;
  priority: {
    title: string;
    reason: string;
    evidence: string;
    impact: string;
    recommended_action: string;
  };
  top_actions: Array<{
    title: string;
    type: string;
    reason: string;
    expected_impact: string;
    due_date: string | null;
  }>;
  alerts: Array<{ title: string; severity: string; description: string }>;
  prepared_orchestrations: Array<{
    title: string;
    status: string;
    detected_signal: string | null;
    recommended_action: string | null;
    financial_impact_estimate: string | null;
  }>;
  pending_approvals: Array<{ title: string; type: string | null; impact: string | null; status: string }>;
  campaigns: Array<{ name: string; status: string; channel: string | null; spend: number; result: string }>;
  finance: {
    monthly_budget: number | null;
    target_cpa: number | null;
    target_cac: number | null;
    target_roas: number | null;
    estimated_margin: number | null;
    break_even_cpa: number | null;
  };
  learnings: Array<{ title: string; description: string | null; confidence_score: number | null }>;
  publications: Array<{ title: string; channel: string; status: string; scheduled_at: string | null; data_origin: string }>;
}

const toNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const classifyDataSource = (campaigns: Array<Record<string, unknown>>): CentralChatContext["data_quality"] => {
  const hasMock = campaigns.some((campaign) => {
    const snapshot = campaign.metrics_snapshot as Record<string, unknown> | null;
    const source = String(snapshot?.source || campaign.source || "").toLowerCase();
    return source.includes("mock") || source.includes("demo");
  });
  const hasData = campaigns.length > 0;
  const source: DataSourceKind = hasMock ? "mock" : hasData ? "real" : "estimated";
  return {
    source,
    has_mock_or_demo: hasMock,
    has_estimated: source === "estimated",
    notice: hasMock
      ? "Esta conta tem dados demonstrativos/mock; nao trate os numeros como reais."
      : source === "estimated"
        ? "Faltam dados reais suficientes; respostas devem pedir dados antes de cravar numeros."
        : null,
  };
};

export async function buildCentralChatContext(input: {
  userId: string;
  companyId?: string | null;
  role?: string | null;
}): Promise<CentralChatContext> {
  const role = normalizeOrionRole(input.role);
  const mode = modeForRole(role);

  const [dnaRes, decisionsRes, orchestrationsRes, approvalsRes, campaignsRes, financeRes, memoryRes, tasksRes, publicationsRes] = await Promise.all([
    supabase.from("company_dna").select("id, company_name").eq("user_id", input.userId).maybeSingle(),
    supabase
      .from("ai_decisions")
      .select("id,title,rationale,evidence,expected_impact,action_type,severity,status,campaign_id,created_at")
      .eq("user_id", input.userId)
      .order("created_at", { ascending: false })
      .limit(5),
    (supabase as any)
      .from("action_orchestrations")
      .select("title,status,detected_signal,recommended_action,financial_impact_estimate,created_at")
      .eq("user_id", input.userId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("approvals")
      .select("title,category,approval_type,impact,status,created_at")
      .eq("user_id", input.userId)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("campaigns")
      .select("name,status,platform,budget,metrics_snapshot,created_at")
      .eq("user_id", input.userId)
      .order("created_at", { ascending: false })
      .limit(8),
    (supabase as any)
      .from("marketing_finance_targets")
      .select("monthly_budget,target_cpa,target_cac,target_roas,estimated_margin,break_even_cpa,period_start")
      .eq("user_id", input.userId)
      .order("period_start", { ascending: false })
      .limit(1)
      .maybeSingle(),
    (supabase as any)
      .from("operational_memory")
      .select("title,description,confidence_score,created_at")
      .eq("user_id", input.userId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("tasks")
      .select("title,status,priority,due_date,created_at")
      .eq("user_id", input.userId)
      .order("created_at", { ascending: false })
      .limit(8),
    (supabase as any)
      .from("publication_jobs")
      .select("title,channel,status,scheduled_at,data_origin,created_at")
      .eq("user_id", input.userId)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const companyId = input.companyId || dnaRes.data?.id || null;
  const decisions = decisionsRes.data || [];
  const primaryDecision = decisions.find((decision) => decision.status === "pending") || decisions[0];
  const campaigns = ((campaignsRes.data || []) as Array<Record<string, unknown>>);
  const approvals = ((approvalsRes.data || []) as Array<Record<string, unknown>>).filter((approval) => approval.status === "pending");
  const orchestrations = orchestrationsRes.error ? [] : ((orchestrationsRes.data || []) as Array<Record<string, unknown>>);
  const memories = memoryRes.error ? [] : ((memoryRes.data || []) as Array<Record<string, unknown>>);
  const publications = publicationsRes.error ? [] : ((publicationsRes.data || []) as Array<Record<string, unknown>>);
  const tasks = tasksRes.data || [];
  const dataQuality = classifyDataSource(campaigns);

  const pendingTask = tasks.find((task) => task.status !== "done");
  const priority = primaryDecision
    ? {
        title: primaryDecision.title,
        reason: primaryDecision.rationale || "Decisao IA recente precisa de encaminhamento.",
        evidence: primaryDecision.evidence || "Snapshot operacional recente.",
        impact: primaryDecision.expected_impact || "Impacto em validacao.",
        recommended_action: primaryDecision.action_type || "preparar_execucao_assistida",
      }
    : approvals.length > 0
      ? {
          title: "Aprovacoes pendentes travando execucao",
          reason: "Existem aprovacoes aguardando decisao humana.",
          evidence: `${approvals.length} aprovacao(oes) pendente(s).`,
          impact: "Pode atrasar campanhas, criativos ou verba.",
          recommended_action: "revisar_aprovacoes",
        }
      : {
          title: pendingTask?.title || "Definir proxima acao operacional",
          reason: pendingTask ? "Ha tarefa aberta que precisa de continuidade." : "Nao ha decisao critica persistida no momento.",
          evidence: dataQuality.notice || "Contexto montado a partir da Central Orion.",
          impact: "Impacto depende de dados reais e metas configuradas.",
          recommended_action: pendingTask ? "executar_tarefa_aberta" : "gerar_decisoes_ia",
        };

  return {
    source: "central_orion",
    company_id: companyId,
    company_name: dnaRes.data?.company_name || null,
    user_role: role,
    product_mode: mode,
    data_quality: dataQuality,
    central_snapshot_timestamp: new Date().toISOString(),
    priority,
    top_actions: [
      ...decisions.slice(0, 2).map((decision) => ({
        title: decision.title,
        type: decision.action_type || "decision",
        reason: decision.rationale || "",
        expected_impact: decision.expected_impact || "",
        due_date: null,
      })),
      ...tasks.slice(0, 2).map((task) => ({
        title: task.title,
        type: "task",
        reason: `Status: ${task.status}; prioridade: ${task.priority}`,
        expected_impact: "Execucao operacional pendente.",
        due_date: task.due_date,
      })),
    ].slice(0, 3),
    alerts: [
      ...(dataQuality.notice ? [{ title: "Qualidade de dados", severity: dataQuality.source, description: dataQuality.notice }] : []),
      ...(approvals.length ? [{ title: "Aprovacoes pendentes", severity: "media", description: `${approvals.length} itens aguardando decisao.` }] : []),
    ],
    prepared_orchestrations: orchestrations.map((item) => ({
      title: String(item.title || ""),
      status: String(item.status || ""),
      detected_signal: item.detected_signal ? String(item.detected_signal) : null,
      recommended_action: item.recommended_action ? String(item.recommended_action) : null,
      financial_impact_estimate: item.financial_impact_estimate ? String(item.financial_impact_estimate) : null,
    })),
    pending_approvals: approvals.map((item) => ({
      title: String(item.title || ""),
      type: item.approval_type ? String(item.approval_type) : item.category ? String(item.category) : null,
      impact: item.impact ? String(item.impact) : null,
      status: String(item.status || "pending"),
    })),
    campaigns: campaigns.map((campaign) => {
      const snapshot = (campaign.metrics_snapshot || {}) as Record<string, unknown>;
      const spend = toNumber(snapshot.spend ?? campaign.budget);
      const roas = snapshot.roas != null ? `${Number(snapshot.roas).toFixed(2)}x ROAS` : "resultado nao consolidado";
      return {
        name: String(campaign.name || ""),
        status: String(campaign.status || ""),
        channel: campaign.platform ? String(campaign.platform) : null,
        spend,
        result: roas,
      };
    }),
    finance: financeRes.error || !financeRes.data
      ? { monthly_budget: null, target_cpa: null, target_cac: null, target_roas: null, estimated_margin: null, break_even_cpa: null }
      : {
          monthly_budget: financeRes.data.monthly_budget ?? null,
          target_cpa: financeRes.data.target_cpa ?? null,
          target_cac: financeRes.data.target_cac ?? null,
          target_roas: financeRes.data.target_roas ?? null,
          estimated_margin: financeRes.data.estimated_margin ?? null,
          break_even_cpa: financeRes.data.break_even_cpa ?? null,
        },
    learnings: memories.map((memory) => ({
      title: String(memory.title || ""),
      description: memory.description ? String(memory.description) : null,
      confidence_score: memory.confidence_score != null ? Number(memory.confidence_score) : null,
    })),
    publications: publications.map((publication) => ({
      title: String(publication.title || ""),
      channel: String(publication.channel || ""),
      status: String(publication.status || ""),
      scheduled_at: publication.scheduled_at ? String(publication.scheduled_at) : null,
      data_origin: String(publication.data_origin || "unknown"),
    })),
  };
}
