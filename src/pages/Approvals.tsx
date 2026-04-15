import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";
import { Check, X, Edit3, Sparkles, Clock, AlertTriangle, DollarSign, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ApprovalItem {
  id: string;
  title: string;
  description: string;
  reasoning: string;
  impact: string;
  level: string;
  category: string;
  supporting_data: string[];
  status: string;
  created_at: string;
}

const Approvals = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<ApprovalItem[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchApprovals = async () => {
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
  };

  useEffect(() => { fetchApprovals(); }, [user]);

  const handleAction = async (id: string, action: string) => {
    const { error } = await supabase
      .from("approvals")
      .update({ status: action, resolved_at: new Date().toISOString() })
      .eq("id", id);

    if (error) { toast.error("Erro ao atualizar aprovação"); }
    else {
      toast.success(action === "approved" ? "Aprovada!" : "Rejeitada.");
      await fetchApprovals();
    }
  };

  const pending = items.filter((i) => i.status === "pending");
  const resolved = items.filter((i) => i.status !== "pending");
  const selectedItem = items.find((i) => i.id === selected);

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
        <div className="flex items-center justify-center h-screen">
          <div className="w-8 h-8 rounded-lg orion-gradient animate-pulse-glow" />
        </div>
      </AppLayout>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
          <div className="w-16 h-16 rounded-2xl bg-orion-surface-2 flex items-center justify-center mb-6">
            <Inbox className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-display text-foreground mb-3">Nenhuma aprovação pendente</h1>
          <p className="text-muted-foreground max-w-md">
            Quando o Orion identificar oportunidades ou precisar de autorização para agir, 
            as propostas aparecerão aqui para sua revisão.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex h-screen">
        {/* List */}
        <div className="w-96 border-r border-border overflow-auto">
          <div className="p-5 border-b border-border">
            <h1 className="text-display text-foreground">Aprovações</h1>
            <p className="text-xs text-muted-foreground mt-1">
              {pending.length} pendente{pending.length !== 1 ? "s" : ""}
            </p>
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
                  <p className="text-[11px] text-muted-foreground mt-1">{item.category}</p>
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
        <div className="flex-1 overflow-auto">
          {selectedItem ? (
            <div className="p-6 max-w-2xl space-y-6 animate-fade-in">
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

              {selectedItem.supporting_data.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {selectedItem.supporting_data.map((d: string, i: number) => (
                    <span key={i} className="text-xs bg-muted px-3 py-1.5 rounded-lg text-muted-foreground font-mono">
                      {d}
                    </span>
                  ))}
                </div>
              )}

              {selectedItem.status === "pending" && (
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <Button
                    onClick={() => handleAction(selectedItem.id, "approved")}
                    className="bg-orion-success hover:bg-orion-success/90 text-primary-foreground"
                  >
                    <Check className="w-4 h-4 mr-2" /> Aprovar
                  </Button>
                  <Button variant="ghost" onClick={() => handleAction(selectedItem.id, "rejected")} className="text-destructive hover:text-destructive">
                    <X className="w-4 h-4 mr-2" /> Rejeitar
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
