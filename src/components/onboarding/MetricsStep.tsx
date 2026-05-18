import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { BarChart3 } from "lucide-react";

interface Props {
  data: Record<string, string>;
  onUpdate: (key: string, value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const BOTTLENECKS = [
  "Pouco tráfego",
  "Tráfego caro",
  "Baixo CTR nos anúncios",
  "Baixa conversão no site",
  "Carrinho abandonado",
  "Pouca recompra",
  "Audiência errada",
  "Oferta fraca",
];

export const MetricsStep = ({ data, onUpdate, onNext, onBack }: Props) => {
  const selected = (data.perceived_bottlenecks || "").split(",").map((s) => s.trim()).filter(Boolean);

  const toggle = (item: string) => {
    const next = selected.includes(item) ? selected.filter((s) => s !== item) : [...selected, item];
    onUpdate("perceived_bottlenecks", next.join(", "));
  };

  const ratio =
    data.monthly_revenue && data.budget_monthly && Number(data.monthly_revenue) > 0
      ? (Number(data.budget_monthly) / Number(data.monthly_revenue)) * 100
      : null;

  return (
    <div className="max-w-2xl w-full mx-auto animate-fade-in">
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="w-10 h-10 rounded-xl orion-gradient flex items-center justify-center text-primary-foreground shrink-0">
            <BarChart3 className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-mono">NÚMEROS & FUNIL</p>
            <h2 className="text-display text-foreground">A realidade dos números</h2>
          </div>
        </div>
        <p className="text-muted-foreground text-sm sm:text-base">
          Preencha o que souber. O Orion usa esses números como baseline.
        </p>
      </div>

      <div className="space-y-6">
        {/* Receita & budget */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Faturamento mensal (R$)" k="monthly_revenue" v={data} on={onUpdate} ph="200000" />
          <Field label="Budget marketing/mês (R$)" k="budget_monthly" v={data} on={onUpdate} ph="20000" />
        </div>

        {ratio !== null && (
          <div className="bg-primary/5 border border-primary/10 rounded-xl p-3 text-xs text-foreground">
            Investe <strong className="text-primary">{ratio.toFixed(1)}%</strong> do faturamento em marketing —{" "}
            {ratio < 5 && "conservador (foco em ROI)."}
            {ratio >= 5 && ratio < 15 && "saudável (crescimento + eficiência)."}
            {ratio >= 15 && "agressivo (foco em escala)."}
          </div>
        )}

        {/* Unit economics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Field label="Ticket médio" k="avg_ticket" v={data} on={onUpdate} ph="197" />
          <Field label="Margem (%)" k="avg_margin_pct" v={data} on={onUpdate} ph="45" />
          <Field label="CAC atual" k="cac_current" v={data} on={onUpdate} ph="80" />
          <Field label="LTV" k="ltv_estimated" v={data} on={onUpdate} ph="540" />
        </div>

        {/* Funil */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Field label="Tráfego/mês" k="monthly_traffic" v={data} on={onUpdate} ph="25000" />
          <Field label="Conversão (%)" k="conversion_rate_pct" v={data} on={onUpdate} ph="2.4" />
          <Field label="ROAS médio" k="avg_roas" v={data} on={onUpdate} ph="2.8" />
        </div>

        <div>
          <label className="block text-sm text-foreground mb-2 font-medium">Meta principal de eficiência</label>
          <Textarea
            rows={2}
            value={data.target_metric || ""}
            onChange={(e) => onUpdate("target_metric", e.target.value)}
            placeholder="Ex: reduzir CAC para R$70, subir ROAS para 4x, elevar conversão para 3%..."
            className="bg-orion-surface-2 border-border focus:border-primary resize-none"
          />
        </div>

        {/* Bottlenecks */}
        <div>
          <label className="block text-sm text-foreground mb-2 font-medium">Onde sente o gargalo?</label>
          <div className="flex flex-wrap gap-2">
            {BOTTLENECKS.map((b) => {
              const active = selected.includes(b);
              return (
                <button
                  key={b}
                  type="button"
                  onClick={() => toggle(b)}
                  className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                    active
                      ? "bg-primary/15 border-primary/40 text-primary"
                      : "bg-orion-surface-2 border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {b}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tools */}
        <div>
          <label className="block text-sm text-foreground mb-2 font-medium">Ferramentas em uso</label>
          <Textarea
            rows={2}
            value={data.current_tools || ""}
            onChange={(e) => onUpdate("current_tools", e.target.value)}
            placeholder="Ex: Meta Ads, Google Ads, GA4, RD Station, Klaviyo..."
            className="bg-orion-surface-2 border-border focus:border-primary resize-none"
          />
        </div>

        <div>
          <label className="block text-sm text-foreground mb-2 font-medium">Observações sobre funil e operação comercial</label>
          <Textarea
            rows={2}
            value={data.funnel_notes || ""}
            onChange={(e) => onUpdate("funnel_notes", e.target.value)}
            placeholder="Ex: lead chega quente mas time demora a responder; landing converte mal no mobile..."
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

const Field = ({
  label,
  k,
  v,
  on,
  ph,
}: {
  label: string;
  k: string;
  v: Record<string, string>;
  on: (k: string, val: string) => void;
  ph: string;
}) => (
  <div>
    <label className="block text-xs text-muted-foreground mb-1.5 font-medium">{label}</label>
    <Input
      value={v[k] || ""}
      onChange={(e) => on(k, e.target.value)}
      placeholder={ph}
      inputMode="decimal"
      className="bg-orion-surface-2 border-border focus:border-primary"
    />
  </div>
);
