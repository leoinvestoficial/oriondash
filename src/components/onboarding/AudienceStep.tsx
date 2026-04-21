import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Users } from "lucide-react";

interface Props {
  data: Record<string, string>;
  onUpdate: (key: string, value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const AudienceStep = ({ data, onUpdate, onNext, onBack }: Props) => {
  return (
    <div className="max-w-2xl w-full mx-auto animate-fade-in">
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="w-10 h-10 rounded-xl orion-gradient flex items-center justify-center text-primary-foreground shrink-0">
            <Users className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-mono">PÚBLICO</p>
            <h2 className="text-display text-foreground">Pra quem você fala</h2>
          </div>
        </div>
        <p className="text-muted-foreground text-sm sm:text-base">
          Descreva 1 cliente ideal real — o Orion usa isso pra sugerir segmentações de anúncio.
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm text-foreground mb-2 font-medium">Cliente ideal (perfil + momento)</label>
          <Textarea
            rows={3}
            value={data.idealCustomer || ""}
            onChange={(e) => onUpdate("idealCustomer", e.target.value)}
            placeholder="Ex: Mulher 28-40, dona de pequeno negócio, fatura R$10-50k/mês, busca organizar finanças..."
            className="bg-orion-surface-2 border-border focus:border-primary resize-none"
          />
        </div>

        <div>
          <label className="block text-sm text-foreground mb-2 font-medium">Principal dor + principal desejo</label>
          <Textarea
            rows={3}
            value={data.motivations || ""}
            onChange={(e) => onUpdate("motivations", e.target.value)}
            placeholder="Dor: perde horas no Excel. Desejo: ter clareza do caixa em 1 tela..."
            className="bg-orion-surface-2 border-border focus:border-primary resize-none"
          />
        </div>

        <div>
          <label className="block text-sm text-foreground mb-2 font-medium">Linguagem que eles usam</label>
          <Textarea
            rows={2}
            value={data.language || ""}
            onChange={(e) => onUpdate("language", e.target.value)}
            placeholder="Termos, gírias, expressões — ou o que NÃO usar (ex: nada de 'leads', falam 'clientes')..."
            className="bg-orion-surface-2 border-border focus:border-primary resize-none"
          />
        </div>
      </div>

      <div className="flex items-center justify-between mt-8 pt-6 border-t border-border gap-2">
        <Button variant="ghost" onClick={onBack} className="text-muted-foreground">← Voltar</Button>
        <Button onClick={onNext} className="orion-gradient text-primary-foreground px-4 sm:px-6 orion-glow hover:opacity-90">
          Próximo →
        </Button>
      </div>
    </div>
  );
};
