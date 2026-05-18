import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Plus,
  GitBranch,
  Loader2,
  Megaphone,
  Users,
  Video,
  Package,
  Briefcase,
  Zap,
  LayoutGrid,
  ArrowRight,
  TrendingUp,
  Clock,
  ChevronRight,
  Sparkles,
} from "lucide-react";

import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FunnelRow {
  id: string;
  name: string;
  status: string;
  description?: string | null;
  created_at: string;
  node_count?: number;
}

// ─── Node type config (shared) ────────────────────────────────────────────────

export const NODE_TYPE_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string }
> = {
  entry:    { label: "Tráfego / Anúncio",   color: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/30"    },
  capture:  { label: "Captura de Lead",      color: "text-purple-400",  bg: "bg-purple-500/10",  border: "border-purple-500/30"  },
  content:  { label: "Conteúdo / VSL",       color: "text-teal-400",    bg: "bg-teal-500/10",    border: "border-teal-500/30"    },
  sales:    { label: "Página de Vendas",     color: "text-orange-400",  bg: "bg-orange-500/10",  border: "border-orange-500/30"  },
  checkout: { label: "Checkout / Pedido",    color: "text-green-400",   bg: "bg-green-500/10",   border: "border-green-500/30"   },
  upsell:   { label: "Upsell / OTO",         color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/30"   },
  downsell: { label: "Downsell",             color: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/30"     },
  delivery: { label: "Entrega / Obrigado",   color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  email:    { label: "Sequência de Email",   color: "text-violet-400",  bg: "bg-violet-500/10",  border: "border-violet-500/30"  },
  decision: { label: "Divisão / A-B",        color: "text-gray-400",    bg: "bg-gray-500/10",    border: "border-gray-500/30"    },
  ad:       { label: "Anúncio",              color: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/30"    },
  landing:  { label: "Landing Page",         color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  retention:{ label: "Retenção",             color: "text-cyan-400",    bg: "bg-cyan-500/10",    border: "border-cyan-500/30"    },
};

export function getNodeTypeConf(type?: string) {
  return NODE_TYPE_CONFIG[type ?? ""] ?? {
    label: type ?? "Passo",
    color: "text-muted-foreground",
    bg: "bg-muted/30",
    border: "border-border",
  };
}

// ─── Template definitions ─────────────────────────────────────────────────────

const NODE_W = 200;
const NODE_H = 90;
const V_STEP = 160;
const TOP_PAD = 60;
const CANVAS_CX = 350;

interface TemplateStep {
  node_type: string;
  title: string;
  description: string;
}

interface FunnelTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  steps: TemplateStep[];
}

const FUNNEL_TEMPLATES: FunnelTemplate[] = [
  {
    id: "lead_gen",
    name: "Geração de Leads",
    description: "Captura contatos e nutre via email até a conversão",
    icon: Users,
    colorClass: "text-purple-400",
    steps: [
      { node_type: "entry",   title: "Anúncio de Captação",  description: "Tráfego pago direcionado à isca digital" },
      { node_type: "capture", title: "Página de Captura",    description: "Formulário de opt-in com oferta irresistível" },
      { node_type: "email",   title: "Sequência de Nutrição",description: "Emails de educação e construção de relacionamento" },
      { node_type: "delivery",title: "Entrega da Isca",      description: "PDF, vídeo ou recurso prometido ao lead" },
    ],
  },
  {
    id: "webinar",
    name: "Funil de Webinar",
    description: "Inscrição, assistência e oferta ao vivo ou gravado",
    icon: Video,
    colorClass: "text-blue-400",
    steps: [
      { node_type: "entry",   title: "Anúncio do Webinar",   description: "Promove o evento ao público-alvo" },
      { node_type: "capture", title: "Inscrição no Webinar",  description: "Formulário de registro para o evento" },
      { node_type: "content", title: "Página do Webinar",     description: "Conteúdo de valor + pitch ao final" },
      { node_type: "sales",   title: "Oferta Especial",       description: "Proposta exclusiva para participantes" },
      { node_type: "checkout",title: "Checkout",              description: "Pagamento do produto/serviço oferecido" },
      { node_type: "delivery",title: "Área de Membros",       description: "Acesso ao produto ou próximos passos" },
    ],
  },
  {
    id: "product",
    name: "Produto Digital",
    description: "Venda direta com upsell para maximizar receita",
    icon: Package,
    colorClass: "text-orange-400",
    steps: [
      { node_type: "entry",    title: "Anúncio de Produto",   description: "Tráfego para a página de vendas" },
      { node_type: "sales",    title: "Página de Vendas",     description: "VSL + oferta + garantia" },
      { node_type: "checkout", title: "Order Bump",           description: "Complemento de baixo custo no checkout" },
      { node_type: "upsell",   title: "Upsell OTO",           description: "Oferta única de alta margem pós-compra" },
      { node_type: "delivery", title: "Área de Entrega",      description: "Boas-vindas e acesso ao produto" },
    ],
  },
  {
    id: "service",
    name: "Serviço / Consultoria",
    description: "Qualifica e agenda chamada para fechar negócios",
    icon: Briefcase,
    colorClass: "text-teal-400",
    steps: [
      { node_type: "entry",   title: "Anúncio de Conteúdo",  description: "Atrai leads qualificados com autoridade" },
      { node_type: "capture", title: "Isca de Qualificação",  description: "Recurso gratuito que filtra o ICP" },
      { node_type: "email",   title: "Nutrição por Email",    description: "Sequência de autoridade e provas sociais" },
      { node_type: "content", title: "Página de Aplicação",   description: "Formulário de pré-qualificação" },
      { node_type: "sales",   title: "Chamada de Vendas",     description: "Agendamento de reunião estratégica" },
      { node_type: "checkout",title: "Proposta / Fechamento", description: "Contrato e pagamento do serviço" },
      { node_type: "delivery",title: "Onboarding do Cliente", description: "Boas-vindas e início do projeto" },
    ],
  },
  {
    id: "tripwire",
    name: "Tripwire / Produto Isca",
    description: "Oferta de entrada + upsell de alto valor no bolso",
    icon: Zap,
    colorClass: "text-amber-400",
    steps: [
      { node_type: "entry",    title: "Anúncio Tripwire",     description: "Promove produto de entrada de baixo custo" },
      { node_type: "capture",  title: "Página de Captura",    description: "Email + oferta irresistível de entrada" },
      { node_type: "checkout", title: "Checkout Tripwire",    description: "Produto de R$7 a R$97 + order bump" },
      { node_type: "upsell",   title: "Produto Core",         description: "Oferta principal de alto valor" },
      { node_type: "delivery", title: "Área de Entrega",      description: "Acesso a todos os produtos comprados" },
    ],
  },
  {
    id: "custom",
    name: "Funil Personalizado",
    description: "Comece do zero com o canvas em branco",
    icon: LayoutGrid,
    colorClass: "text-gray-400",
    steps: [],
  },
];

// ─── Status badge config ──────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const conf: Record<string, { label: string; className: string }> = {
    draft:    { label: "Rascunho", className: "bg-muted/50 text-muted-foreground border-border" },
    active:   { label: "Ativo",    className: "bg-green-500/10 text-green-400 border-green-500/20" },
    paused:   { label: "Pausado",  className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    archived: { label: "Arquivado",className: "bg-red-500/10 text-red-400 border-red-500/20" },
  };
  const c = conf[status] ?? conf.draft;
  return <Badge className={cn("text-xs border", c.className)}>{c.label}</Badge>;
}

// ─── Funnel card ──────────────────────────────────────────────────────────────

function FunnelCard({ funnel, onClick }: { funnel: FunnelRow; onClick: () => void }) {
  const date = new Date(funnel.created_at).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <button
      onClick={onClick}
      className="group relative text-left rounded-2xl border border-border bg-card hover:border-primary/40 hover:bg-card/80 transition-all duration-200 p-5 flex flex-col gap-4 shadow-sm hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="rounded-xl bg-primary/10 border border-primary/20 p-2.5">
          <GitBranch className="w-5 h-5 text-primary" />
        </div>
        <StatusBadge status={funnel.status} />
      </div>

      <div className="space-y-1 flex-1">
        <h3 className="font-semibold text-foreground text-sm line-clamp-2 group-hover:text-primary transition-colors">
          {funnel.name}
        </h3>
        {funnel.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{funnel.description}</p>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/60 pt-3">
        <span className="flex items-center gap-1.5">
          <Clock className="w-3 h-3" />
          {date}
        </span>
        <span className="flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity font-medium">
          Abrir editor <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </button>
  );
}

// ─── Create Funnel Dialog ─────────────────────────────────────────────────────

function CreateFunnelDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (id: string) => void;
}) {
  const { user } = useAuth();
  const [step, setStep] = useState<"template" | "name">("template");
  const [selectedTemplate, setSelectedTemplate] = useState<FunnelTemplate | null>(null);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  const handleSelectTemplate = (template: FunnelTemplate) => {
    setSelectedTemplate(template);
    setName(template.id === "custom" ? "Meu Funil" : template.name);
    setStep("name");
  };

  const handleCreate = async () => {
    if (!user || !selectedTemplate || !name.trim()) return;
    setCreating(true);
    try {
      // 1. Create funnel
      const { data: funnelData, error: funnelError } = await (supabase
        .from("marketing_funnels" as any)
        .insert({
          user_id: user.id,
          name: name.trim(),
          description: selectedTemplate.id !== "custom" ? selectedTemplate.description : null,
          status: "draft",
        })
        .select("id")
        .single() as any);

      if (funnelError) throw funnelError;
      const funnelId = (funnelData as { id: string }).id;

      // 2. Create template nodes
      if (selectedTemplate.steps.length > 0) {
        const nodeInserts = selectedTemplate.steps.map((step, i) => ({
          user_id: user.id,
          funnel_id: funnelId,
          title: step.title,
          description: step.description,
          node_type: step.node_type,
          step_order: i,
          position: {
            x: CANVAS_CX - NODE_W / 2,
            y: TOP_PAD + i * V_STEP,
          },
          data: {},
          status: "draft",
        }));

        const { data: nodeData, error: nodeError } = await (supabase
          .from("funnel_nodes" as any)
          .insert(nodeInserts)
          .select("id") as any);

        if (nodeError) throw nodeError;

        // 3. Create edges between consecutive nodes
        const nodeIds = (nodeData as { id: string }[]).map((n) => n.id);
        if (nodeIds.length >= 2) {
          const edgeInserts = nodeIds.slice(0, -1).map((srcId, i) => ({
            user_id: user.id,
            funnel_id: funnelId,
            source_node_id: srcId,
            target_node_id: nodeIds[i + 1],
            label: null,
            data: {},
          }));

          await (supabase.from("funnel_edges" as any).insert(edgeInserts) as any);
        }
      }

      toast.success(`Funil "${name.trim()}" criado com sucesso.`);
      onCreated(funnelId);
      onOpenChange(false);
      setStep("template");
      setSelectedTemplate(null);
      setName("");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao criar funil");
    } finally {
      setCreating(false);
    }
  };

  const handleBack = () => {
    setStep("template");
    setSelectedTemplate(null);
    setName("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {step === "template" ? "Escolha um template de funil" : `Nomear funil — ${selectedTemplate?.name}`}
          </DialogTitle>
        </DialogHeader>

        {step === "template" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
            {FUNNEL_TEMPLATES.map((tmpl) => {
              const Icon = tmpl.icon;
              return (
                <button
                  key={tmpl.id}
                  onClick={() => handleSelectTemplate(tmpl)}
                  className="group rounded-xl border border-border bg-background hover:border-primary/50 hover:bg-primary/5 transition-all p-4 text-left space-y-2"
                >
                  <Icon className={cn("w-6 h-6", tmpl.colorClass)} />
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {tmpl.name}
                  </p>
                  <p className="text-xs text-muted-foreground leading-snug">{tmpl.description}</p>
                  {tmpl.steps.length > 0 && (
                    <p className="text-[11px] text-muted-foreground/70">
                      {tmpl.steps.length} passos pré-configurados
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-5 mt-2">
            {/* Template steps preview */}
            {selectedTemplate && selectedTemplate.steps.length > 0 && (
              <div className="rounded-xl border border-border bg-muted/20 p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
                  Passos incluídos
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedTemplate.steps.map((s, i) => {
                    const conf = getNodeTypeConf(s.node_type);
                    return (
                      <div key={i} className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            "text-[11px] font-medium px-2 py-1 rounded-md border",
                            conf.bg,
                            conf.color,
                            conf.border,
                          )}
                        >
                          {s.title}
                        </span>
                        {i < selectedTemplate.steps.length - 1 && (
                          <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Name field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Nome do funil</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Funil de Webinar Janeiro 2026"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !creating) handleCreate();
                }}
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <Button variant="ghost" onClick={handleBack} disabled={creating}>
                Voltar
              </Button>
              <Button
                onClick={handleCreate}
                disabled={creating || !name.trim()}
                className="orion-gradient text-primary-foreground gap-2"
              >
                {creating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Criar funil
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Funnels() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [funnels, setFunnels] = useState<FunnelRow[]>([]);
  const [createOpen, setCreateOpen] = useState(false);

  const fetchFunnels = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await (supabase
      .from("marketing_funnels" as any)
      .select("id, name, status, description, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }) as any);

    if (error) {
      toast.error("Erro ao carregar funis");
    } else {
      setFunnels((data ?? []) as FunnelRow[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchFunnels();
  }, [fetchFunnels]);

  const handleCreated = (id: string) => {
    navigate(`/funnels/${id}`);
  };

  if (loading) {
    return <AppLayout><PageSkeleton variant="dashboard" /></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-display text-foreground">Funis de Marketing</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Visualize, edite e otimize cada etapa da jornada do cliente.
            </p>
          </div>
          <Button
            className="orion-gradient text-primary-foreground gap-2 shrink-0"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Novo Funil
          </Button>
        </div>

        {/* Stats row */}
        {funnels.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: "Total de funis",
                value: funnels.length,
                icon: GitBranch,
                color: "text-primary",
              },
              {
                label: "Ativos",
                value: funnels.filter((f) => f.status === "active").length,
                icon: TrendingUp,
                color: "text-green-400",
              },
              {
                label: "Rascunhos",
                value: funnels.filter((f) => f.status === "draft").length,
                icon: Megaphone,
                color: "text-amber-400",
              },
              {
                label: "Pausados",
                value: funnels.filter((f) => f.status === "paused").length,
                icon: Clock,
                color: "text-muted-foreground",
              },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="rounded-xl border border-border bg-card p-4 flex items-center gap-3"
                >
                  <div className="rounded-lg bg-muted/30 p-2">
                    <Icon className={cn("w-4 h-4", stat.color)} />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Funnel grid or empty state */}
        {funnels.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <EmptyState
              icon={GitBranch}
              title="Nenhum funil criado ainda"
              description="Escolha um template pronto ou comece do zero para estruturar sua jornada de vendas."
              action={{
                label: "Criar primeiro funil",
                onClick: () => setCreateOpen(true),
              }}
              size="lg"
            />

            {/* Template quick-start grid */}
            <div className="border-t border-border p-6">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-4">
                Templates populares
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {FUNNEL_TEMPLATES.filter((t) => t.id !== "custom").map((tmpl) => {
                  const Icon = tmpl.icon;
                  return (
                    <button
                      key={tmpl.id}
                      onClick={() => setCreateOpen(true)}
                      className="group flex items-center gap-3 rounded-xl border border-border bg-background hover:border-primary/40 hover:bg-primary/5 transition-all p-3 text-left"
                    >
                      <div className="rounded-lg bg-muted/30 p-2 shrink-0">
                        <Icon className={cn("w-4 h-4", tmpl.colorClass)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          {tmpl.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{tmpl.steps.length} passos</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {funnels.map((funnel) => (
              <FunnelCard
                key={funnel.id}
                funnel={funnel}
                onClick={() => navigate(`/funnels/${funnel.id}`)}
              />
            ))}

            {/* "Create new" card */}
            <button
              onClick={() => setCreateOpen(true)}
              className="group rounded-2xl border-2 border-dashed border-border hover:border-primary/40 bg-transparent hover:bg-primary/5 transition-all p-5 flex flex-col items-center justify-center gap-3 min-h-[160px]"
            >
              <div className="rounded-xl bg-muted/30 group-hover:bg-primary/10 transition-colors p-3">
                <Plus className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <p className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                Novo funil
              </p>
            </button>
          </div>
        )}
      </div>

      <CreateFunnelDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={handleCreated}
      />
    </AppLayout>
  );
}
