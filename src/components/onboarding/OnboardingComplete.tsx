import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface OnboardingCompleteProps {
  data: Record<string, Record<string, string>>;
}

export const OnboardingComplete = ({ data }: OnboardingCompleteProps) => {
  const navigate = useNavigate();

  const totalFields = Object.values(data).reduce(
    (acc, block) => acc + Object.values(block).filter((v) => v?.trim()).length,
    0
  );

  return (
    <div className="max-w-2xl mx-auto text-center animate-fade-in">
      {/* Success icon */}
      <div className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-orion-success/20 flex items-center justify-center">
        <span className="text-4xl">✓</span>
      </div>

      <h1 className="text-display text-foreground mb-4">
        Company DNA <span className="orion-text-gradient">criado</span>
      </h1>

      <p className="text-lg text-muted-foreground mb-3">
        O Orion agora entende sua empresa.
      </p>

      <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
        <strong className="text-foreground">{totalFields} campos</strong> foram preenchidos e armazenados como a base de conhecimento da sua marca. A partir de agora, toda decisão do Orion será contextualizada por esse DNA.
      </p>

      {/* DNA Summary */}
      <div className="grid grid-cols-2 gap-3 mb-10 max-w-md mx-auto text-left">
        {[
          { icon: "🎨", label: "Marca & Visual", block: "brandAssets" },
          { icon: "🎯", label: "Posicionamento", block: "marketPositioning" },
          { icon: "✦", label: "Identidade", block: "identity" },
          { icon: "◎", label: "Mercado", block: "marketPositioning" },
          { icon: "◇", label: "Público", block: "audience" },
          { icon: "📊", label: "Números & Funil", block: "metrics" },
          { icon: "△", label: "Objetivos & Restrições", block: "goalsConstraints" },
          { icon: "👥", label: "Equipe & Cargos", block: "teamRoles" },
          { icon: "🎬", label: "Criativos", block: "creativesUpload" },
        ].map((item) => {
          const blockData = data[item.block] || {};
          const filled = Object.values(blockData).filter((v) => v?.trim()).length;
          return (
            <div
              key={item.block}
              className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border"
            >
              <span className="text-lg">{item.icon}</span>
              <div className="min-w-0">
                <p className="text-sm text-foreground truncate">{item.label}</p>
                <p className="text-xs text-muted-foreground">{filled} campos</p>
              </div>
              {filled > 0 && (
                <span className="ml-auto text-xs text-orion-success">✓</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          variant="outline"
          onClick={() => navigate("/")}
          className="border-border text-muted-foreground"
        >
          Ir ao Dashboard
        </Button>
        <Button
          className="orion-gradient text-primary-foreground px-6 orion-glow hover:opacity-90 transition-opacity"
          onClick={() => navigate("/diagnostico")}
        >
          Gerar Diagnóstico Inicial →
        </Button>
      </div>

      <p className="text-xs text-muted-foreground mt-6 max-w-md mx-auto">
        Próximo passo: o Orion analisa tudo isso e devolve um Score 0-100, semáforo por área e top gargalos. (Fase 2)
      </p>
    </div>
  );
};
