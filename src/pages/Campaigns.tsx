import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Plus, Target, Megaphone, Calendar, DollarSign, TrendingUp,
  ChevronRight, Sparkles, Play, Pause, Archive, Eye, Pencil, Trash2, X
} from "lucide-react";
import { Link } from "react-router-dom";
import { PageHelpBanner } from "@/components/help/PageHelpBanner";
import { PAGE_HELP } from "@/lib/pageHelp";

interface Campaign {
  id: string;
  name: string;
  platform: string;
  status: string;
  objective: string | null;
  budget_daily: number | null;
  budget_total: number | null;
  start_date: string | null;
  end_date: string | null;
  targeting: Record<string, any>;
  created_at: string;
}

const platformOptions = [
  { value: "meta", label: "Meta Ads", icon: "📘" },
  { value: "google", label: "Google Ads", icon: "🔍" },
  { value: "tiktok", label: "TikTok Ads", icon: "🎵" },
  { value: "instagram", label: "Instagram Orgânico", icon: "📸" },
  { value: "linkedin", label: "LinkedIn", icon: "💼" },
  { value: "email", label: "E-mail Marketing", icon: "📧" },
  { value: "multi", label: "Multicanal", icon: "🌐" },
];

const objectiveOptions = [
  { value: "awareness", label: "Reconhecimento de marca" },
  { value: "traffic", label: "Tráfego para site/landing" },
  { value: "engagement", label: "Engajamento" },
  { value: "leads", label: "Geração de leads" },
  { value: "conversions", label: "Conversões / Vendas" },
  { value: "retention", label: "Retenção / Reengajamento" },
  { value: "launch", label: "Lançamento de produto" },
];

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: "Rascunho", color: "text-muted-foreground bg-muted/30", icon: Pencil },
  active: { label: "Ativa", color: "text-orion-success bg-orion-success/15", icon: Play },
  paused: { label: "Pausada", color: "text-orion-warning bg-orion-warning/15", icon: Pause },
  completed: { label: "Concluída", color: "text-orion-info bg-orion-info/15", icon: Archive },
};

const CampaignForm = ({
  onSubmit, onCancel
}: { onSubmit: (data: any) => void; onCancel: () => void }) => {
  const [form, setForm] = useState({
    name: "", platform: "meta", objective: "traffic", budget_daily: "",
    budget_total: "", start_date: "", end_date: "",
    audience: "", regions: "", age_range: "", strategy_notes: "",
  });

  const handleSubmit = () => {
    if (!form.name.trim()) { toast.error("Nome da campanha é obrigatório"); return; }
    onSubmit({
      name: form.name,
      platform: form.platform,
      objective: form.objective,
      budget_daily: form.budget_daily ? parseFloat(form.budget_daily) : null,
      budget_total: form.budget_total ? parseFloat(form.budget_total) : null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      targeting: {
        audience: form.audience,
        regions: form.regions,
        age_range: form.age_range,
        strategy_notes: form.strategy_notes,
      },
    });
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-heading text-foreground flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" /> Nova Campanha
        </h2>
        <Button variant="ghost" size="sm" onClick={onCancel}><X className="w-4 h-4" /></Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="text-xs text-muted-foreground mb-1 block">Nome da campanha *</label>
          <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
            placeholder="Ex: Black Friday 2026 — Meta Ads" className="bg-background" />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Canal / Plataforma</label>
          <Select value={form.platform} onValueChange={v => setForm({...form, platform: v})}>
            <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
            <SelectContent>
              {platformOptions.map(p => (
                <SelectItem key={p.value} value={p.value}>{p.icon} {p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Objetivo</label>
          <Select value={form.objective} onValueChange={v => setForm({...form, objective: v})}>
            <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
            <SelectContent>
              {objectiveOptions.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Orçamento diário (R$)</label>
          <Input type="number" value={form.budget_daily} onChange={e => setForm({...form, budget_daily: e.target.value})}
            placeholder="50.00" className="bg-background" />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Orçamento total (R$)</label>
          <Input type="number" value={form.budget_total} onChange={e => setForm({...form, budget_total: e.target.value})}
            placeholder="1500.00" className="bg-background" />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Data início</label>
          <Input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})}
            className="bg-background" />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Data término</label>
          <Input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})}
            className="bg-background" />
        </div>

        <div className="md:col-span-2">
          <label className="text-xs text-muted-foreground mb-1 block">Público-alvo</label>
          <Input value={form.audience} onChange={e => setForm({...form, audience: e.target.value})}
            placeholder="Ex: Empreendedores 25-45, interessados em marketing digital"
            className="bg-background" />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Regiões</label>
          <Input value={form.regions} onChange={e => setForm({...form, regions: e.target.value})}
            placeholder="Brasil, São Paulo" className="bg-background" />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Faixa etária</label>
          <Input value={form.age_range} onChange={e => setForm({...form, age_range: e.target.value})}
            placeholder="25-45" className="bg-background" />
        </div>

        <div className="md:col-span-2">
          <label className="text-xs text-muted-foreground mb-1 block">Notas de estratégia</label>
          <Textarea value={form.strategy_notes} onChange={e => setForm({...form, strategy_notes: e.target.value})}
            placeholder="Descreva a abordagem estratégica, tom de comunicação, diferenciais..." rows={3}
            className="bg-background resize-none" />
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button onClick={handleSubmit} className="orion-gradient text-primary-foreground gap-2">
          <Sparkles className="w-4 h-4" /> Criar campanha
        </Button>
      </div>
    </div>
  );
};

