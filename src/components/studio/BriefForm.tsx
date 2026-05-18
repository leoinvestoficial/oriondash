import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";

interface BriefFormData {
  title: string;
  brief_type: string;
  objetivo: string;
  publico: string;
  mensagem_chave: string;
  angulo_criativo: string;
  hook_principal: string;
  formato: string;
  estrutura_peca: string;
  roteiro_base: string;
  tom: string;
  referencias: string;
  prompt_visual: string;
  testes_ab: string;
  cta: string;
  metricas_sucesso: string;
}

interface BriefFormProps {
  form: BriefFormData;
  onFormChange: (updater: (prev: BriefFormData) => BriefFormData) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export const BriefForm = ({ form, onFormChange, onSubmit, onCancel }: BriefFormProps) => {
  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h3 className="text-heading text-foreground">Novo Brief</h3>
        <Button variant="ghost" size="sm" onClick={onCancel}><X className="w-4 h-4" /></Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Título</label>
          <Input
            value={form.title}
            onChange={(e) => onFormChange(f => ({ ...f, title: e.target.value }))}
            placeholder="Título do brief"
            className="bg-orion-surface-2 border-border"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Tipo</label>
          <select
            value={form.brief_type}
            onChange={(e) => onFormChange(f => ({ ...f, brief_type: e.target.value }))}
            className="w-full h-10 rounded-md bg-orion-surface-2 border border-border px-3 text-sm text-foreground"
          >
            <option value="creative">Criativo</option>
            <option value="strategy">Estratégico</option>
            <option value="image_prompt">Prompt de Imagem</option>
            <option value="planning">Planejamento</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Objetivo</label>
          <Textarea
            value={form.objetivo}
            onChange={(e) => onFormChange(f => ({ ...f, objetivo: e.target.value }))}
            placeholder="O que este brief busca alcançar?"
            rows={2}
            className="bg-orion-surface-2 border-border resize-none"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Público-alvo</label>
          <Textarea
            value={form.publico}
            onChange={(e) => onFormChange(f => ({ ...f, publico: e.target.value }))}
            placeholder="Quem é o público?"
            rows={2}
            className="bg-orion-surface-2 border-border resize-none"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Mensagem-chave</label>
        <Input
          value={form.mensagem_chave}
          onChange={(e) => onFormChange(f => ({ ...f, mensagem_chave: e.target.value }))}
          placeholder="Qual a principal mensagem a ser transmitida?"
          className="bg-orion-surface-2 border-border"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Ângulo criativo</label>
          <Textarea
            value={form.angulo_criativo}
            onChange={(e) => onFormChange(f => ({ ...f, angulo_criativo: e.target.value }))}
            placeholder="Qual narrativa ou abordagem deve conduzir a peça?"
            rows={2}
            className="bg-orion-surface-2 border-border resize-none"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Hook principal</label>
          <Textarea
            value={form.hook_principal}
            onChange={(e) => onFormChange(f => ({ ...f, hook_principal: e.target.value }))}
            placeholder="Qual abertura deve capturar a atenção nos primeiros segundos?"
            rows={2}
            className="bg-orion-surface-2 border-border resize-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Formato</label>
          <Input
            value={form.formato}
            onChange={(e) => onFormChange(f => ({ ...f, formato: e.target.value }))}
            placeholder="Ex: Carrossel, Reels, Banner"
            className="bg-orion-surface-2 border-border"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Tom de voz</label>
          <Input
            value={form.tom}
            onChange={(e) => onFormChange(f => ({ ...f, tom: e.target.value }))}
            placeholder="Ex: Profissional, Descontraído"
            className="bg-orion-surface-2 border-border"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">CTA</label>
          <Input
            value={form.cta}
            onChange={(e) => onFormChange(f => ({ ...f, cta: e.target.value }))}
            placeholder="Call to action"
            className="bg-orion-surface-2 border-border"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Estrutura da peça</label>
          <Textarea
            value={form.estrutura_peca}
            onChange={(e) => onFormChange(f => ({ ...f, estrutura_peca: e.target.value }))}
            placeholder="Ex: hook, dor, prova, CTA..."
            rows={2}
            className="bg-orion-surface-2 border-border resize-none"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Roteiro base</label>
          <Textarea
            value={form.roteiro_base}
            onChange={(e) => onFormChange(f => ({ ...f, roteiro_base: e.target.value }))}
            placeholder="Sequência sugerida da narrativa ou do vídeo"
            rows={2}
            className="bg-orion-surface-2 border-border resize-none"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Referências visuais</label>
        <Textarea
          value={form.referencias}
          onChange={(e) => onFormChange(f => ({ ...f, referencias: e.target.value }))}
          placeholder="Links, estilos visuais, marcas de referência..."
          rows={2}
          className="bg-orion-surface-2 border-border resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Prompt visual</label>
          <Textarea
            value={form.prompt_visual}
            onChange={(e) => onFormChange(f => ({ ...f, prompt_visual: e.target.value }))}
            placeholder="Descreva a direção visual desejada"
            rows={2}
            className="bg-orion-surface-2 border-border resize-none"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Testes A/B</label>
          <Textarea
            value={form.testes_ab}
            onChange={(e) => onFormChange(f => ({ ...f, testes_ab: e.target.value }))}
            placeholder="Quais variações devem ser comparadas?"
            rows={2}
            className="bg-orion-surface-2 border-border resize-none"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Métricas de sucesso</label>
        <Input
          value={form.metricas_sucesso}
          onChange={(e) => onFormChange(f => ({ ...f, metricas_sucesso: e.target.value }))}
          placeholder="Como medir o sucesso deste brief?"
          className="bg-orion-surface-2 border-border"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} className="border-border">Cancelar</Button>
        <Button onClick={onSubmit} className="orion-gradient text-primary-foreground">Criar brief</Button>
      </div>
    </div>
  );
};
