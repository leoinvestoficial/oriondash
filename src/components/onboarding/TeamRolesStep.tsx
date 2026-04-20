import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRoleDefinitions, SUGGESTED_MARKETING_ROLES } from "@/hooks/useRoleDefinitions";
import { Plus, Trash2, Sparkles, Users } from "lucide-react";

interface Props {
  data: Record<string, string>;
  onUpdate: (key: string, value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const TeamRolesStep = ({ data, onUpdate, onNext, onBack }: Props) => {
  const { roles, loading, create, remove, seedSuggested } = useRoleDefinitions();
  const [draft, setDraft] = useState({ title: "", description: "", headcount: 1, seniority: "" });

  const handleAdd = async () => {
    if (!draft.title.trim()) return;
    await create({
      title: draft.title.trim(),
      description: draft.description.trim() || undefined,
      headcount: Number(draft.headcount) || 1,
      seniority: draft.seniority || undefined,
    });
    setDraft({ title: "", description: "", headcount: 1, seniority: "" });
  };

  return (
    <div className="max-w-3xl w-full mx-auto animate-fade-in">
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
                    {r.description || "—"}
                    {r.seniority ? ` • ${r.seniority}` : ""} • {r.headcount} pessoa(s)
                  </p>
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
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
          <Input
            placeholder="Cargo (ex: Gestor de Tráfego)"
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            className="bg-orion-surface-2 border-border md:col-span-4"
          />
          <Input
            placeholder="Descrição rápida"
            value={draft.description}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
            className="bg-orion-surface-2 border-border md:col-span-4"
          />
          <Input
            placeholder="Sênior."
            value={draft.seniority}
            onChange={(e) => setDraft((d) => ({ ...d, seniority: e.target.value }))}
            className="bg-orion-surface-2 border-border md:col-span-2"
          />
          <Input
            type="number"
            min="1"
            placeholder="Qtd"
            value={draft.headcount}
            onChange={(e) => setDraft((d) => ({ ...d, headcount: Number(e.target.value) }))}
            className="bg-orion-surface-2 border-border md:col-span-1"
          />
          <Button onClick={handleAdd} disabled={!draft.title.trim()} className="orion-gradient text-primary-foreground md:col-span-1">
            <Plus className="w-4 h-4" />
          </Button>
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