const CampaignCard = ({ campaign, onStatusChange, onDelete }: {
  campaign: Campaign;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}) => {
  const status = statusConfig[campaign.status] || statusConfig.draft;
  const StatusIcon = status.icon;
  const platformInfo = platformOptions.find(p => p.value === campaign.platform);
  const objInfo = objectiveOptions.find(o => o.value === campaign.objective);

  const daysRemaining = campaign.end_date
    ? Math.ceil((new Date(campaign.end_date).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{platformInfo?.icon || "🌐"}</span>
          <div>
            <h3 className="text-sm font-medium text-foreground">{campaign.name}</h3>
            <p className="text-[11px] text-muted-foreground">{platformInfo?.label}</p>
          </div>
        </div>
        <span className={cn("text-[10px] px-2 py-1 rounded-full flex items-center gap-1", status.color)}>
          <StatusIcon className="w-3 h-3" />
          {status.label}
        </span>
      </div>

      {objInfo && (
        <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
          <Target className="w-3 h-3" /> {objInfo.label}
        </p>
      )}

      <div className="grid grid-cols-3 gap-3 mb-4">
        {campaign.budget_daily && (
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Diário</p>
            <p className="text-sm font-medium text-foreground">R$ {campaign.budget_daily.toFixed(0)}</p>
          </div>
        )}
        {campaign.budget_total && (
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-sm font-medium text-foreground">R$ {campaign.budget_total.toFixed(0)}</p>
          </div>
        )}
        {daysRemaining !== null && (
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Restam</p>
            <p className={cn("text-sm font-medium", daysRemaining <= 3 ? "text-orion-coral" : "text-foreground")}>
              {daysRemaining > 0 ? `${daysRemaining}d` : "Encerrada"}
            </p>
          </div>
        )}
      </div>

      {campaign.start_date && (
        <p className="text-[11px] text-muted-foreground mb-3 flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {new Date(campaign.start_date).toLocaleDateString("pt-BR")}
          {campaign.end_date && ` → ${new Date(campaign.end_date).toLocaleDateString("pt-BR")}`}
        </p>
      )}

      <div className="flex gap-2 pt-3 border-t border-border">
        {campaign.status === "draft" && (
          <Button size="sm" variant="outline" className="text-xs flex-1 gap-1"
            onClick={() => onStatusChange(campaign.id, "active")}>
            <Play className="w-3 h-3" /> Ativar
          </Button>
        )}
        {campaign.status === "active" && (
          <Button size="sm" variant="outline" className="text-xs flex-1 gap-1"
            onClick={() => onStatusChange(campaign.id, "paused")}>
            <Pause className="w-3 h-3" /> Pausar
          </Button>
        )}
        {campaign.status === "paused" && (
          <Button size="sm" variant="outline" className="text-xs flex-1 gap-1"
            onClick={() => onStatusChange(campaign.id, "active")}>
            <Play className="w-3 h-3" /> Retomar
          </Button>
        )}
        <Link to={`/calendar?campaign=${campaign.id}`} className="flex-1">
          <Button size="sm" variant="outline" className="text-xs w-full gap-1">
            <Calendar className="w-3 h-3" /> Conteúdo
          </Button>
        </Link>
        <Button size="sm" variant="ghost" className="text-xs text-destructive"
          onClick={() => onDelete(campaign.id)}>
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};

const Campaigns = () => {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("all");

  const fetchCampaigns = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setCampaigns(data.map(c => ({ ...c, targeting: (c.targeting as Record<string, any>) || {} })));
    if (error) console.error(error);
    setLoading(false);
  };

  useEffect(() => { fetchCampaigns(); }, [user]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel("campaigns-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "campaigns", filter: `user_id=eq.${user.id}` },
        () => fetchCampaigns()
      ).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const handleCreate = async (data: any) => {
    if (!user) return;
    const { error } = await supabase.from("campaigns").insert({
      user_id: user.id,
      ...data,
    });
    if (error) toast.error("Erro ao criar campanha");
    else { toast.success("Campanha criada!"); setShowForm(false); }
  };

  const handleStatusChange = async (id: string, status: string) => {
    const { error } = await supabase.from("campaigns").update({ status }).eq("id", id);
    if (error) toast.error("Erro ao atualizar");
    else toast.success("Status atualizado!");
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("campaigns").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir");
    else toast.success("Campanha excluída!");
  };

  const filtered = filter === "all" ? campaigns : campaigns.filter(c => c.status === filter);
  const counts = {
    all: campaigns.length,
    draft: campaigns.filter(c => c.status === "draft").length,
    active: campaigns.filter(c => c.status === "active").length,
    paused: campaigns.filter(c => c.status === "paused").length,
    completed: campaigns.filter(c => c.status === "completed").length,
  };

  const totalBudget = campaigns.reduce((s, c) => s + (c.budget_total || 0), 0);
  const activeCampaigns = campaigns.filter(c => c.status === "active").length;

  if (loading) {
    return <AppLayout><div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 rounded-lg orion-gradient animate-pulse-glow" /></div></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-display text-foreground">Campanhas</h1>
            <p className="text-sm text-muted-foreground">Crie, gerencie e acompanhe todas as suas campanhas de marketing</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="orion-gradient text-primary-foreground gap-2">
            <Plus className="w-4 h-4" /> Nova campanha
          </Button>
        </div>

        <PageHelpBanner content={PAGE_HELP.campaigns} />

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total", value: counts.all, icon: Megaphone, color: "text-foreground" },
            { label: "Ativas", value: activeCampaigns, icon: Play, color: "text-orion-success" },
            { label: "Investimento total", value: `R$ ${totalBudget.toLocaleString("pt-BR")}`, icon: DollarSign, color: "text-orion-amber" },
            { label: "Rascunhos", value: counts.draft, icon: Pencil, color: "text-muted-foreground" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-orion-surface-2 flex items-center justify-center">
                <Icon className={cn("w-4 h-4", color)} />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">{value}</p>
                <p className="text-[10px] text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-2 border-b border-border pb-3">
          {([
            { key: "all", label: "Todas" },
            { key: "active", label: "Ativas" },
            { key: "draft", label: "Rascunhos" },
            { key: "paused", label: "Pausadas" },
            { key: "completed", label: "Concluídas" },
          ]).map(({ key, label }) => (
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
              {label} ({counts[key as keyof typeof counts]})
            </button>
          ))}
        </div>

        {showForm && <CampaignForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />}

        {filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <Megaphone className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-heading text-foreground mb-2">Nenhuma campanha criada</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
              Crie sua primeira campanha para organizar conteúdo, definir orçamentos e acompanhar resultados.
            </p>
            <Button variant="outline" onClick={() => setShowForm(true)} className="border-border gap-2">
              <Plus className="w-4 h-4" /> Criar primeira campanha
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(c => (
              <CampaignCard key={c.id} campaign={c} onStatusChange={handleStatusChange} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Campaigns;
