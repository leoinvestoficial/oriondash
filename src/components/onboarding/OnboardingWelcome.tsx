import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useDensity, type Persona } from "@/hooks/useDensity";
import { Loader2, User, Users, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingWelcomeProps {
  onStart: () => void;
}

interface PersonaOption {
  id: Persona;
  label: string;
  description: string;
  icon: typeof User;
  hint: string;
}

const PERSONA_OPTIONS: PersonaOption[] = [
  {
    id: "owner",
    label: "Sou dono do negócio",
    description: "Não tenho time de marketing. Quero o Orion como meu time.",
    icon: User,
    hint: "Linguagem clara, foco em ações e resultados.",
  },
  {
    id: "marketer",
    label: "Sou de marketing",
    description: "Trabalho em marketing solo ou em time enxuto.",
    icon: Users,
    hint: "Controle granular, métricas detalhadas.",
  },
  {
    id: "agency",
    label: "Sou agência",
    description: "Atendo vários clientes e quero produtividade.",
    icon: Building2,
    hint: "Multi-cliente, alta densidade, atalhos pro avançado.",
  },
];

export const OnboardingWelcome = ({ onStart }: OnboardingWelcomeProps) => {
  const { setPersona, persona: existingPersona } = useDensity();
  const [selecting, setSelecting] = useState<Persona | null>(null);

  const handlePersonaSelect = async (chosen: Persona) => {
    setSelecting(chosen);
    try {
      await setPersona(chosen);
      onStart();
    } catch {
      setSelecting(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto text-center animate-fade-in px-2">
      <div className="w-20 h-20 mx-auto mb-8 rounded-2xl orion-gradient flex items-center justify-center orion-glow">
        <span className="text-3xl text-primary-foreground font-bold">O</span>
      </div>

      <h1 className="text-display text-foreground mb-4">
        Bem-vindo ao <span className="orion-text-gradient">Orion</span>
      </h1>

      <p className="text-base sm:text-lg text-muted-foreground mb-3">
        Antes de começar, conta quem vai usar isso no dia a dia.
      </p>

      <p className="text-sm text-muted-foreground mb-8 max-w-lg mx-auto">
        O Orion adapta a interface e a forma de comunicar com base na sua resposta. Você pode trocar nas configurações depois.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
        {PERSONA_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isSelected = selecting === opt.id;
          const isExisting = existingPersona === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => handlePersonaSelect(opt.id)}
              disabled={selecting !== null}
              className={cn(
                "text-left p-4 rounded-xl border-2 transition-all flex flex-col gap-2",
                "hover:border-primary hover:bg-primary/5",
                isExisting ? "border-primary bg-primary/5" : "border-border bg-card",
                "disabled:opacity-60 disabled:cursor-wait",
              )}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  {isSelected ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className="text-sm font-semibold text-foreground">{opt.label}</span>
              </div>
              <p className="text-xs text-muted-foreground">{opt.description}</p>
              <p className="text-[11px] text-muted-foreground/80 mt-auto pt-2 border-t border-border/50">
                {opt.hint}
              </p>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground mb-3">
        Em seguida, vamos construir o <strong className="text-foreground">Company DNA</strong> — 10 etapas curtas, ~15 minutos. Você pode pausar e retomar.
      </p>

      <Button
        onClick={onStart}
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-foreground"
      >
        Pular essa pergunta
      </Button>
    </div>
  );
};
