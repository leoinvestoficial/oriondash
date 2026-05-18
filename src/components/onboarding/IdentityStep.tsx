import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles } from "lucide-react";

interface Props {
  data: Record<string, string>;
  onUpdate: (key: string, value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const IdentityStep = ({ data, onUpdate, onNext, onBack }: Props) => {
  return (
    <div className="max-w-2xl w-full mx-auto animate-fade-in">
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="w-10 h-10 rounded-xl orion-gradient flex items-center justify-center text-primary-foreground shrink-0">
            <Sparkles className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-mono">IDENTIDADE</p>
            <h2 className="text-display text-foreground">Quem é a sua empresa</h2>
          </div>
        </div>
        <p className="text-muted-foreground text-sm sm:text-base">
          O essencial pro Orion falar como vocês: nome, produto, tom e o que é inegociável.
        </p>
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-foreground mb-2 font-medium">Nome da empresa</label>
            <Input
              value={data.companyName || ""}
              onChange={(e) => onUpdate("companyName", e.target.value)}
              placeholder="Ex: Acme Corp"
              className="bg-orion-surface-2 border-border focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm text-foreground mb-2 font-medium">Tom de voz (1 frase)</label>
            <Input
              value={data.toneOfVoice || ""}
              onChange={(e) => onUpdate("toneOfVoice", e.target.value)}
              placeholder="Ex: Direto, técnico, sem firula"
              className="bg-orion-surface-2 border-border focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm text-foreground mb-2 font-medium">Modelo de negócio</label>
            <Input
              value={data.businessModel || ""}
              onChange={(e) => onUpdate("businessModel", e.target.value)}
              placeholder="Ex: SaaS B2B, e-commerce, infoproduto, serviço recorrente"
              className="bg-orion-surface-2 border-border focus:border-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-foreground mb-2 font-medium">Produto ou serviço central</label>
          <Textarea
            rows={3}
            value={data.product || ""}
            onChange={(e) => onUpdate("product", e.target.value)}
            placeholder="O que vocês vendem e pra quem, em 2-3 linhas..."
            className="bg-orion-surface-2 border-border focus:border-primary resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-foreground mb-2 font-medium">Ticket médio</label>
            <Input
              value={data.avgTicket || ""}
              onChange={(e) => onUpdate("avgTicket", e.target.value)}
              placeholder="Ex: R$ 197 ou R$ 4.000/ano"
              className="bg-orion-surface-2 border-border focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm text-foreground mb-2 font-medium">Posicionamento desejado</label>
            <Input
              value={data.marketPositioning || ""}
              onChange={(e) => onUpdate("marketPositioning", e.target.value)}
              placeholder="Ex: premium, acessível, especialista, disruptor"
              className="bg-orion-surface-2 border-border focus:border-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-foreground mb-2 font-medium">Valores inegociáveis</label>
          <Textarea
            rows={2}
            value={data.values || ""}
            onChange={(e) => onUpdate("values", e.target.value)}
            placeholder="Ex: Transparência radical, sem clickbait, dados antes de opinião..."
            className="bg-orion-surface-2 border-border focus:border-primary resize-none"
          />
        </div>

        <div>
          <label className="block text-sm text-foreground mb-2 font-medium">Promessas que a marca faz</label>
          <Textarea
            rows={2}
            value={data.brandPromises || ""}
            onChange={(e) => onUpdate("brandPromises", e.target.value)}
            placeholder="Ex: clareza, agilidade, segurança, performance sem complicação..."
            className="bg-orion-surface-2 border-border focus:border-primary resize-none"
          />
        </div>

        <div>
          <label className="block text-sm text-foreground mb-2 font-medium">Diferencial competitivo em 1 frase</label>
          <Input
            value={data.competitiveEdge || ""}
            onChange={(e) => onUpdate("competitiveEdge", e.target.value)}
            placeholder="Ex: único player com operação full-service + dados proprietários"
            className="bg-orion-surface-2 border-border focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm text-foreground mb-2 font-medium">Exemplo de conteúdo/estética que representa bem a marca</label>
          <Textarea
            rows={2}
            value={data.lovedExample || ""}
            onChange={(e) => onUpdate("lovedExample", e.target.value)}
            placeholder="Descreva uma peça, campanha ou marca que traduz bem o padrão que vocês gostam."
            className="bg-orion-surface-2 border-border focus:border-primary resize-none"
          />
        </div>

        <div>
          <label className="block text-sm text-foreground mb-2 font-medium">
            Exemplo de algo que <span className="text-destructive">NUNCA</span> publicariam (e por quê)
          </label>
          <Textarea
            rows={2}
            value={data.vetoedExample || ""}
            onChange={(e) => onUpdate("vetoedExample", e.target.value)}
            placeholder="Descreva conteúdos/abordagens vetadas — isso evita que o Orion produza algo fora da marca."
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
