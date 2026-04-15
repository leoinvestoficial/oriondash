import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  role: string;
}

interface TaskFormData {
  title: string;
  description: string;
  assignee_id: string;
  due_date: string;
  priority: string;
  category: string;
}

interface TaskFormProps {
  form: TaskFormData;
  members: TeamMember[];
  onFormChange: (updater: (prev: TaskFormData) => TaskFormData) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export const TaskForm = ({ form, members, onFormChange, onSubmit, onCancel }: TaskFormProps) => {
  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h3 className="text-heading text-foreground">Nova tarefa</h3>
        <Button variant="ghost" size="sm" onClick={onCancel}><X className="w-4 h-4" /></Button>
      </div>
      <Input
        value={form.title}
        onChange={(e) => onFormChange(f => ({ ...f, title: e.target.value }))}
        placeholder="Título da tarefa"
        className="bg-orion-surface-2 border-border"
      />
      <Textarea
        value={form.description}
        onChange={(e) => onFormChange(f => ({ ...f, description: e.target.value }))}
        placeholder="Descrição detalhada..."
        rows={3}
        className="bg-orion-surface-2 border-border resize-none"
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Responsável</label>
          <select
            value={form.assignee_id}
            onChange={(e) => onFormChange(f => ({ ...f, assignee_id: e.target.value }))}
            className="w-full h-10 rounded-md bg-orion-surface-2 border border-border px-3 text-sm text-foreground"
          >
            <option value="">Sem responsável</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Prazo</label>
          <Input
            type="date"
            value={form.due_date}
            onChange={(e) => onFormChange(f => ({ ...f, due_date: e.target.value }))}
            className="bg-orion-surface-2 border-border"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Prioridade</label>
          <select
            value={form.priority}
            onChange={(e) => onFormChange(f => ({ ...f, priority: e.target.value }))}
            className="w-full h-10 rounded-md bg-orion-surface-2 border border-border px-3 text-sm text-foreground"
          >
            <option value="low">Baixa</option>
            <option value="medium">Média</option>
            <option value="high">Alta</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Categoria</label>
          <select
            value={form.category}
            onChange={(e) => onFormChange(f => ({ ...f, category: e.target.value }))}
            className="w-full h-10 rounded-md bg-orion-surface-2 border border-border px-3 text-sm text-foreground"
          >
            <option value="">Sem categoria</option>
            <option value="campanha">Campanha</option>
            <option value="conteúdo">Conteúdo</option>
            <option value="criativo">Criativo</option>
            <option value="análise">Análise</option>
            <option value="estratégia">Estratégia</option>
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} className="border-border">Cancelar</Button>
        <Button onClick={onSubmit} className="orion-gradient text-primary-foreground">Criar tarefa</Button>
      </div>
    </div>
  );
};
