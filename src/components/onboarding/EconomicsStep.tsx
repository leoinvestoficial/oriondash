import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DollarSign } from "lucide-react";

interface EconomicsStepProps {
  data: Record<string, string>;
  onUpdate: (key: string, value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const FIELDS: Array<{ key: string; label: string; placeholder: string; type?: "text" | "textarea"; hint?: string }> = [
  { key: "avg_ticket", label: "Ticket médio (R$)", placeholder: "Ex: 197", hint: "Valor médio de uma compra/contrato." },
  { key: "avg_margin_pct", label: "Margem média por venda (%)", placeholder: "Ex: 45", hint: "Quanto sobra após custos diretos." },
  { key: "cac_current", label: "CAC atual (R$)", placeholder: "Ex: 80", hint: "Custo médio para adquirir 1 cliente hoje." },
  { key: "ltv_estimated", label: "LTV estimado (R$)", placeholder: "Ex: 540", hint: "Receita total esperada por cliente." },
  { key: "payback_months", label: "Payback (meses)", placeholder: "Ex: 3", hint: "Tempo para recuperar o CAC." },
  { key: "monthly_revenue", label: "Receita mensal atual (R$)", placeholder: "Ex: 120000" },
  { key: "notes", label: "Observações sobre os números", placeholder: "Sazonalidade, mix de produtos, distorções...", type: "textarea" },
];

export const EconomicsStep = ({ data, onUpdate, onNext, onBack }: EconomicsStepProps) => {
  const filled = FIELDS.filter((f) => data[f.key]?.toString().trim()).length;
  const progress = (filled / FIELDS.length) * 100;

  return (
    <div className="max-w-2xl w-full mx-auto animate-fade-in">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="w-10 h-10 rounded-xl orion-gradient flex items-center justify-center text-primary-foreground">
            <DollarSign className="w-5 h-5" />
          </span>
          <div>
            <p className="text-xs text-muted-foreground font-mono">UNIT ECONOMICS</p>
            <h2 className="text-display text-foreground">Os números do seu negócio</h2>
          </div>
        </div>
        <p className="text-muted-foreground">
          O Orion precisa entender ticket, margem, CAC e LTV para diagnosticar gargalos reais — não palpites.
        </p>
        <div className="mt-4 h-1 bg-muted rounded-full overflow-hidden">
          <div className="h-full orion-gradient transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-muted-foreground mt-1">{filled} de {FIELDS.length} campos preenchidos</p>
      </div>

      <div className="space-y-5">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label className="block text-sm text-foreground mb-2 font-medium">{f.label}</label>
            {f.type === "textarea" ? (
              <Textarea
                value={data[f.key] || ""}
                onChange={(e) => onUpdate(f.key, e.target.value)}
                placeholder={f.placeholder}
                rows={3}
                className="bg-orion-surface-2 border-border focus:border-primary resize-none"
              />
            ) : (
              <Input
                value={data[f.key] || ""}
                onChange={(e) => onUpdate(f.key, e.target.value)}
                placeholder={f.placeholder}
                inputMode="decimal"
                className="bg-orion-surface-2 border-border focus:border-primary"
              />
            )}
            {f.hint && <p className="text-xs text-muted-foreground mt-1">{f.hint}</p>}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-10 pt-6 border-t border-border">
        <Button variant="ghost" onClick={onBack} className="text-muted-foreground">← Voltar</Button>
        <Button onClick={onNext} className="orion-gradient text-primary-foreground px-6 orion-glow hover:opacity-90">
          Próximo bloco →
        </Button>
      </div>
    </div>
  );
};
