import { AlertTriangle, TrendingUp, Zap, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardMetrics } from "@/hooks/useDashboardMetrics";

interface AlertsFeedProps {
  metrics?: DashboardMetrics;
}

interface Alert {
  type: "warning" | "success" | "insight" | "ai";
  title: string;
  description: string;
  icon: typeof AlertTriangle;
}

export const AlertsFeed = ({ metrics }: AlertsFeedProps) => {
  const alerts: Alert[] = [];

  if (metrics?.hasData) {
    // Generate real alerts based on metrics
    if (metrics.overallRoas && metrics.overallRoas >= 3) {
      alerts.push({
        type: "success",
        title: `ROAS em ${metrics.overallRoas.toFixed(1)}x`,
        description: "Performance acima do benchmark. Considere escalar o investimento nos canais com melhor retorno.",
        icon: TrendingUp,
      });
    } else if (metrics.overallRoas && metrics.overallRoas < 2) {
      alerts.push({
        type: "warning",
        title: `ROAS baixo: ${metrics.overallRoas.toFixed(1)}x`,
        description: "Retorno abaixo do ideal. Revise criativos, segmentação e landing pages.",
        icon: AlertTriangle,
      });
    }

    if (metrics.overallCtr && metrics.overallCtr < 1) {
      alerts.push({
        type: "warning",
        title: `CTR em ${metrics.overallCtr.toFixed(2)}%`,
        description: "Taxa de clique baixa indica problemas com criativo ou segmentação.",
        icon: AlertTriangle,
      });
    }

    if (metrics.totalConversions > 0 && metrics.overallCpa && metrics.overallCpa > 100) {
      alerts.push({
        type: "insight",
        title: `CPA alto: R$ ${metrics.overallCpa.toFixed(2)}`,
        description: "Custo por aquisição elevado. Teste novos públicos ou otimize o funil.",
        icon: Zap,
      });
    }

    // Platform-specific insights
    const platforms = Object.entries(metrics.byPlatform);
    if (platforms.length > 1) {
      const sorted = platforms.sort((a, b) => {
        const roasA = a[1].revenue > 0 && a[1].spend > 0 ? a[1].revenue / a[1].spend : 0;
        const roasB = b[1].revenue > 0 && b[1].spend > 0 ? b[1].revenue / b[1].spend : 0;
        return roasB - roasA;
      });
      const best = sorted[0];
      alerts.push({
        type: "ai",
        title: `${best[0].replace("_", " ")} é o canal mais eficiente`,
        description: `Considere realocar mais budget para ${best[0].replace("_ads", "").replace("_", " ")} baseado nos dados dos últimos 7 dias.`,
        icon: Sparkles,
      });
    }
  }

  if (alerts.length === 0) {
    alerts.push({
      type: "ai",
      title: "Monitoramento ativo",
      description: "O Orion está analisando seus dados e gerará alertas quando identificar oportunidades ou riscos.",
      icon: Sparkles,
    });
  }

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

  return (
    <div className="bg-card border border-border rounded-xl p-5 h-full">
      <h3 className="text-heading text-foreground mb-4">Alertas ativos</h3>
      <div className="space-y-3">
        {alerts.map((alert, i) => (
          <div
            key={i}
            className={cn("border-l-2 rounded-lg p-3 space-y-1", typeStyles[alert.type])}
          >
            <div className="flex items-center gap-2">
              <alert.icon className={cn("w-3.5 h-3.5", iconStyles[alert.type])} />
              <span className="text-xs font-medium text-foreground">{alert.title}</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">{alert.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
