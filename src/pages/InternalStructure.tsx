import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Clock,
  ListTodo,
  Network,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCompanyDNA } from "@/hooks/useCompanyDNA";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { cn } from "@/lib/utils";

type OrgMember = {
  id: string;
  name: string | null;
  email: string | null;
  role_id: string;
  department: string | null;
  seniority: string | null;
  reports_to: string | null;
  status: string;
};

type CompanyRole = {
  id: string;
  title: string;
  area: string | null;
  seniority: string | null;
  responsibilities: string | null;
  headcount: number;
};

type TaskSummary = {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  created_by_ai: boolean;
};

const statusLabel: Record<string, string> = {
  active: "Ativo",
  pending: "Pendente",
  invited: "Convidado",
  inactive: "Inativo",
};

const roleLabel: Record<string, string> = {
  owner: "Dono",
  admin: "Admin",
  gestor: "Gestor",
  gestor_trafego: "Tráfego",
  designer: "Designer",
  copywriter: "Copy",
  financeiro: "Financeiro",
  social_media: "Social media",
  employee: "Equipe",
};

function formatDueDate(date: string | null) {
  if (!date) return "Sem prazo";
  return new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

const InternalStructure = () => {
  const { dna, loading: dnaLoading } = useCompanyDNA();
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [roles, setRoles] = useState<CompanyRole[]>([]);
  const [tasks, setTasks] = useState<TaskSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!dna?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const [membersRes, rolesRes, tasksRes] = await Promise.all([
      supabase
        .from("organization_members")
        .select("id,name,email,role_id,department,seniority,reports_to,status")
        .eq("company_dna_id", dna.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("company_role_definitions")
        .select("id,title,area,seniority,responsibilities,headcount")
        .eq("company_dna_id", dna.id)
        .order("area", { ascending: true }),
      supabase
        .from("tasks")
        .select("id,title,status,priority,due_date,created_by_ai")
        .eq("company_dna_id", dna.id)
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

    if (membersRes.data) setMembers(membersRes.data);
    if (rolesRes.data) setRoles(rolesRes.data);
    if (tasksRes.data) setTasks(tasksRes.data);
    setLoading(false);
  }, [dna?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeMembers = members.filter((member) => member.status === "active");
  const openTasks = tasks.filter((task) => !["done", "completed"].includes(task.status));
  const aiTasks = tasks.filter((task) => task.created_by_ai);
  const owners = members.filter((member) => ["owner", "admin", "gestor"].includes(member.role_id));

  const membersById = useMemo(() => {
    return members.reduce<Record<string, OrgMember>>((acc, member) => {
      acc[member.id] = member;
      return acc;
    }, {});
  }, [members]);

  const nextSteps = [
    {
      title: "Convidar responsáveis",
      description: "Adicione quem aprova, executa ou acompanha marketing.",
      path: "/team",
      icon: UserPlus,
      cta: "Abrir equipe",
    },
    {
      title: "Definir cargos e funções",
      description: "Transforme responsabilidades soltas em papéis claros.",
      path: "/onboarding",
      icon: BriefcaseBusiness,
      cta: "Revisar DNA",
    },
    {
      title: "Organizar permissões",
      description: "Controle quem pode aprovar, publicar e mexer em verba.",
      path: "/governance",
      icon: ShieldCheck,
      cta: "Ver governança",
    },
    {
      title: "Distribuir execução",
      description: "Converta prioridades do Orion em tarefas com responsáveis.",
      path: "/tasks",
      icon: ListTodo,
      cta: "Abrir tarefas",
    },
  ];

  if (dnaLoading || loading) {
    return <AppLayout><PageSkeleton variant="dashboard" /></AppLayout>;
  }

  if (!dna) {
    return (
      <AppLayout>
        <div className="p-4 sm:p-6 max-w-4xl mx-auto">
          <EmptyState
            icon={Network}
            title="Configure o Company DNA para montar a estrutura interna"
            description="O Orion usa o perfil da empresa para conectar cargos, permissões, tarefas e responsáveis à operação de marketing."
            action={{ label: "Preencher Company DNA", onClick: () => { window.location.href = "/onboarding"; } }}
          />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Badge variant="outline" className="mb-3 bg-primary/10 text-primary border-primary/20">
              Sistema operacional de marketing
            </Badge>
            <h1 className="text-display text-foreground">Estrutura Interna</h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Veja quem faz o quê, quais cargos sustentam o marketing e onde o Orion deve distribuir tarefas, aprovações e responsabilidades.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Link to="/team">
              <Button variant="outline" className="gap-2 w-full sm:w-auto">
                <Users className="w-4 h-4" /> Gerenciar equipe
              </Button>
            </Link>
            <Link to="/tasks">
              <Button className="orion-gradient text-primary-foreground gap-2 w-full sm:w-auto">
                <ListTodo className="w-4 h-4" /> Distribuir tarefas
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Membros ativos", value: activeMembers.length, icon: Users, tone: "text-orion-success" },
            { label: "Cargos definidos", value: roles.length, icon: BriefcaseBusiness, tone: "text-primary" },
            { label: "Tarefas abertas", value: openTasks.length, icon: Clock, tone: "text-orion-amber" },
            { label: "Criadas pela IA", value: aiTasks.length, icon: CheckCircle2, tone: "text-orion-violet-light" },
          ].map(({ label, value, icon: Icon, tone }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between gap-3">
                <Icon className={cn("w-4 h-4", tone)} />
                <span className="text-2xl font-semibold text-foreground">{value}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1.35fr_0.9fr] gap-4">
          <section className="bg-card border border-border rounded-xl p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Mapa operacional</h2>
                <p className="text-xs text-muted-foreground">Responsáveis, áreas e hierarquia básica do marketing.</p>
              </div>
              <Link to="/governance" className="text-xs text-primary hover:underline">Permissões</Link>
            </div>

            {members.length === 0 ? (
              <EmptyState
                icon={Users}
                title="Nenhum responsável cadastrado"
                description="Convide pessoas da equipe ou agência para o Orion distribuir tarefas, aprovações e rotinas com contexto."
                action={{ label: "Convidar responsável", onClick: () => { window.location.href = "/team"; }, variant: "outline" }}
              />
            ) : (
              <div className="space-y-2">
                {members.map((member) => {
                  const manager = member.reports_to ? membersById[member.reports_to] : null;
                  return (
                    <div key={member.id} className="rounded-lg border border-border bg-background/40 p-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {member.name || member.email || roleLabel[member.role_id] || "Responsável"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {[member.department, member.seniority, manager ? `responde a ${manager.name || manager.email}` : null].filter(Boolean).join(" • ") || "Área ainda não definida"}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">
                            {roleLabel[member.role_id] || member.role_id}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px]">
                            {statusLabel[member.status] || member.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="bg-card border border-border rounded-xl p-4 sm:p-5">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-foreground">Comando da operação</h2>
              <p className="text-xs text-muted-foreground">O mínimo que precisa estar claro para o Orion executar melhor.</p>
            </div>
            <div className="space-y-3">
              {nextSteps.map(({ title, description, path, icon: Icon, cta }) => (
                <Link key={title} to={path} className="group block rounded-lg border border-border bg-background/40 p-3 hover:border-primary/40 transition-colors">
                  <div className="flex items-start gap-3">
                    <Icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{title}</p>
                      <p className="text-xs text-muted-foreground">{description}</p>
                      <p className="text-xs text-primary mt-2 flex items-center gap-1">
                        {cta} <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <section className="bg-card border border-border rounded-xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Cargos e funções</h2>
                <p className="text-xs text-muted-foreground">Papéis internos ligados à execução de marketing.</p>
              </div>
              <Link to="/onboarding" className="text-xs text-primary hover:underline">Editar DNA</Link>
            </div>
            {roles.length === 0 ? (
              <EmptyState
                icon={BriefcaseBusiness}
                title="Cargos ainda não definidos"
                description="Cadastre funções como tráfego, social media, designer, copy e aprovação para o Orion sugerir responsáveis com menos fricção."
                action={{ label: "Definir cargos", onClick: () => { window.location.href = "/onboarding"; }, variant: "outline" }}
              />
            ) : (
              <div className="space-y-2">
                {roles.slice(0, 6).map((role) => (
                  <div key={role.id} className="rounded-lg border border-border bg-background/40 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{role.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {[role.area, role.seniority, role.headcount ? `${role.headcount} pessoa${role.headcount > 1 ? "s" : ""}` : null].filter(Boolean).join(" • ") || "Escopo a definir"}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0">função</Badge>
                    </div>
                    {role.responsibilities && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{role.responsibilities}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="bg-card border border-border rounded-xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Rotina de execução</h2>
                <p className="text-xs text-muted-foreground">Tarefas recentes que conectam decisão, responsável e entrega.</p>
              </div>
              <Link to="/tasks" className="text-xs text-primary hover:underline">Ver todas</Link>
            </div>
            {tasks.length === 0 ? (
              <EmptyState
                icon={ListTodo}
                title="Nenhuma tarefa conectada"
                description="Quando uma recomendação virar tarefa, ela aparecerá aqui para mostrar quem executa e o que está parado."
                action={{ label: "Criar tarefa", onClick: () => { window.location.href = "/tasks"; }, variant: "outline" }}
              />
            ) : (
              <div className="space-y-2">
                {tasks.slice(0, 6).map((task) => (
                  <div key={task.id} className="rounded-lg border border-border bg-background/40 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDueDate(task.due_date)} • {task.created_by_ai ? "criada pela IA" : "criada manualmente"}
                        </p>
                      </div>
                      <Badge variant={task.priority === "high" ? "destructive" : "outline"} className="text-[10px] shrink-0">
                        {task.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <section className="rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Como isso fecha o loop operacional</h2>
              <p className="text-xs text-muted-foreground max-w-3xl">
                A Central Orion detecta uma prioridade, transforma em decisão, cria tarefa ou aprovação, conecta com campanha/criativo/publicação e registra aprendizado na Base Estratégica.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Link to="/central">
                <Button variant="outline" className="gap-2 w-full sm:w-auto">
                  Ver prioridade <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/cerebro">
                <Button variant="outline" className="gap-2 w-full sm:w-auto">
                  Ver aprendizados <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
};

export default InternalStructure;
