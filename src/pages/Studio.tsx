import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Plus, Sparkles, FileText, Palette, Target, BookOpen } from "lucide-react";
import { BriefCard, BriefDetail } from "@/components/studio/BriefCard";
import { BriefForm } from "@/components/studio/BriefForm";
import { PageHelpBanner } from "@/components/help/PageHelpBanner";
import { PAGE_HELP } from "@/lib/pageHelp";
import { usePublicationJobs } from "@/hooks/usePublicationJobs";
import type { PublicationChannel, PublicationType } from "@/lib/publicationProviders";

interface Brief {
  id: string;
  title: string;
  brief_type: string;
  status: string;
  content: Record<string, any>;
  campaign_id: string | null;
  created_at: string;
  updated_at: string;
}

const emptyForm = {
  title: "", brief_type: "creative", objetivo: "", publico: "",
  mensagem_chave: "", formato: "", tom: "", referencias: "", cta: "", metricas_sucesso: "",
};

const Studio = () => {
  const { user } = useAuth();
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState(emptyForm);
  const [publicationBrief, setPublicationBrief] = useState<Brief | null>(null);
  const [publicationForm, setPublicationForm] = useState({
    channel: "instagram" as PublicationChannel,
    publication_type: "organic_post" as PublicationType,
    scheduled_at: "",
    objective: "",
  });
  const { createDraft } = usePublicationJobs();

  const fetchBriefs = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("creative_briefs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) {
      setBriefs(data.map(b => ({ ...b, content: (b.content as Record<string, any>) || {} })));
      if (!selected && data.length > 0) setSelected(data[0].id);
    }
    if (error) console.error(error);
    setLoading(false);
  };

  useEffect(() => { fetchBriefs(); }, [user]);

  // Realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("briefs-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "creative_briefs", filter: `user_id=eq.${user.id}` },
        () => fetchBriefs()
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleCreate = async () => {
    if (!user || !form.title.trim()) { toast.error("Título é obrigatório"); return; }
    const content: Record<string, string> = {};
    if (form.objetivo) content.objetivo = form.objetivo;
    if (form.publico) content.publico = form.publico;
    if (form.mensagem_chave) content.mensagem_chave = form.mensagem_chave;
    if (form.formato) content.formato = form.formato;
    if (form.tom) content.tom = form.tom;
    if (form.referencias) content.referencias = form.referencias;
    if (form.cta) content.cta = form.cta;
    if (form.metricas_sucesso) content.metricas_sucesso = form.metricas_sucesso;

    const { error } = await supabase.from("creative_briefs").insert({
      user_id: user.id,
      title: form.title,
      brief_type: form.brief_type,
      content: content as any,
    });
    if (error) toast.error("Erro ao criar brief");
    else {
      toast.success("Brief criado!");
      setShowForm(false);
      setForm(emptyForm);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("creative_briefs").update({ status }).eq("id", id);
    if (error) toast.error("Erro ao atualizar status");
  };

  const preparePublication = async () => {
    if (!publicationBrief) return;
    const content = publicationBrief.content || {};
    const caption = [
      content.mensagem_chave || content.hook_principal || content.objetivo || publicationBrief.title,
      content.cta ? `\n${content.cta}` : "",
    ].filter(Boolean).join("\n");

    await createDraft({
      source_type: "creative_brief",
      source_id: publicationBrief.id,
      campaign_id: publicationBrief.campaign_id,
      channel: publicationForm.channel,
      publication_type: publicationForm.publication_type,
      title: `Publicação — ${publicationBrief.title}`,
      copy: String(content.mensagem_chave || content.roteiro_base || ""),
      caption,
      scheduled_at: publicationForm.scheduled_at ? new Date(publicationForm.scheduled_at).toISOString() : null,
      autonomy_level: "assisted_execution",
      requires_approval: true,
      data_origin: "mock",
    });
    setPublicationBrief(null);
  };

  const filtered = filter === "all" ? briefs : briefs.filter(b => b.brief_type === filter);
  const selectedBrief = briefs.find(b => b.id === selected);

  const typeCounts = {
    all: briefs.length,
    creative: briefs.filter(b => b.brief_type === "creative").length,
    strategy: briefs.filter(b => b.brief_type === "strategy").length,
    image_prompt: briefs.filter(b => b.brief_type === "image_prompt").length,
    planning: briefs.filter(b => b.brief_type === "planning").length,
  };

  if (loading) {
    return <AppLayout><div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 rounded-lg orion-gradient animate-pulse-glow" /></div></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-display text-foreground">Estúdio Criativo</h1>
            <p className="text-sm text-muted-foreground">Briefs criativos, guias estratégicos e prompts gerados pelo Orion</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="orion-gradient text-primary-foreground gap-2">
            <Plus className="w-4 h-4" /> Novo brief
          </Button>
        </div>

        <PageHelpBanner content={PAGE_HELP.studio} />

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Total", value: typeCounts.all, icon: FileText, color: "text-foreground" },
            { label: "Criativos", value: typeCounts.creative, icon: Palette, color: "text-orion-coral" },
            { label: "Estratégicos", value: typeCounts.strategy, icon: Target, color: "text-orion-teal" },
            { label: "Prompts", value: typeCounts.image_prompt, icon: Sparkles, color: "text-orion-violet-light" },
            { label: "Planejamentos", value: typeCounts.planning, icon: BookOpen, color: "text-orion-info" },
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

        {/* Filters */}
        <div className="flex gap-2 border-b border-border pb-3">
          {([
            { key: "all", label: "Todos" },
            { key: "creative", label: "Criativos" },
            { key: "strategy", label: "Estratégicos" },
            { key: "image_prompt", label: "Prompts" },
            { key: "planning", label: "Planejamentos" },
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
              {label} ({typeCounts[key as keyof typeof typeCounts]})
            </button>
          ))}
        </div>

        {/* Form */}
        {showForm && (
          <BriefForm
            form={form}
            onFormChange={setForm}
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* Content */}
        {filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <Palette className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-heading text-foreground mb-2">Nenhum brief ainda</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
              Crie briefs manualmente ou peça ao Orion no chat: "Crie um brief criativo para uma campanha de Instagram Reels".
            </p>
            <Button variant="outline" onClick={() => setShowForm(true)} className="border-border gap-2">
              <Plus className="w-4 h-4" /> Criar primeiro brief
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Brief grid */}
            <div className="lg:col-span-1 space-y-3 max-h-[60vh] overflow-auto pr-1">
              {filtered.map((brief) => (
                <BriefCard
                  key={brief.id}
                  brief={brief}
                  isSelected={selected === brief.id}
                  onSelect={() => setSelected(brief.id)}
                />
              ))}
            </div>

            {/* Detail panel */}
            <div className="lg:col-span-2">
              {selectedBrief ? (
                <BriefDetail
                  brief={selectedBrief}
                  onStatusChange={updateStatus}
                  onPreparePublication={setPublicationBrief}
                />
              ) : (
                <div className="bg-card border border-border rounded-xl p-12 text-center">
                  <p className="text-sm text-muted-foreground">Selecione um brief para ver os detalhes</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <Dialog open={Boolean(publicationBrief)} onOpenChange={(open) => !open && setPublicationBrief(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Preparar publicação</DialogTitle>
            <DialogDescription>
              Publicação demonstrativa em staging/mock. O Orion criará um rascunho com aprovação obrigatória, mas Meta/Instagram real está desativado e nada será enviado para canal real.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-orion-coral/30 bg-orion-coral/10 px-3 py-2 text-sm text-foreground">
            Ação registrada apenas dentro do Orion. Use este fluxo para validar governança, aprovação e agendamento mock.
          </div>
          <div className="grid gap-3">
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Canal</span>
              <select
                value={publicationForm.channel}
                onChange={(event) => setPublicationForm((prev) => ({ ...prev, channel: event.target.value as PublicationChannel }))}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
                <option value="linkedin">LinkedIn</option>
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="meta_ads">Meta Ads</option>
                <option value="google_ads">Google Ads</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Tipo</span>
              <select
                value={publicationForm.publication_type}
                onChange={(event) => setPublicationForm((prev) => ({ ...prev, publication_type: event.target.value as PublicationType }))}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="organic_post">Post orgânico</option>
                <option value="story">Story</option>
                <option value="reel">Reel</option>
                <option value="carousel">Carrossel</option>
                <option value="email">Email</option>
                <option value="whatsapp_message">Mensagem WhatsApp</option>
                <option value="paid_ad">Anúncio pago</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Agendar para</span>
              <Input
                type="datetime-local"
                value={publicationForm.scheduled_at}
                onChange={(event) => setPublicationForm((prev) => ({ ...prev, scheduled_at: event.target.value }))}
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Objetivo</span>
              <Input
                value={publicationForm.objective}
                onChange={(event) => setPublicationForm((prev) => ({ ...prev, objective: event.target.value }))}
                placeholder="Ex.: recuperar CTR da campanha de remarketing"
              />
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPublicationBrief(null)}>Cancelar</Button>
            <Button onClick={preparePublication}>Criar rascunho mock e aprovação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Studio;
