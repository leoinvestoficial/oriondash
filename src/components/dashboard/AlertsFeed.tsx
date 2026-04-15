import { AlertTriangle, TrendingUp, Zap, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const alerts = [
  {
    type: "warning" as const,
    title: "CPC subiu 22% no Meta",
    description: "Provável entrada de concorrente neste público. Orion sugere testar novo segmento.",
    time: "12 min",
    icon: AlertTriangle,
  },
  {
    type: "success" as const,
    title: "ROAS do Google acima de 5x",
    description: "Campanha de Search está performando 40% acima do benchmark.",
    time: "1h",
    icon: TrendingUp,
  },
  {
    type: "insight" as const,
    title: "Oportunidade detectada",
    description: "Concorrente reduziu investimento em LinkedIn. Janela para captar share.",
    time: "3h",
    icon: Zap,
  },
  {
    type: "ai" as const,
    title: "Sugestão do Orion",
    description: "Realocar 15% do budget de TikTok para Google Search pode melhorar ROAS em 0.4x.",
    time: "5h",
    icon: Sparkles,
  },
];

const typeStyles = {
  warning: "border-l-orion-warning bg-orion-warning/5",
  success: "border-l-orion-success bg-orion-success/5",
  insight: "border-l-orion-coral bg-orion-coral/5",
  ai: "border-l-orion-violet-light bg-primary/5",
};

const iconStyles = {
  warning: "text-orion-warning",
  success: "text-orion-success",
  insight: "text-orion-coral",
  ai: "text-orion-violet-light",
};

export const AlertsFeed = () => {
  return (
    <div className="bg-card border border-border rounded-xl p-5 h-full">
      <h3 className="text-heading text-foreground mb-4">Alertas ativos</h3>
      <div className="space-y-3">
        {alerts.map((alert, i) => (
          <div
            key={i}
            className={cn(
              "border-l-2 rounded-lg p-3 space-y-1",
              typeStyles[alert.type]
            )}
          >
            <div className="flex items-center gap-2">
              <alert.icon className={cn("w-3.5 h-3.5", iconStyles[alert.type])} />
              <span className="text-xs font-medium text-foreground">{alert.title}</span>
              <span className="ml-auto text-[10px] text-muted-foreground">{alert.time}</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">{alert.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
