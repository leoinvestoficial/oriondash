import { useState } from "react";
import { cn } from "@/lib/utils";
import { Eye, Sparkles, ChevronDown, ChevronUp, Target, Users, MessageSquare, Palette, BarChart3 } from "lucide-react";

interface Brief {
  id: string;
  title: string;
  brief_type: string;
  status: string;
  content: Record<string, any>;
  campaign_id: string | null;
  created_at: string;
  updated_at: string;
}

const typeConfig: Record<string, { label: string; emoji: string; color: string }> = {
  creative: { label: "Criativo", emoji: "🎨", color: "text-orion-coral" },
  strategy: { label: "Estratégico", emoji: "🎯", color: "text-orion-teal" },
  image_prompt: { label: "Prompt de Imagem", emoji: "🖼️", color: "text-orion-violet-light" },
  planning: { label: "Planejamento", emoji: "📋", color: "text-orion-info" },
};

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: "Rascunho", className: "bg-muted text-muted-foreground" },
  review: { label: "Em revisão", className: "bg-orion-warning/15 text-orion-warning" },
  approved: { label: "Aprovado", className: "bg-orion-success/15 text-orion-success" },
  archived: { label: "Arquivado", className: "bg-muted/50 text-muted-foreground/50" },
};

const contentFieldLabels: Record<string, { label: string; icon: any }> = {
  objetivo: { label: "Objetivo", icon: Target },
  publico: { label: "Público-alvo", icon: Users },
  mensagem_chave: { label: "Mensagem-chave", icon: MessageSquare },
  formato: { label: "Formato", icon: Palette },
  tom: { label: "Tom de voz", icon: MessageSquare },
  referencias: { label: "Referências", icon: Eye },
  cta: { label: "CTA", icon: Target },
  metricas_sucesso: { label: "Métricas de Sucesso", icon: BarChart3 },
};

interface BriefCardProps {
  brief: Brief;
  isSelected: boolean;
  onSelect: () => void;
}

export const BriefCard = ({ brief, isSelected, onSelect }: BriefCardProps) => {
  const type = typeConfig[brief.brief_type] || typeConfig.creative;
  const status = statusConfig[brief.status] || statusConfig.draft;

  return (
    <button
      onClick={onSelect}
      className={cn(
        "bg-card border rounded-xl p-4 text-left transition-all space-y-3 w-full",
        isSelected ? "border-primary orion-glow" : "border-border hover:border-muted-foreground/30"
      )}
    >
      <div className="aspect-video bg-orion-surface-2 rounded-lg flex items-center justify-center text-3xl">
        {type.emoji}
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className={cn("text-[10px] px-1.5 py-0.5 rounded", status.className)}>
            {status.label}
          </span>
          <span className={cn("text-[10px] font-medium", type.color)}>
            {type.label}
          </span>
        </div>
        <p className="text-sm text-foreground font-medium line-clamp-2">{brief.title}</p>
        <p className="text-[10px] text-muted-foreground mt-1">
          {new Date(brief.created_at).toLocaleDateString("pt-BR")}
        </p>
      </div>
    </button>
  );
};

interface BriefDetailProps {
  brief: Brief;
  onStatusChange: (id: string, status: string) => void;
}

export const BriefDetail = ({ brief, onStatusChange }: BriefDetailProps) => {
  const [expanded, setExpanded] = useState(true);
  const type = typeConfig[brief.brief_type] || typeConfig.creative;
  const status = statusConfig[brief.status] || statusConfig.draft;
  const content = brief.content || {};

  // Get content fields that have values
  const contentEntries = Object.entries(content).filter(([_, v]) => v && String(v).trim());

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{type.emoji}</span>
            <span className={cn("text-xs font-medium", type.color)}>{type.label}</span>
            <span className={cn("text-[10px] px-1.5 py-0.5 rounded", status.className)}>{status.label}</span>
          </div>
          <h2 className="text-heading text-foreground">{brief.title}</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Criado em {new Date(brief.created_at).toLocaleDateString("pt-BR", {
              day: "2-digit", month: "long", year: "numeric"
            })}
          </p>
        </div>
      </div>

      {/* Status controls */}
      <div className="flex items-center gap-2">
        <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Status:</label>
        {(["draft", "review", "approved", "archived"] as const).map((s) => {
          const sc = statusConfig[s];
          return (
            <button
              key={s}
              onClick={() => onStatusChange(brief.id, s)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-medium transition-colors",
                brief.status === s
                  ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              )}
            >
              {sc.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="space-y-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-sm font-medium text-foreground"
        >
          <Sparkles className="w-4 h-4 text-orion-violet-light" />
          Conteúdo do Brief
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {expanded && (
          <div className="space-y-3 animate-fade-in">
            {contentEntries.length > 0 ? (
              contentEntries.map(([key, value]) => {
                const field = contentFieldLabels[key];
                const Icon = field?.icon || Target;
                return (
                  <div key={key} className="bg-orion-surface-2 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Icon className="w-3.5 h-3.5 text-primary" />
                      <span className="text-xs font-medium text-primary">
                        {field?.label || key}
                      </span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                      {String(value)}
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="bg-orion-surface-2 rounded-xl p-4">
                <p className="text-sm text-muted-foreground italic">
                  {typeof content === "string" ? content : JSON.stringify(content, null, 2)}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
