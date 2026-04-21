import { Button } from "@/components/ui/button";

interface OnboardingWelcomeProps {
  onStart: () => void;
}

export const OnboardingWelcome = ({ onStart }: OnboardingWelcomeProps) => {
  return (
    <div className="max-w-2xl mx-auto text-center animate-fade-in px-2">
      <div className="w-20 h-20 mx-auto mb-8 rounded-2xl orion-gradient flex items-center justify-center orion-glow">
        <span className="text-3xl text-primary-foreground font-bold">O</span>
      </div>

      <h1 className="text-display text-foreground mb-4">
        Bem-vindo ao <span className="orion-text-gradient">Orion</span>
      </h1>

      <p className="text-base sm:text-lg text-muted-foreground mb-3">
        Antes de começar, o Orion precisa entender sua empresa.
      </p>

      <p className="text-sm sm:text-base text-muted-foreground mb-8 max-w-lg mx-auto">
        Vamos construir juntos o <strong className="text-foreground">Company DNA</strong> — um documento vivo que guia todas as decisões de marketing. São <strong className="text-foreground">8 etapas curtas</strong>, sem repetições.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10 max-w-xl mx-auto">
        {[
          { icon: "🎨", label: "Marca" },
          { icon: "✦", label: "Identidade" },
          { icon: "◎", label: "Mercado" },
          { icon: "◇", label: "Público" },
          { icon: "📊", label: "Números" },
          { icon: "△", label: "Objetivos" },
          { icon: "👥", label: "Equipe" },
          { icon: "🎬", label: "Criativos" },
        ].map((block) => (
          <div
            key={block.label}
            className="flex flex-col items-center gap-2 p-3 rounded-lg bg-card border border-border"
          >
            <span className="text-xl">{block.icon}</span>
            <span className="text-xs text-muted-foreground">{block.label}</span>
          </div>
        ))}
      </div>

      <Button
        onClick={onStart}
        size="lg"
        className="orion-gradient text-primary-foreground px-8 orion-glow hover:opacity-90 transition-opacity w-full sm:w-auto"
      >
        Começar Onboarding
      </Button>

      <p className="text-xs text-muted-foreground mt-4">
        ~10 minutos. Você pode pausar e retomar a qualquer momento.
      </p>
    </div>
  );
};
