import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  data: Record<string, string>;
  onUpdate: (key: string, value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const BUSINESS_MODELS = [
  { value: "one_time", label: "Venda única", desc: "Produto ou serviço pontual" },
  { value: "subscription", label: "Recorrência", desc: "Assinatura ou mensalidade" },
  { value: "project", label: "Projetos", desc: "Contratos por escopo" },
  { value: "marketplace", label: "Marketplace", desc: "Plataforma / comissão" },
];

const PURCHASE_FREQUENCIES = [
  { value: "once", label: "Uma vez só" },
  { value: "monthly", label: "Mensal" },
  { value: "quarterly", label: "Trimestral" },
  { value: "yearly", label: "Anual" },
  { value: "irregular", label: "Irregular" },
];

export const SalesProductStep = ({ data, onUpdate, onNext, onBack }: Props) => {
  return (
    <div className="max-w-2xl w-full mx-auto animate-fade-in">
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="w-10 h-10 rounded-xl orion-gradient flex items-center justify-center text-primary-foreground shrink-0">
            <ShoppingCart className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-mono">PRODUTO & VENDAS</p>
            <h2 className="text-display text-foreground">O que você vende e como vende</h2>
          </div>
        </div>
        <p className="text-muted-foreground text-sm sm:text-base">
          Detalhes da oferta e processo de vendas — o Orion usa isso pra sugerir funis, scripts e oportunidades de recompra.
        </p>
      </div>

      <div className="space-y-6">
        {/* Model */}
        <div>
          <label className="block text-sm text-foreground mb-3 font-medium">Modelo de negócio principal</label>
          <div className="grid grid-cols-2 gap-2">
            {BUSINESS_MODELS.map((m) => {
              const active = data.business_model === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => onUpdate("business_model", m.value)}
                  className={cn(
                    "text-left p-3 rounded-lg border transition-all",
                    active
                      ? "bg-primary/10 border-primary"
                      : "bg-orion-surface-2 border-border hover:border-primary/40"
                  )}
                >
                  <p className="text-sm font-medium text-foreground">{m.label}</p>
                  <p className="text-xs text-muted-foreground">{m.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main offer */}
        <div>
          <label className="block text-sm text-foreground mb-2 font-medium">
            Oferta principal (nome, preço, o que entrega)
          </label>
          <Textarea
            rows={2}
            value={data.main_offer || ""}
            onChange={(e) => onUpdate("main_offer", e.target.value)}
            placeholder="Ex: Consultoria de tráfego pago — R$ 3.000/mês, gestão de Meta + Google + relatório semanal..."
            className="bg-orion-surface-2 border-border focus:border-primary resize-none"
          />
        </div>

        {/* Upsells */}
        <div>
          <label className="block text-sm text-foreground mb-2 font-medium">
            Upsell / cross-sell / produtos complementares
          </label>
          <Textarea
            rows={2}
            value={data.upsells || ""}
            onChange={(e) => onUpdate("upsells", e.target.value)}
            placeholder="Ex: Plano Plus (R$ 1.500 a mais), Criação de criativos, Consultoria estratégica pontual..."
            className="bg-orion-surface-2 border-border focus:border-primary resize-none"
          />
        </div>

        {/* Purchase frequency */}
        <div>
          <label className="block text-sm text-foreground mb-3 font-medium">Com que frequência clientes compram?</label>
          <div className="flex flex-wrap gap-2">
            {PURCHASE_FREQUENCIES.map((f) => {
              const active = data.purchase_frequency === f.value;
              return (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => onUpdate("purchase_frequency", f.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs border transition-all",
                    active
                      ? "bg-primary/15 border-primary/40 text-primary"
                      : "bg-orion-surface-2 border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Numbers */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5 font-medium">Nº de clientes ativos</label>
            <Input
              value={data.active_customers_count || ""}
              onChange={(e) => onUpdate("active_customers_count", e.target.value)}
              placeholder="250"
              inputMode="numeric"
              className="bg-orion-surface-2 border-border focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5 font-medium">Taxa de churn/mês (%)</label>
            <Input
              value={data.churn_rate || ""}
              onChange={(e) => onUpdate("churn_rate", e.target.value)}
              placeholder="5"
              inputMode="decimal"
              className="bg-orion-surface-2 border-border focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5 font-medium">NPS médio (se tiver)</label>
            <Input
              value={data.nps || ""}
              onChange={(e) => onUpdate("nps", e.target.value)}
              placeholder="72"
              inputMode="numeric"
              className="bg-orion-surface-2 border-border focus:border-primary"
            />
          </div>
        </div>

        {/* Sales process */}
        <div>
          <label className="block text-sm text-foreground mb-2 font-medium">
            Processo de vendas (como o lead vira cliente?)
          </label>
          <Textarea
            rows={3}
            value={data.sales_process || ""}
            onChange={(e) => onUpdate("sales_process", e.target.value)}
            placeholder="Ex: Lead → formulário → qualificação por WhatsApp → call de 30min → proposta → fechamento em 24h..."
            className="bg-orion-surface-2 border-border focus:border-primary resize-none"
          />
        </div>

        {/* Retention strategy */}
        <div>
          <label className="block text-sm text-foreground mb-2 font-medium">
            Estratégia de retenção e recompra (se houver)
          </label>
          <Textarea
            rows={2}
            value={data.retention_strategy || ""}
            onChange={(e) => onUpdate("retention_strategy", e.target.value)}
            placeholder="Ex: E-mail mensal de resultados, grupos VIP, cashback na próxima compra, upsell automático após 90 dias..."
            className="bg-orion-surface-2 border-border focus:border-primary resize-none"
          />
        </div>

        {/* Main promise / differentiator */}
        <div>
          <label className="block text-sm text-foreground mb-2 font-medium">
            Por que o cliente escolhe você e não o concorrente? (objeção final)
          </label>
          <Textarea
            rows={2}
            value={data.main_differentiator || ""}
            onChange={(e) => onUpdate("main_differentiator", e.target.value)}
            placeholder="Ex: entregamos resultado em 30 dias ou devolvemos; atendimento 1:1 sem terceirizar; único com integração nativa..."
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
