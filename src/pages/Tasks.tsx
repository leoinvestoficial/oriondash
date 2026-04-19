import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCompanyDNA } from "@/hooks/useCompanyDNA";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Plus, CheckCircle2, Clock, ListTodo, Sparkles, BarChart3 } from "lucide-react";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskForm } from "@/components/tasks/TaskForm";
import { PageHelpBanner } from "@/components/help/PageHelpBanner";
import { PAGE_HELP } from "@/lib/pageHelp";

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
  ai_context: string | null;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
}

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
    if (error) toast.error("Erro ao criar tarefa");
    else {
      toast.success("Tarefa criada!");
      setShowForm(false);
      setForm({ title: "", description: "", assignee_id: "", due_date: "", priority: "medium", category: "" });
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("tasks").update({ status }).eq("id", id);
    if (error) toast.error("Erro ao atualizar");
  };

  const getMemberName = (id: string | null) => members.find(m => m.id === id)?.name || "—";

  const filtered = filter === "all" ? tasks : tasks.filter(t => t.status === filter);
  const counts = {
    all: tasks.length,
    todo: tasks.filter(t => t.status === "todo").length,
    in_progress: tasks.filter(t => t.status === "in_progress").length,
    done: tasks.filter(t => t.status === "done").length,
  };
  const aiCreated = tasks.filter(t => t.created_by_ai).length;
  const overdue = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== "done").length;

  if (loading) {
    return <AppLayout><div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 rounded-lg orion-gradient animate-pulse-glow" /></div></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-display text-foreground">Tarefas</h1>
            <p className="text-sm text-muted-foreground">Gerencie o planejamento e tarefas da equipe</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="orion-gradient text-primary-foreground gap-2">
            <Plus className="w-4 h-4" /> Nova tarefa
          </Button>
        </div>

        <PageHelpBanner content={PAGE_HELP.tasks} />

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Total", value: counts.all, icon: BarChart3, color: "text-foreground" },
            { label: "A fazer", value: counts.todo, icon: ListTodo, color: "text-muted-foreground" },
            { label: "Em andamento", value: counts.in_progress, icon: Clock, color: "text-orion-info" },
            { label: "Concluídas", value: counts.done, icon: CheckCircle2, color: "text-orion-success" },
            { label: "Criadas por IA", value: aiCreated, icon: Sparkles, color: "text-orion-violet-light" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
              <Icon className={cn("w-4 h-4", color)} />
              <div>
                <p className="text-lg font-semibold text-foreground">{value}</p>
                <p className="text-[10px] text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {overdue > 0 && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-2.5 text-sm text-destructive flex items-center gap-2">
            ⚠️ {overdue} tarefa{overdue > 1 ? "s" : ""} atrasada{overdue > 1 ? "s" : ""}
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 border-b border-border pb-3">
          {(["all", "todo", "in_progress", "done"] as const).map((key) => {
            const labels = { all: "Todas", todo: "A fazer", in_progress: "Em andamento", done: "Concluídas" };
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-medium transition-colors",
                  filter === key
                    ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                )}
              >
                {labels[key]} ({counts[key]})
              </button>
            );
          })}
        </div>

        {/* Form */}
        {showForm && (
          <TaskForm
            form={form}
            members={members}
            onFormChange={setForm}
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* Tasks List */}
        {filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <ListTodo className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-heading text-foreground mb-2">Nenhuma tarefa ainda</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
              Crie tarefas manualmente ou peça ao Orion no chat para gerar um planejamento completo.
            </p>
            <Button variant="outline" onClick={() => setShowForm(true)} className="border-border gap-2">
              <Plus className="w-4 h-4" /> Criar primeira tarefa
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                memberName={getMemberName(task.assignee_id)}
                onStatusChange={updateStatus}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Tasks;
