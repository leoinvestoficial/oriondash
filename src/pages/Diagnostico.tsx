import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Sparkles, Clock } from "lucide-react";

const Diagnostico = () => {
  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto py-12 px-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="w-10 h-10 rounded-xl orion-gradient flex items-center justify-center text-primary-foreground">
            <Sparkles className="w-5 h-5" />
          </span>
          <div>
            <p className="text-xs text-muted-foreground font-mono">DIAGNÓSTICO ORION</p>
            <h1 className="text-display text-foreground">Score de Marketing</h1>
          </div>
        </div>
        <p className="text-muted-foreground mb-8">
          Análise estratégica do seu negócio com base no Company DNA, métricas atuais e criativos.
        </p>

        <Card className="p-8 bg-card border-border text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-orion-violet/10 flex items-center justify-center">
            <Clock className="w-7 h-7 text-orion-violet-light" />
          </div>
          <h2 className="text-heading text-foreground mb-2">Em construção — Fase 2</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Sua base estratégica já está coletada. A próxima fase ativa o motor de IA que devolve
            Score 0-100, semáforo verde/amarelo/vermelho por área (Tráfego, Criativo, Copy, Oferta,
            Branding, Funil) e os top 3 gargalos com hipóteses acionáveis.
          </p>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Diagnostico;
