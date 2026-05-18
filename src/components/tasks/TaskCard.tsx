import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, ListTodo, Sparkles, User, Calendar, ChevronDown, ChevronUp, LucideIcon } from "lucide-react";
import { useState } from "react";

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

const priorityConfig: Record<string, { label: string; className: string }> = {
  high: { label: "Alta", className: "bg-destructive/15 text-destructive" },
  medium: { label: "Média", className: "bg-orion-warning/15 text-orion-warning" },
  low: { label: "Baixa", className: "bg-muted text-muted-foreground" },
};

const statusConfig: Record<string, { label: string; icon: LucideIcon; className: string }> = {
  todo: { label: "A fazer", icon: ListTodo, className: "text-muted-foreground" },
  in_progress: { label: "Em andamento", icon: Clock, className: "text-orion-info" },
  done: { label: "Concluído", icon: CheckCircle2, className: "text-orion-success" },
};

const categoryLabels: Record<string, string> = {
  campanha: "Campanha",
  conteúdo: "Conteúdo",
  criativo: "Criativo",
  análise: "Análise",
  estratégia: "Estratégia",
};

interface TaskCardProps {
  task: Task;
  memberName: string;
  onStatusChange: (id: string, status: string) => void;
}

export const TaskCard = ({ task, memberName, onStatusChange }: TaskCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const status = statusConfig[task.status] || statusConfig.todo;
  const StatusIcon = status.icon;

  const nextStatus = task.status === "done" ? "todo" : task.status === "todo" ? "in_progress" : "done";
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== "done";

  return (
    <div
      className={cn(
        "bg-card border rounded-xl transition-all",
        expanded ? "border-primary/30 shadow-lg shadow-primary/5" : "border-border hover:border-primary/20",
        task.status === "done" && "opacity-60"
      )}
    >
      {/* Main row */}
      <div className="p-4 flex items-center gap-3">
        <button
          onClick={() => onStatusChange(task.id, nextStatus)}
          className={cn("shrink-0 transition-colors hover:scale-110", status.className)}
          title={`Mudar para: ${statusConfig[nextStatus]?.label}`}
        >
          <StatusIcon className="w-5 h-5" />
        </button>

        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className={cn(
              "text-sm font-medium",
              task.status === "done" ? "line-through text-muted-foreground" : "text-foreground"
            )}>
              {task.title}
            </h4>
            {task.created_by_ai && (
              <span className="flex items-center gap-0.5 text-[10px] text-orion-violet-light bg-orion-violet-light/10 px-1.5 py-0.5 rounded">
                <Sparkles className="w-2.5 h-2.5" /> IA
              </span>
            )}
            <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", priority.className)}>
              {priority.label}
            </span>
            {task.category && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                {categoryLabels[task.category] || task.category}
              </span>
            )}
          </div>
          {!expanded && task.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
          {task.assignee_id && (
            <span className="flex items-center gap-1 bg-orion-surface-2 px-2 py-1 rounded-md">
              <User className="w-3 h-3" />{memberName}
            </span>
          )}
          {task.due_date && (
            <span className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-md",
              isOverdue ? "bg-destructive/15 text-destructive" : "bg-orion-surface-2"
            )}>
              <Calendar className="w-3 h-3" />
              {new Date(task.due_date).toLocaleDateString("pt-BR")}
              {isOverdue && " ⚠️"}
            </span>
          )}
          <button onClick={() => setExpanded(!expanded)} className="text-muted-foreground hover:text-foreground">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-border/50 mt-0 space-y-3 animate-fade-in">
          {task.description && (
            <div className="pt-3">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Descrição</label>
              <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          {task.ai_context && (
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Contexto da IA</label>
              <p className="text-sm text-muted-foreground mt-1 italic">{task.ai_context}</p>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Status:</label>
            {(["todo", "in_progress", "done"] as const).map((s) => {
              const sc = statusConfig[s];
              const Icon = sc.icon;
              return (
                <button
                  key={s}
                  onClick={() => onStatusChange(task.id, s)}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors",
                    task.status === s
                      ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  )}
                >
                  <Icon className="w-3 h-3" />
                  {sc.label}
                </button>
              );
            })}
          </div>

          <div className="text-[10px] text-muted-foreground pt-1">
            Criada em {new Date(task.created_at).toLocaleDateString("pt-BR", {
              day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
            })}
          </div>
        </div>
      )}
    </div>
  );
};
