import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCompanyDNA } from "@/hooks/useCompanyDNA";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Trash2, UserPlus, Users, Edit2, Save, X } from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
  responsibilities: string | null;
}

const Team = () => {
  const { user } = useAuth();
  const { dna, loading: dnaLoading } = useCompanyDNA();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", role: "", department: "", responsibilities: "" });

  const fetchMembers = async () => {
    if (!dna) return;
    const { data, error } = await supabase
      .from("team_members")
      .select("*")
      .eq("company_dna_id", dna.id)
      .order("created_at", { ascending: true });
    if (!error && data) setMembers(data);
    setLoading(false);
  };

  useEffect(() => { if (dna) fetchMembers(); }, [dna]);

  const handleSave = async () => {
    if (!user || !dna || !form.name || !form.email) {
      toast.error("Nome e email são obrigatórios");
      return;
    }

    if (editingId) {
      const { error } = await supabase.from("team_members").update({
        name: form.name, email: form.email, role: form.role,
        department: form.department || null, responsibilities: form.responsibilities || null,
      }).eq("id", editingId);
      if (error) toast.error("Erro ao atualizar"); else toast.success("Membro atualizado!");
    } else {
      const { error } = await supabase.from("team_members").insert({
        user_id: user.id, company_dna_id: dna.id,
        name: form.name, email: form.email, role: form.role,
        department: form.department || null, responsibilities: form.responsibilities || null,
      });
      if (error) toast.error("Erro ao adicionar"); else toast.success("Membro adicionado!");
    }

    setForm({ name: "", email: "", role: "", department: "", responsibilities: "" });
    setShowForm(false);
    setEditingId(null);
    fetchMembers();
  };

  const handleEdit = (member: TeamMember) => {
    setForm({
      name: member.name, email: member.email, role: member.role,
      department: member.department || "", responsibilities: member.responsibilities || "",
    });
    setEditingId(member.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("team_members").delete().eq("id", id);
    if (error) toast.error("Erro ao remover"); else { toast.success("Membro removido"); fetchMembers(); }
  };

  if (dnaLoading || loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 rounded-lg orion-gradient animate-pulse-glow" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-display text-foreground">Equipe</h1>
            <p className="text-sm text-muted-foreground">
              Cadastre os membros da equipe para o Orion distribuir tarefas contextualizadas
            </p>
          </div>
          <Button onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: "", email: "", role: "", department: "", responsibilities: "" }); }}
            className="orion-gradient text-primary-foreground gap-2">
            <UserPlus className="w-4 h-4" /> Adicionar membro
          </Button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-card border border-border rounded-xl p-6 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-heading text-foreground">{editingId ? "Editar membro" : "Novo membro"}</h3>
              <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setEditingId(null); }}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Nome *</label>
                <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Nome completo" className="bg-orion-surface-2 border-border" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Email *</label>
                <Input value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="email@empresa.com" className="bg-orion-surface-2 border-border" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Cargo</label>
                <Input value={form.role} onChange={(e) => setForm(f => ({ ...f, role: e.target.value }))}
                  placeholder="Ex: Designer, Analista de Mídia..." className="bg-orion-surface-2 border-border" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Departamento</label>
                <Input value={form.department} onChange={(e) => setForm(f => ({ ...f, department: e.target.value }))}
                  placeholder="Ex: Marketing, Criação..." className="bg-orion-surface-2 border-border" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Responsabilidades no processo de marketing</label>
              <Textarea value={form.responsibilities} onChange={(e) => setForm(f => ({ ...f, responsibilities: e.target.value }))}
                placeholder="Descreva o que essa pessoa faz no processo..." rows={2}
                className="bg-orion-surface-2 border-border resize-none" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setShowForm(false); setEditingId(null); }} className="border-border">Cancelar</Button>
              <Button onClick={handleSave} className="orion-gradient text-primary-foreground gap-2">
                <Save className="w-4 h-4" /> {editingId ? "Salvar" : "Adicionar"}
              </Button>
            </div>
          </div>
        )}

        {/* Members List */}
        {members.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-heading text-foreground mb-2">Nenhum membro cadastrado</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Cadastre os membros da sua equipe de marketing para que o Orion possa distribuir tarefas e planejamentos personalizados.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {members.map((member) => (
              <div key={member.id} className="bg-card border border-border rounded-xl p-5 flex items-start gap-4 group hover:border-primary/30 transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm text-primary font-medium shrink-0">
                  {member.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm text-foreground font-medium">{member.name}</h4>
                    {member.role && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">{member.role}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{member.email}</p>
                  {member.department && <p className="text-xs text-muted-foreground mt-0.5">📂 {member.department}</p>}
                  {member.responsibilities && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">💼 {member.responsibilities}</p>
                  )}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(member)} className="text-muted-foreground hover:text-foreground">
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(member.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Team;
