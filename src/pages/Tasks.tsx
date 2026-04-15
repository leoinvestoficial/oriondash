import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCompanyDNA } from "@/hooks/useCompanyDNA";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Plus, CheckCircle2, Clock, AlertCircle, Sparkles, Calendar,
  User, Filter, X, ListTodo,
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string | null;
  assignee_id: string | null;
  due_date: string | null;
  status: string;
  priority: string;
  category: string | null;
  created_by_ai: boolean;
  created_at: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
}

const priorityConfig = {
  high: { label: "Alta", className: "bg-destructive/15 text-destructive" },
  medium: { label: "Média", className: "bg-orion-warning/15 text-orion-warning" },
  low: { label: "Baixa", className: "bg-muted text-muted-foreground" },
};

const statusConfig = {
  todo: { label: "A fazer", icon: ListTodo, className: "text-muted-foreground" },
  in_progress: { label: "Em andamento", icon: Clock, className: "text-orion-info" },
  done: { label: "Concluído", icon: CheckCircle2, className: "text-orion-success" },
};

const Tasks = () => {
  const { user } = useAuth();
  const { dna } = useCompanyDNA();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [form, setForm] = useState({
    title: "", description: "", assignee_id: "", due_date: "", priority: "medium", category: "",
  });

  const fetchData = async () => {
    if (!user || !dna) return;
    const [tasksRes, membersRes] = await Promise.all([
      supabase.from("tasks").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("team_members").select("id, name, role").eq("company_dna_id", dna.id),
    ]);
    if (tasksRes.data) setTasks(tasksRes.data);
    if (membersRes.data) setMembers(membersRes.data);
    setLoading(false);
  };

  useEffect(() => { if (dna) fetchData(); }, [dna]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("tasks-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks", filter: `user_id=eq.${user.id}` },
        () => fetchData()
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, dna]);

  const handleCreate = async () => {
    if (!user || !dna || !form.title.trim()) { toast.error("Título é obrigatório"); return; }
    const { error } = await supabase.from("tasks").insert({
      user_id: user.id, company_dna_id: dna.id, title: form.title,
      description: form.description || null, assignee_id: form.assignee_id || null,
      due_date: form.due_date || null, priority: form.priority, category: form.category || null,
    });
    if (error) toast.error("Erro ao criar tarefa"); else { toast.success("Tarefa criada!"); setShowForm(false); setForm({ title: "", description: "", assignee_id: "", due_date: "", priority: "medium", category: "" }); }
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("tasks").update({ status }).eq("id", id);
    if (error) toast.error("Erro ao atualizar");
  };

  const getMemberName = (id: string | null) => members.find(m => m.id === id)?.name || "—";

  const filtered = filter === "all" ? tasks : tasks.filter(t => t.status === filter);
  const counts = { all: tasks.length, todo: tasks.filter(t => t.status === "todo").length, in_progress: tasks.filter(t => t.status === "in_progress").length, done: tasks.filter(t => t.status === "done").length };

  if (loading) {
    return <AppLayout><div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 rounded-lg orion-gradient animate-pulse-glow" /></div></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-display text-foreground">Tarefas</h1>
            <p className="text-sm text-muted-foreground">Planejamento e tarefas geradas pelo Orion para sua equipe</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="orion-gradient text-primary-foreground gap-2">
            <Plus className="w-4 h-4" /> Nova tarefa
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {(["all", "todo", "in_progress", "done"] as const).map((key) => (
            <button key={key} onClick={() => setFilter(key)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                filter === key ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
              )}>
              {key === "all" ? "Todas" : statusConfig[key].label} ({counts[key]})
            </button>
          ))}
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-card border border-border rounded-xl p-6 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="text-heading text-foreground">Nova tarefa</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}><X className="w-4 h-4" /></Button>
            </div>
            <Input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Título da tarefa" className="bg-orion-surface-2 border-border" />
            <Textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Descrição..." rows={2} className="bg-orion-surface-2 border-border resize-none" />
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Responsável</label>
                <select value={form.assignee_id} onChange={(e) => setForm(f => ({ ...f, assignee_id: e.target.value }))}
                  className="w-full h-10 rounded-md bg-orion-surface-2 border border-border px-3 text-sm text-foreground">
                  <option value="">Sem responsável</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Prazo</label>
                <Input type="date" value={form.due_date} onChange={(e) => setForm(f => ({ ...f, due_date: e.target.value }))}
                  className="bg-orion-surface-2 border-border" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Prioridade</label>
                <select value={form.priority} onChange={(e) => setForm(f => ({ ...f, priority: e.target.value }))}
                  className="w-full h-10 rounded-md bg-orion-surface-2 border border-border px-3 text-sm text-foreground">
                  <option value="low">Baixa</option>
                  <option value="medium">Média</option>
                  <option value="high">Alta</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)} className="border-border">Cancelar</Button>
              <Button onClick={handleCreate} className="orion-gradient text-primary-foreground">Criar tarefa</Button>
            </div>
          </div>
        )}

        {/* Tasks List */}
        {filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <ListTodo className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-heading text-foreground mb-2">Nenhuma tarefa ainda</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Crie tarefas manualmente ou peça ao Orion no chat para gerar um planejamento completo com tarefas para cada membro da equipe.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((task) => {
              const priority = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.medium;
              const status = statusConfig[task.status as keyof typeof statusConfig] || statusConfig.todo;
              const StatusIcon = status.icon;
              return (
                <div key={task.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 group hover:border-primary/20 transition-colors">
                  <button onClick={() => updateStatus(task.id, task.status === "done" ? "todo" : task.status === "todo" ? "in_progress" : "done")}
                    className={cn("shrink-0", status.className)}>
                    <StatusIcon className="w-5 h-5" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className={cn("text-sm font-medium", task.status === "done" ? "line-through text-muted-foreground" : "text-foreground")}>
                        {task.title}
                      </h4>
                      {task.created_by_ai && <Sparkles className="w-3 h-3 text-orion-violet-light shrink-0" />}
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded", priority.className)}>{priority.label}</span>
                    </div>
                    {task.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                    {task.assignee_id && (
                      <span className="flex items-center gap-1"><User className="w-3 h-3" />{getMemberName(task.assignee_id)}</span>
                    )}
                    {task.due_date && (
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(task.due_date).toLocaleDateString("pt-BR")}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Tasks;
