/**
 * OnboardingWelcome — tela de boas-vindas do Company DNA.
 * O DNA da empresa é único: não há seleção de perfil/persona aqui.
 * A experiência de interface (Simplificado/Pro) é configurada na sidebar.
 */
import { Button } from "@/components/ui/button";
import { OperationalLoopAnimation } from "@/components/onboarding/OperationalLoopAnimation";
import { ArrowRight, Brain } from "lucide-react";

interface OnboardingWelcomeProps {
  onStart: () => void;
}

export const OnboardingWelcome = ({ onStart }: OnboardingWelcomeProps) => (
  <div className="max-w-2xl mx-auto text-center animate-fade-in px-4">
    {/* Logo */}
    <div className="w-20 h-20 mx-auto mb-8 rounded-2xl orion-gradient flex items-center justify-center orion-glow">
      <Brain className="w-9 h-9 text-primary-foreground" />
    </div>

    {/* Headline */}
    <h1 className="text-display text-foreground mb-3">
      Bem-vindo ao <span className="orion-text-gradient">Orion</span>
    </h1>
    <p className="text-base text-muted-foreground mb-2">
      Antes de começar, vamos construir o <strong className="text-foreground">Company DNA</strong> da sua empresa.
    </p>
    <p className="text-sm text-muted-foreground/80 mb-10 max-w-lg mx-auto leading-relaxed">
      Ele é a base de tudo: o Orion usa essas informações para entender seu negócio,
      público, oferta e objetivos — e operar como uma extensão da sua equipe de marketing.
    </p>

    {/* Loop animation */}
    <div className="mb-10 py-6 px-4 rounded-2xl border border-border/60 bg-card/50">
      <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground/50 mb-5">
        Como o Orion opera
      </p>
      <OperationalLoopAnimation showLabels autoPlay interval={1600} />
    </div>

    {/* What to expect */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10 text-left">
      {[
        {
          title: "~15 minutos",
          desc: "10 etapas curtas sobre sua empresa, mercado, público e objetivos.",
        },
        {
          title: "Pode pausar",
          desc: "Salva automaticamente a cada etapa. Continue de onde parou.",
        },
        {
          title: "Sempre atualizável",
          desc: "Altere o DNA sempre que sua estratégia ou produto evoluir.",
        },
      ].map(({ title, desc }) => (
        <div key={title} className="rounded-xl border border-border/60 bg-card p-4 space-y-1.5">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
        </div>
      ))}
    </div>

    {/* CTA */}
    <Button
      onClick={onStart}
      size="lg"
      className="gap-2 orion-gradient text-primary-foreground px-8"
    >
      Começar a construir o DNA <ArrowRight className="w-4 h-4" />
    </Button>

    <p className="mt-4 text-xs text-muted-foreground/50">
      Salva automaticamente. Você pode pausar e continuar de onde parou.
    </p>
  </div>
);
