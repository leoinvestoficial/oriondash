import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";
import { Check, X, Edit3, Sparkles, Clock, AlertTriangle, DollarSign, Inbox, ChevronLeft } from "lucide-react";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHelpBanner } from "@/components/help/PageHelpBanner";
import { PAGE_HELP } from "@/lib/pageHelp";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { createOperationalMemoryFromEvent } from "@/lib/operationalMemory";

interface ApprovalItem {
  id: string;
  title: string;
  description: string;
  reasoning: string;
  impact: string;
  level: string;
  category: string;
  supporting_data: unknown;
  company_id?: string | null;
  status: string;
  created_at: string;
}

const Approvals = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchApprovals = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("approvals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) { console.error(error); }
    else {
      const mapped = (data || []).map((item) => ({
        ...item,
        supporting_data: (item.supporting_data as any) || [],
      }));
      setItems(mapped);
      if (mapped.length > 0 && !selected) setSelected(mapped[0].id);
    }
    setLoading(false);
  }, [user, selected]);

  useEffect(() => { fetchApprovals(); }, [fetchApprovals]);

  const handleAction = async (id: string, action: string) => {
    const item = items.find((approval) => approval.id === id);
    const { error } = await supabase
      .from("approvals")
      .update({ status: action, resolved_at: new Date().toISOString() })
      .eq("id", id);

    if (error) { toast.error("Erro ao atualizar aprovação"); }
    else {
      const support = item?.supporting_data as { publication_job_id?: string } | null;
      if (support?.publication_job_id) {
        await (supabase as any)
          .from("publication_jobs")
          .update({
            status: action === "approved" ? "approved" : "canceled",
            approved_by: action === "approved" ? user?.id : null,
            approved_at: action === "approved" ? new Date().toISOString() : null,
          })
          .eq("id", support.publication_job_id);
        await (supabase as any).from("publication_logs").insert({
          company_id: item?.company_id ?? null,
          user_id: user?.id,
          publication_job_id: support.publication_job_id,
          action: action === "approved" ? "approval_approved" : "approval_rejected",
          status_from: "awaiting_approval",
          status_to: action === "approved" ? "approved" : "canceled",
          channel: (item?.supporting_data as any)?.channel ?? null,
          details: { approval_id: id },
        });
        if (user?.id) {
          await createOperationalMemoryFromEvent({
            company_id: item?.company_id ?? null,
            user_id: user.id,
            memory_type: "publication_learning",
            title: action === "approved" ? "Publicação aprovada" : "Publicação rejeitada",
            description: `A publicação vinculada à aprovação "${item?.title || id}" foi ${action === "approved" ? "aprovada" : "rejeitada"}.`,
            source_type: "publication_job",
            source_id: support.publication_job_id,
            tags: ["publication", action === "approved" ? "approved" : "rejected"],
          });
        }
      }
      toast.success(action === "approved" ? "Aprovada!" : "Rejeitada.");
      await fetchApprovals();
    }
  };

  const pending = items.filter((i) => i.status === "pending");
  const resolved = items.filter((i) => i.status !== "pending");
  const selectedItem = items.find((i) => i.id === selected);
  const selectedSupport = selectedItem?.supporting_data;
  const supportList = Array.isArray(selectedSupport) ? selectedSupport : [];
  const analystSupport = selectedSupport && !Array.isArray(selectedSupport)
    ? selectedSupport as {
        decision_id?: string;
        campaign_id?: string;
        severity?: string;
        evidence?: string | string[];
        expected_impact?: string;
        verdict?: string;
        confidence?: number;
        risk_level?: string;
        data?: string[];
        data_origin?: string;
        channel?: string;
        publication_job_id?: string;
        recommended_action?: { type?: string; steps?: string[] };
      }
    : null;
  const isPublicationApproval = Boolean(analystSupport?.publication_job_id || selectedItem?.category === "publication" || analystSupport?.data_origin);

  const formatDate = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `Há ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Há ${hours}h`;
    return `Há ${Math.floor(hours / 24)} dias`;
  };

  if (loading) {
    return (
      <AppLayout>
        <PageSkeleton variant="detail" />
      </AppLayout>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <AppLayout>
        <EmptyState
          icon={Inbox}
          title="Nenhuma aprovação pendente"
          description="Quando o Orion identificar oportunidades ou precisar de autorização para agir, as propostas aparecerão aqui pra sua revisão."
          size="lg"
          className="min-h-[70vh]"
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col md:flex-row h-screen">
        {/* List — hidden em mobile quando há item selecionado */}
        <div
          className={cn(
            "md:w-96 md:border-r border-border overflow-auto md:flex-shrink-0",
            selected ? "hidden md:block" : "block flex-1",
          )}
        >
          <div className="p-5 border-b border-border">
            <h1 className="text-display text-foreground">Aprovações</h1>
            <p className="text-xs text-muted-foreground mt-1">
              {pending.length} pendente{pending.length !== 1 ? "s" : ""}
            </p>
            <div className="mt-3">
              <PageHelpBanner content={PAGE_HELP.approvals} />
            </div>
          </div>

          {pending.length > 0 && (
            <div className="px-3 py-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider px-2 mb-2">Pendentes</p>
              {pending.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelected(item.id)}
                  className={cn(
                    "w-full text-left px-3 py-3 rounded-lg mb-1 transition-all",
                    selected === item.id ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/30"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded",
                      item.level === "priority" ? "bg-orion-coral/15 text-orion-coral" : "bg-orion-warning/15 text-orion-warning"
                    )}>
                      {item.level === "priority" ? "Prioritária" : "Simples"}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{formatDate(item.created_at)}</span>
                  </div>
                  <p className="text-sm text-foreground line-clamp-2">{item.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {item.category === "analyst_decision" ? "Analyst" : item.category}
                  </p>
                </button>
              ))}
            </div>
          )}

          {resolved.length > 0 && (
            <div className="px-3 py-2 border-t border-border">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider px-2 mb-2">Resolvidas</p>
              {resolved.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelected(item.id)}
                  className={cn(
                    "w-full text-left px-3 py-3 rounded-lg mb-1 opacity-60",
                    selected === item.id ? "bg-muted/30" : "hover:bg-muted/20"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {item.status === "approved" ? (
                      <Check className="w-3 h-3 text-orion-success" />
                    ) : (
                      <X className="w-3 h-3 text-destructive" />
                    )}
                    <p className="text-sm text-foreground line-clamp-1">{item.title}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detail */}
        <div className={cn("flex-1 overflow-auto", !selected && "hidden md:block")}>
          {selectedItem ? (
            <div className="p-4 md:p-6 max-w-2xl space-y-6 animate-fade-in">
              {/* Mobile: botão voltar */}
              <button
                onClick={() => setSelected(null)}
                className="md:hidden -mx-1 px-3 py-2 -mt-1 text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 min-h-[44px]"
              >
                <ChevronLeft className="w-4 h-4" />
                Voltar
              </button>

              <div className="flex items-start gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                  selectedItem.level === "priority" ? "bg-orion-coral/15" : "bg-orion-warning/15"
                )}>
                  {selectedItem.level === "priority" ? (
                    <AlertTriangle className="w-5 h-5 text-orion-coral" />
                  ) : (
                    <Clock className="w-5 h-5 text-orion-warning" />
                  )}
                </div>
                <div>
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded mb-1 inline-block",
                    selectedItem.level === "priority" ? "bg-orion-coral/15 text-orion-coral" : "bg-orion-warning/15 text-orion-warning"
                  )}>
                    Aprovação {selectedItem.level === "priority" ? "prioritária" : "simples"}
                  </span>
                  <h2 className="text-heading text-foreground mt-1">{selectedItem.title}</h2>
                  <p className="text-xs text-muted-foreground">{selectedItem.category} · {formatDate(selectedItem.created_at)}</p>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-4">
                <p className="text-sm text-foreground leading-relaxed">{selectedItem.description}</p>
              </div>

              {isPublicationApproval && (
                <div className="rounded-xl border border-orion-coral/30 bg-orion-coral/10 p-4">
                  <p className="text-xs font-medium text-orion-coral">Publicação demonstrativa</p>
                  <p className="mt-1 text-sm text-foreground">
                    Esta aprovação libera apenas o fluxo dentro do Orion. Em staging/mock, Meta/Instagram real está desativado e nada é enviado para canal real.
                  </p>
                </div>
              )}

              <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-orion-violet-light" />
                  <span className="text-xs text-orion-violet-light font-medium">Raciocínio do Orion</span>
                </div>
                <p className="text-sm text-foreground leading-relaxed">{selectedItem.reasoning}</p>
              </div>

              <div className="bg-orion-surface-2 rounded-xl p-4 flex items-start gap-3">
                <DollarSign className="w-4 h-4 text-orion-amber mt-0.5" />
                <div>
                  <p className="text-xs text-orion-amber font-medium mb-1">Impacto</p>
                  <p className="text-sm text-foreground">{selectedItem.impact}</p>
                </div>
              </div>

              {analystSupport && (
                <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                  {selectedItem.category === "analyst_decision" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="rounded-lg border border-border bg-background/50 p-3">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Decision ID</p>
                        <p className="text-xs text-foreground font-mono break-all">
                          {analystSupport.decision_id || selectedItem.id}
                        </p>
                      </div>
                      <div className="rounded-lg border border-border bg-background/50 p-3">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Severidade</p>
                        <p className="text-sm text-foreground">
                          {analystSupport.severity || analystSupport.risk_level || selectedItem.level}
                        </p>
                      </div>
                      {analystSupport.campaign_id && (
                        <div className="rounded-lg border border-border bg-background/50 p-3 sm:col-span-2">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Campaign ID</p>
                          <p className="text-xs text-foreground font-mono break-all">{analystSupport.campaign_id}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    {analystSupport.verdict && (
                      <span className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-lg">
                        {analystSupport.verdict}
                      </span>
                    )}
                    {analystSupport.risk_level && (
                      <span className="text-xs bg-orion-warning/15 text-orion-warning px-3 py-1.5 rounded-lg">
                        risco {analystSupport.risk_level}
                      </span>
                    )}
                    {typeof analystSupport.confidence === "number" && (
                      <span className="text-xs bg-muted px-3 py-1.5 rounded-lg text-muted-foreground">
                        confiança {(analystSupport.confidence * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                  {(analystSupport.evidence || analystSupport.expected_impact) && (
                    <div className="grid grid-cols-1 gap-3">
                      {analystSupport.evidence && (
                        <div>
                          <p className="text-xs text-muted-foreground font-medium mb-2">Evidências</p>
                          {Array.isArray(analystSupport.evidence) ? (
                            <ul className="space-y-1">
                              {analystSupport.evidence.map((item, index) => (
                                <li key={index} className="text-sm text-foreground">- {item}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-foreground">{analystSupport.evidence}</p>
                          )}
                        </div>
                      )}
                      {analystSupport.expected_impact && (
                        <div>
                          <p className="text-xs text-muted-foreground font-medium mb-2">Impacto esperado</p>
                          <p className="text-sm text-foreground">{analystSupport.expected_impact}</p>
                        </div>
                      )}
                    </div>
                  )}
                  {analystSupport.data && analystSupport.data.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {analystSupport.data.map((item, index) => (
                        <span key={index} className="text-xs bg-muted px-3 py-1.5 rounded-lg text-muted-foreground font-mono">
                          {item}
                        </span>
                      ))}
                    </div>
                  )}
                  {analystSupport.recommended_action?.steps && analystSupport.recommended_action.steps.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-2">Ação recomendada</p>
                      <ul className="space-y-1">
                        {analystSupport.recommended_action.steps.map((step, index) => (
                          <li key={index} className="text-sm text-foreground">- {step}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {supportList.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {supportList.map((d: string, i: number) => (
                    <span key={i} className="text-xs bg-muted px-3 py-1.5 rounded-lg text-muted-foreground font-mono">
                      {d}
                    </span>
                  ))}
                </div>
              )}

              {selectedItem.status === "pending" && (
                <div className="sticky bottom-0 -mx-4 md:mx-0 px-4 md:px-0 pb-4 md:pb-0 pt-4 bg-background/95 md:bg-transparent backdrop-blur md:backdrop-blur-none border-t border-border flex flex-col-reverse md:flex-row items-stretch md:items-center gap-2 md:gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => handleAction(selectedItem.id, "rejected")}
                    className="text-destructive hover:text-destructive min-h-[44px] md:min-h-0 md:flex-none"
                  >
                    <X className="w-4 h-4 mr-2" /> Rejeitar
                  </Button>
                  <Button
                    onClick={() => handleAction(selectedItem.id, "approved")}
                    className="bg-orion-success hover:bg-orion-success/90 text-primary-foreground min-h-[44px] md:min-h-0 md:flex-none"
                  >
                    <Check className="w-4 h-4 mr-2" /> Aprovar
                  </Button>
                </div>
              )}

              {selectedItem.status !== "pending" && (
                <div className={cn(
                  "flex items-center gap-2 px-4 py-3 rounded-xl text-sm",
                  selectedItem.status === "approved" ? "bg-orion-success/10 text-orion-success" : "bg-destructive/10 text-destructive"
                )}>
                  {selectedItem.status === "approved" ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  {selectedItem.status === "approved" ? "Aprovada e em execução" : "Rejeitada"}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Selecione uma aprovação para ver detalhes
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Approvals;
