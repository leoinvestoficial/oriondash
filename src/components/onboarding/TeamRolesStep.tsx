import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useRoleDefinitions } from "@/hooks/useRoleDefinitions";
import { Plus, Trash2, Sparkles, Users } from "lucide-react";

interface Props {
  data: Record<string, string>;
  onUpdate: (key: string, value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const TeamRolesStep = ({ data, onUpdate, onNext, onBack }: Props) => {
  const { roles, loading, create, remove, seedSuggested } = useRoleDefinitions();
  const [draft, setDraft] = useState({
    title: "",
    description: "",
    headcount: 1,
    seniority: "",
    area: "performance",
    responsibilities: "",
    tools: "",
  });

  const handleAdd = async () => {
    if (!draft.title.trim()) return;
    await create({
      title: draft.title.trim(),
      description: draft.description.trim() || undefined,
      headcount: Number(draft.headcount) || 1,
      seniority: draft.seniority || undefined,
      area: draft.area || undefined,
      responsibilities: draft.responsibilities.trim() || undefined,
      tools: draft.tools.trim() || undefined,
    });
    setDraft({
      title: "",
      description: "",
      headcount: 1,
      seniority: "",
      area: "performance",
      responsibilities: "",
      tools: "",
    });
  };

  return (
    <div className="max-w-3xl w-full mx-auto animate-fade-in px-1">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="w-10 h-10 rounded-xl orion-gradient flex items-center justify-center text-lg text-primary-foreground">
            <Users className="w-5 h-5" />
          </span>
          <div>
            <p className="text-xs text-muted-foreground font-mono">EQUIPE & CARGOS</p>
            <h2 className="text-display text-foreground">Estrutura do Time</h2>
          </div>
        </div>
        <p className="text-muted-foreground">
          Cadastre os cargos do seu time de marketing. Você poderá atribuir tarefas, decisões e convites por cargo, e o Orion adapta as recomendações ao tamanho real da operação.
        </p>
      </div>

      {/* Tamanho geral */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Tamanho do time de marketing</label>
          <Input
            type="number"
            min="0"
            placeholder="Ex: 5"
            value={data.team_size || ""}
            onChange={(e) => onUpdate("team_size", e.target.value)}
            className="bg-orion-surface-2 border-border"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Modelo</label>
          <Input
            placeholder="Interno, agência, híbrido..."
            value={data.model || ""}
            onChange={(e) => onUpdate("model", e.target.value)}
            className="bg-orion-surface-2 border-border"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Quem decide budget?</label>
          <Input
            placeholder="Ex: Head de Marketing + CEO"
            value={data.decision_maker || ""}
            onChange={(e) => onUpdate("decision_maker", e.target.value)}
            className="bg-orion-surface-2 border-border"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Decisões que exigem aprovação superior</label>
          <Textarea
            rows={2}
            placeholder="Ex: novo canal, aumento de budget acima de 20%, mudança de oferta..."
            value={data.approval_rules || ""}
            onChange={(e) => onUpdate("approval_rules", e.target.value)}
            className="bg-orion-surface-2 border-border resize-none"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Regras de delegação</label>
          <Textarea
            rows={2}
            placeholder="Ex: Head pode delegar para gestor; gestor pode delegar para analista e designer..."
            value={data.delegation_rules || ""}
            onChange={(e) => onUpdate("delegation_rules", e.target.value)}
            className="bg-orion-surface-2 border-border resize-none"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Observações sobre a estrutura (opcional)</label>
        <Textarea
          rows={2}
          placeholder="Ex: Ainda não temos analista de dados; designer é freelancer..."
          value={data.notes || ""}
          onChange={(e) => onUpdate("notes", e.target.value)}
          className="bg-orion-surface-2 border-border resize-none mb-6"
        />
      </div>

      {/* Cargos */}
      <div className="bg-card border border-border rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-foreground">Cargos cadastrados ({roles.length})</h3>
            <p className="text-xs text-muted-foreground">Adicione cada função do seu time</p>
          </div>
          {roles.length === 0 && (
            <Button variant="outline" size="sm" onClick={seedSuggested} className="gap-2">
              <Sparkles className="w-3 h-3" /> Sugerir cargos padrão
            </Button>
          )}
        </div>

        {loading ? (
          <p className="text-xs text-muted-foreground">Carregando…</p>
        ) : (
          <div className="space-y-2 mb-4">
            {roles.map((r) => (
              <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg bg-orion-surface-2 border border-border">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{r.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {r.area || "marketing"}
                    {r.seniority ? ` • ${r.seniority}` : ""} • {r.headcount} pessoa(s)
                  </p>
                  {(r.responsibilities || r.tools) && (
                    <p className="text-[11px] text-muted-foreground mt-1 truncate">
                      {[r.responsibilities, r.tools].filter(Boolean).join(" • ")}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => remove(r.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  aria-label="Remover cargo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {roles.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                Nenhum cargo ainda. Adicione abaixo ou use os sugeridos.
              </p>
            )}
          </div>
        )}

        {/* Form */}
        <div className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Input
              placeholder="Cargo (ex: Gestor de Tráfego)"
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              className="bg-orion-surface-2 border-border"
            />
            <Input
              placeholder="Descrição rápida"
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              className="bg-orion-surface-2 border-border"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <Select value={draft.area} onValueChange={(value) => setDraft((d) => ({ ...d, area: value }))}>
              <SelectTrigger className="bg-orion-surface-2 border-border">
                <SelectValue placeholder="Área" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="leadership">Liderança</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="creative">Criativo</SelectItem>
                <SelectItem value="social">Social</SelectItem>
                <SelectItem value="content">Conteúdo</SelectItem>
                <SelectItem value="crm">CRM</SelectItem>
                <SelectItem value="analytics">Analytics</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Senioridade"
              value={draft.seniority}
              onChange={(e) => setDraft((d) => ({ ...d, seniority: e.target.value }))}
              className="bg-orion-surface-2 border-border"
            />
            <Input
              type="number"
              min="1"
              placeholder="Qtd"
              value={draft.headcount}
              onChange={(e) => setDraft((d) => ({ ...d, headcount: Number(e.target.value) }))}
              className="bg-orion-surface-2 border-border"
            />
            <Button onClick={handleAdd} disabled={!draft.title.trim()} className="orion-gradient text-primary-foreground">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <Textarea
            rows={2}
            placeholder="Responsabilidades principais"
            value={draft.responsibilities}
            onChange={(e) => setDraft((d) => ({ ...d, responsibilities: e.target.value }))}
            className="bg-orion-surface-2 border-border resize-none"
          />
          <Input
            placeholder="Ferramentas usadas por esse cargo"
            value={draft.tools}
            onChange={(e) => setDraft((d) => ({ ...d, tools: e.target.value }))}
            className="bg-orion-surface-2 border-border"
          />
        </div>
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
