import { Button } from "@/components/ui/button";

interface OnboardingWelcomeProps {
  onStart: () => void;
}

export const OnboardingWelcome = ({ onStart }: OnboardingWelcomeProps) => {
  return (
    <div className="max-w-2xl mx-auto text-center animate-fade-in">
      {/* Orion Logo/Icon */}
      <div className="w-20 h-20 mx-auto mb-8 rounded-2xl orion-gradient flex items-center justify-center orion-glow">
        <span className="text-3xl text-primary-foreground font-bold">O</span>
      </div>

      <h1 className="text-display text-foreground mb-4">
        Bem-vindo ao <span className="orion-text-gradient">Orion</span>
      </h1>

      <p className="text-lg text-muted-foreground mb-3">
        Antes de começar, o Orion precisa entender sua empresa profundamente.
      </p>

      <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
        Vamos construir juntos o <strong className="text-foreground">Company DNA</strong> — um documento vivo que guia todas as decisões de marketing. Não é um formulário burocrático: é uma conversa sobre quem vocês são, onde querem chegar e o que importa de verdade.
      </p>

      <div className="grid grid-cols-3 gap-4 mb-10 max-w-lg mx-auto">
        {[
          { icon: "✦", label: "Identidade" },
          { icon: "◎", label: "Mercado" },
          { icon: "◇", label: "Público" },
          { icon: "△", label: "Objetivos" },
          { icon: "⬡", label: "Restrições" },
          { icon: "◈", label: "Histórico" },
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
        className="orion-gradient text-primary-foreground px-8 orion-glow hover:opacity-90 transition-opacity"
      >
        Começar Onboarding
      </Button>

      <p className="text-xs text-muted-foreground mt-4">
        Leva aproximadamente 15–20 minutos. Você pode pausar e retomar a qualquer momento.
      </p>
    </div>
  );
};
