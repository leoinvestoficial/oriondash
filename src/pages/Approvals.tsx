import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";
import { Check, X, Edit3, Sparkles, Clock, AlertTriangle, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";

type ApprovalLevel = "simple" | "priority";
type ApprovalStatus = "pending" | "approved" | "rejected";

interface ApprovalItem {
  id: string;
  title: string;
  description: string;
  reasoning: string;
  impact: string;
  level: ApprovalLevel;
  category: string;
  data: string[];
  status: ApprovalStatus;
  createdAt: string;
}

const MOCK_APPROVALS: ApprovalItem[] = [
  {
    id: "1",
    title: "Realocar 15% do budget de TikTok para Google Search",
    description: "Com base na performance dos últimos 14 dias, o ROAS do Google Search está 82% acima do TikTok. A realocação pode gerar R$ 4.200 adicionais em conversão.",
    reasoning: "O CPC do TikTok subiu 34% sem melhora em conversão. Google Search mantém CPC estável com taxa de conversão crescente.",
    impact: "Budget: R$ 915/dia movidos. Impacto estimado: +0.4x ROAS geral.",
    level: "priority",
    category: "Budget",
    data: ["ROAS Google: 5.1x", "ROAS TikTok: 2.8x", "CPC TikTok: +34%"],
    status: "pending",
    createdAt: "Há 23 min",
  },
  {
    id: "2",
    title: "Publicar nova campanha de retargeting para abandono de carrinho",
    description: "O Orion criou 4 variações de criativo e configurou público de retargeting com janela de 7 dias.",
    reasoning: "42% dos visitantes adicionam ao carrinho mas não finalizam. A taxa de recuperação atual é 8% — benchmark do setor é 15%.",
    impact: "Exposição pública: campanha vai ao ar no Meta Ads. Budget: R$ 2.100/semana.",
    level: "priority",
    category: "Campanha",
    data: ["Abandono: 42%", "Recuperação atual: 8%", "Meta: 15%"],
    status: "pending",
    createdAt: "Há 1h",
  },
  {
    id: "3",
    title: "Ajustar horário de publicação do LinkedIn para 8h–10h",
    description: "Análise de engajamento mostra que posts entre 8h e 10h têm 3.2x mais interações do que o horário atual (14h).",
    reasoning: "O público B2B está mais ativo no começo do dia. Dados de 45 dias confirmam o padrão.",
    impact: "Baixo impacto financeiro. Mudança de schedule apenas.",
    level: "simple",
    category: "Otimização",
    data: ["Engajamento 8h-10h: 3.2x", "Dados: 45 dias"],
    status: "pending",
    createdAt: "Há 2h",
  },
  {
    id: "4",
    title: "A/B test: headline 'Economize 40%' vs 'Resultados em 7 dias'",
    description: "Teste em 10% do tráfego da campanha principal no Meta para validar qual abordagem ressoa melhor.",
    reasoning: "Dados históricos mostram que o público responde mais a benefício temporal do que a desconto. Hipótese a validar.",
    impact: "Baixo risco. Escala de 10% do tráfego por 72h.",
    level: "simple",
    category: "Teste A/B",
    data: ["Tráfego: 10%", "Duração: 72h"],
    status: "pending",
    createdAt: "Há 3h",
  },
];

const Approvals = () => {
  const [items, setItems] = useState(MOCK_APPROVALS);
  const [selected, setSelected] = useState<string | null>(MOCK_APPROVALS[0].id);

  const handleAction = (id: string, action: ApprovalStatus) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: action } : item))
    );
  };

  const pending = items.filter((i) => i.status === "pending");
  const resolved = items.filter((i) => i.status !== "pending");
  const selectedItem = items.find((i) => i.id === selected);

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
                    <span className="text-[10px] text-muted-foreground">{item.createdAt}</span>
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
              {/* Header */}
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
                  <p className="text-xs text-muted-foreground">{selectedItem.category} · {selectedItem.createdAt}</p>
                </div>
              </div>

              {/* Description */}
              <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                <p className="text-sm text-foreground leading-relaxed">{selectedItem.description}</p>
              </div>

              {/* AI Reasoning */}
              <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-orion-violet-light" />
                  <span className="text-xs text-orion-violet-light font-medium">Raciocínio do Orion</span>
                </div>
                <p className="text-sm text-foreground leading-relaxed">{selectedItem.reasoning}</p>
              </div>

              {/* Impact */}
              <div className="bg-orion-surface-2 rounded-xl p-4 flex items-start gap-3">
                <DollarSign className="w-4 h-4 text-orion-amber mt-0.5" />
                <div>
                  <p className="text-xs text-orion-amber font-medium mb-1">Impacto</p>
                  <p className="text-sm text-foreground">{selectedItem.impact}</p>
                </div>
              </div>

              {/* Supporting Data */}
              <div className="flex gap-2 flex-wrap">
                {selectedItem.data.map((d, i) => (
                  <span key={i} className="text-xs bg-muted px-3 py-1.5 rounded-lg text-muted-foreground font-mono">
                    {d}
                  </span>
                ))}
              </div>

              {/* Actions */}
              {selectedItem.status === "pending" && (
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <Button
                    onClick={() => handleAction(selectedItem.id, "approved")}
                    className="bg-orion-success hover:bg-orion-success/90 text-primary-foreground"
                  >
                    <Check className="w-4 h-4 mr-2" /> Aprovar
                  </Button>
                  <Button
                    variant="outline"
                    className="border-border text-muted-foreground"
                  >
                    <Edit3 className="w-4 h-4 mr-2" /> Editar proposta
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => handleAction(selectedItem.id, "rejected")}
                    className="text-destructive hover:text-destructive"
                  >
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
