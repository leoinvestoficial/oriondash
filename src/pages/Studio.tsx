import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";
import { Eye, BarChart3, Copy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Creative {
  id: string;
  name: string;
  type: "image" | "video" | "copy";
  campaign: string;
  status: "draft" | "approved" | "live";
  ctr?: string;
  impressions?: string;
  hypothesis: string;
  variations: string[];
}

const MOCK_CREATIVES: Creative[] = [
  {
    id: "1",
    name: "Hero Banner — Produto X",
    type: "image",
    campaign: "Lançamento Produto X",
    status: "live",
    ctr: "3.4%",
    impressions: "124K",
    hypothesis: "Imagens com pessoas reais usando o produto convertem 2x mais que product shots isolados neste segmento.",
    variations: [
      "Versão A: Pessoa usando produto em escritório — CTR 3.4%",
      "Versão B: Product shot minimalista — CTR 1.8%",
      "Versão C: Antes/depois — CTR 2.9%",
    ],
  },
  {
    id: "2",
    name: "Vídeo curto — Retargeting",
    type: "video",
    campaign: "Retargeting Carrinho",
    status: "live",
    ctr: "4.1%",
    impressions: "89K",
    hypothesis: "Vídeos de 15s com depoimento geram maior urgência que slides estáticos para retargeting.",
    variations: [
      "Versão A: Depoimento 15s — CTR 4.1%",
      "Versão B: Demo animado 30s — CTR 2.2%",
    ],
  },
  {
    id: "3",
    name: "Copy — Headlines para Search",
    type: "copy",
    campaign: "Geração de Leads B2B",
    status: "approved",
    hypothesis: "Headlines focadas em resultado temporal ('em 7 dias') performam melhor que desconto para B2B.",
    variations: [
      "'Resultados em 7 dias ou devolvemos seu dinheiro'",
      "'A plataforma que 500+ empresas usam para crescer'",
      "'Reduza seu CAC em 40% — veja como'",
    ],
  },
  {
    id: "4",
    name: "Carrossel — Brand Awareness",
    type: "image",
    campaign: "Brand Awareness Q2",
    status: "draft",
    hypothesis: "Carrosséis educativos geram mais saves e shares do que posts promocionais para awareness.",
    variations: [
      "5 slides educativos sobre o mercado",
      "3 slides com cases de sucesso",
    ],
  },
];

const statusMap = {
  draft: { label: "Rascunho", className: "bg-muted text-muted-foreground" },
  approved: { label: "Aprovado", className: "bg-orion-warning/15 text-orion-warning" },
  live: { label: "No ar", className: "bg-orion-success/15 text-orion-success" },
};

const typeEmoji = { image: "🖼", video: "🎬", copy: "✍️" };

const Studio = () => {
  const [selected, setSelected] = useState<string>(MOCK_CREATIVES[0].id);
  const selectedCreative = MOCK_CREATIVES.find((c) => c.id === selected)!;

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-display text-foreground">Estúdio Criativo</h1>
          <p className="text-sm text-muted-foreground">Criativos gerados pelo Orion com hipóteses e performance</p>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {MOCK_CREATIVES.map((creative) => {
            const status = statusMap[creative.status];
            return (
              <button
                key={creative.id}
                onClick={() => setSelected(creative.id)}
                className={cn(
                  "bg-card border rounded-xl p-4 text-left transition-all space-y-3",
                  selected === creative.id ? "border-primary orion-glow" : "border-border hover:border-muted-foreground/30"
                )}
              >
                {/* Preview placeholder */}
                <div className="aspect-video bg-orion-surface-2 rounded-lg flex items-center justify-center text-2xl">
                  {typeEmoji[creative.type]}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded", status.className)}>
                      {status.label}
                    </span>
                  </div>
                  <p className="text-sm text-foreground font-medium truncate">{creative.name}</p>
                  <p className="text-[11px] text-muted-foreground">{creative.campaign}</p>
                </div>
                {creative.ctr && (
                  <div className="flex gap-3 text-xs">
                    <span className="text-orion-teal font-mono">CTR {creative.ctr}</span>
                    <span className="text-muted-foreground font-mono">{creative.impressions} imp.</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Detail Panel */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-5 animate-fade-in">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-heading text-foreground">{selectedCreative.name}</h2>
              <p className="text-xs text-muted-foreground">{selectedCreative.campaign}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="border-border text-muted-foreground">
                <Eye className="w-3.5 h-3.5 mr-1.5" /> Preview
              </Button>
              <Button variant="outline" size="sm" className="border-border text-muted-foreground">
                <Copy className="w-3.5 h-3.5 mr-1.5" /> Duplicar
              </Button>
            </div>
          </div>

          {/* AI Hypothesis */}
          <div className="bg-primary/5 border border-primary/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-orion-violet-light" />
              <span className="text-xs text-orion-violet-light font-medium">Hipótese do Orion</span>
            </div>
            <p className="text-sm text-foreground leading-relaxed">{selectedCreative.hypothesis}</p>
          </div>

          {/* Variations */}
          <div>
            <h3 className="text-sm text-foreground font-medium mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-orion-teal" />
              Variações {selectedCreative.variations.length > 0 && `(${selectedCreative.variations.length})`}
            </h3>
            <div className="space-y-2">
              {selectedCreative.variations.map((v, i) => (
                <div key={i} className="flex items-center gap-3 bg-orion-surface-2 rounded-lg px-4 py-3">
                  <span className="text-xs text-muted-foreground font-mono w-6">{String.fromCharCode(65 + i)}</span>
                  <span className="text-sm text-foreground flex-1">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Studio;
