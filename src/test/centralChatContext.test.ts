import { describe, expect, it, vi } from "vitest";

type QueryResult = { data: unknown; error: unknown };

const resultForTable = (table: string): QueryResult => {
  if (table === "company_dna") return { data: { id: "company-1", company_name: "Orion Demo" }, error: null };
  if (table === "ai_decisions") return { data: [{ id: "d1", title: "Revisar criativo", status: "pending", rationale: "CTR caiu", evidence: "CTR em queda", expected_impact: "Recuperar eficiência", action_type: "refresh_creative" }], error: null };
  if (table === "approvals") return { data: [{ title: "Aprovar criativo", status: "pending", category: "creative", impact: "Destrava teste" }], error: null };
  if (table === "campaigns") return { data: [{ name: "Remarketing", status: "active", platform: "Meta", budget: 300, metrics_snapshot: { source: "mock_seed", roas: 1.4 } }], error: null };
  if (table === "action_orchestrations") return { data: [], error: { code: "42P01" } };
  if (table === "operational_memory") return { data: [], error: { code: "42P01" } };
  if (table === "marketing_finance_targets") return { data: null, error: { code: "42P01" } };
  return { data: [], error: null };
};

const makeQuery = (table: string) => {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    order: vi.fn(() => query),
    limit: vi.fn(() => query),
    maybeSingle: vi.fn(() => Promise.resolve(resultForTable(table))),
    then: (resolve: (value: QueryResult) => unknown) => resolve(resultForTable(table)),
  };
  return query;
};

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: (table: string) => makeQuery(table) },
}));

describe("buildCentralChatContext", () => {
  it("builds a structured central context and marks mock data", async () => {
    const { buildCentralChatContext } = await import("@/lib/centralChatContext");
    const context = await buildCentralChatContext({ userId: "user-1", companyId: "company-1", role: "manager" });

    expect(context.source).toBe("central_orion");
    expect(context.company_id).toBe("company-1");
    expect(context.user_role).toBe("manager");
    expect(context.product_mode).toBe("manager");
    expect(context.priority.title).toBe("Revisar criativo");
    expect(context.data_quality.source).toBe("mock");
    expect(context.pending_approvals).toHaveLength(1);
  });
});
