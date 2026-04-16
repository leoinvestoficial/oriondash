import { useState, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSearchParams } from "react-router-dom";
import {
  Plus, ChevronLeft, ChevronRight, Calendar as CalIcon,
  Globe, Mail, Sparkles, X, Image, Video, FileText, Mic
} from "lucide-react";

interface ContentItem {
  id: string;
  campaign_id: string | null;
  title: string;
  content_type: string;
  channel: string;
  scheduled_date: string;
  scheduled_time: string | null;
  status: string;
  copy_text: string | null;
  visual_description: string | null;
  hashtags: string | null;
  cta: string | null;
  ai_generated: boolean;
  notes: string | null;
}

interface Campaign {
  id: string;
  name: string;
  platform: string;
}

const channelOptions = [
  { value: "instagram", label: "Instagram", icon: Instagram },
  { value: "facebook", label: "Facebook", icon: Globe },
  { value: "tiktok", label: "TikTok", icon: Video },
  { value: "linkedin", label: "LinkedIn", icon: Globe },
  { value: "email", label: "E-mail", icon: Mail },
  { value: "blog", label: "Blog", icon: FileText },
  { value: "youtube", label: "YouTube", icon: Video },
  { value: "podcast", label: "Podcast", icon: Mic },
];

const typeOptions = [
  { value: "post", label: "Post", color: "bg-orion-info/15 text-orion-info" },
  { value: "story", label: "Story", color: "bg-orion-violet-light/15 text-orion-violet-light" },
  { value: "reel", label: "Reel/Vídeo", color: "bg-orion-coral/15 text-orion-coral" },
  { value: "ad", label: "Anúncio", color: "bg-orion-amber/15 text-orion-amber" },
  { value: "email", label: "E-mail", color: "bg-orion-teal/15 text-orion-teal" },
  { value: "article", label: "Artigo", color: "bg-orion-success/15 text-orion-success" },
  { value: "carousel", label: "Carrossel", color: "bg-primary/15 text-primary" },
];

const statusOptions = [
  { value: "draft", label: "Rascunho", color: "bg-muted/50 text-muted-foreground" },
  { value: "scheduled", label: "Agendado", color: "bg-orion-info/15 text-orion-info" },
  { value: "published", label: "Publicado", color: "bg-orion-success/15 text-orion-success" },
  { value: "cancelled", label: "Cancelado", color: "bg-destructive/15 text-destructive" },
];

const ContentForm = ({ campaigns, defaultDate, defaultCampaign, onSubmit, onCancel }: {
  campaigns: Campaign[];
  defaultDate: string;
  defaultCampaign: string | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}) => {
  const [form, setForm] = useState({
    title: "", content_type: "post", channel: "instagram", scheduled_date: defaultDate,
    scheduled_time: "10:00", campaign_id: defaultCampaign || "",
    copy_text: "", visual_description: "", hashtags: "", cta: "", notes: "",
  });

  const handleSubmit = () => {
    if (!form.title.trim()) { toast.error("Título obrigatório"); return; }
    onSubmit({
      ...form,
      campaign_id: form.campaign_id || null,
      copy_text: form.copy_text || null,
      visual_description: form.visual_description || null,
      hashtags: form.hashtags || null,
      cta: form.cta || null,
      notes: form.notes || null,
    });
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h3 className="text-heading text-foreground flex items-center gap-2">
          <Plus className="w-4 h-4 text-primary" /> Novo conteúdo
        </h3>
        <Button variant="ghost" size="sm" onClick={onCancel}><X className="w-4 h-4" /></Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <label className="text-xs text-muted-foreground mb-1 block">Título *</label>
          <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})}
            placeholder="Ex: Post carrossel sobre tendências 2026" className="bg-background" />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Tipo</label>
          <Select value={form.content_type} onValueChange={v => setForm({...form, content_type: v})}>
            <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
            <SelectContent>
              {typeOptions.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Canal</label>
          <Select value={form.channel} onValueChange={v => setForm({...form, channel: v})}>
            <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
            <SelectContent>
              {channelOptions.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Data</label>
          <Input type="date" value={form.scheduled_date} onChange={e => setForm({...form, scheduled_date: e.target.value})}
            className="bg-background" />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Horário</label>
          <Input type="time" value={form.scheduled_time} onChange={e => setForm({...form, scheduled_time: e.target.value})}
            className="bg-background" />
        </div>

        {campaigns.length > 0 && (
          <div className="md:col-span-2">
            <label className="text-xs text-muted-foreground mb-1 block">Campanha (opcional)</label>
            <Select value={form.campaign_id} onValueChange={v => setForm({...form, campaign_id: v})}>
              <SelectTrigger className="bg-background"><SelectValue placeholder="Selecionar campanha" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sem campanha</SelectItem>
                {campaigns.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="md:col-span-2">
          <label className="text-xs text-muted-foreground mb-1 block">Copy / Legenda</label>
          <Textarea value={form.copy_text} onChange={e => setForm({...form, copy_text: e.target.value})}
            placeholder="Texto da publicação..." rows={3} className="bg-background resize-none" />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Descrição visual</label>
          <Input value={form.visual_description} onChange={e => setForm({...form, visual_description: e.target.value})}
            placeholder="Foto lifestyle, cores quentes..." className="bg-background" />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Hashtags</label>
          <Input value={form.hashtags} onChange={e => setForm({...form, hashtags: e.target.value})}
            placeholder="#marketing #digital" className="bg-background" />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">CTA</label>
          <Input value={form.cta} onChange={e => setForm({...form, cta: e.target.value})}
            placeholder="Link na bio" className="bg-background" />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Notas</label>
          <Input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
            placeholder="Observações internas" className="bg-background" />
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button onClick={handleSubmit} className="orion-gradient text-primary-foreground gap-2">
          <CalIcon className="w-4 h-4" /> Agendar
        </Button>
      </div>
    </div>
  );
};

const ContentCalendar = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const campaignFilter = searchParams.get("campaign");

  const [items, setItems] = useState<ContentItem[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);

  const fetchData = async () => {
    if (!user) return;
    const [contentRes, campRes] = await Promise.all([
      supabase.from("content_calendar").select("*").eq("user_id", user.id).order("scheduled_date"),
      supabase.from("campaigns").select("id, name, platform").eq("user_id", user.id),
    ]);
    if (contentRes.data) setItems(contentRes.data);
    if (campRes.data) setCampaigns(campRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel("content-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "content_calendar", filter: `user_id=eq.${user.id}` },
        () => fetchData()
      ).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const handleCreate = async (data: any) => {
    if (!user) return;
    const { error } = await supabase.from("content_calendar").insert({ user_id: user.id, ...data });
    if (error) toast.error("Erro ao criar conteúdo");
    else { toast.success("Conteúdo agendado!"); setShowForm(false); }
  };

  const handleStatusChange = async (id: string, status: string) => {
    const { error } = await supabase.from("content_calendar").update({ status }).eq("id", id);
    if (error) toast.error("Erro");
    else toast.success("Status atualizado!");
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("content_calendar").delete().eq("id", id);
    if (error) toast.error("Erro");
    else { toast.success("Removido!"); setSelectedItem(null); }
  };

  // Calendar logic
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const filteredItems = campaignFilter
    ? items.filter(i => i.campaign_id === campaignFilter)
    : items;

  const dayItems = useMemo(() => {
    const map: Record<string, ContentItem[]> = {};
    filteredItems.forEach(item => {
      const d = item.scheduled_date;
      if (!map[d]) map[d] = [];
      map[d].push(item);
    });
    return map;
  }, [filteredItems]);

  const today = new Date().toISOString().split("T")[0];

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  if (loading) {
    return <AppLayout><div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 rounded-lg orion-gradient animate-pulse-glow" /></div></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-display text-foreground">Cronograma de Conteúdo</h1>
            <p className="text-sm text-muted-foreground">
              {filteredItems.length} conteúdos planejados
              {campaignFilter && campaigns.find(c => c.id === campaignFilter) &&
                ` para ${campaigns.find(c => c.id === campaignFilter)?.name}`}
            </p>
          </div>
          <Button onClick={() => { setShowForm(true); setSelectedDate(today); }}
            className="orion-gradient text-primary-foreground gap-2">
            <Plus className="w-4 h-4" /> Novo conteúdo
          </Button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Total", value: filteredItems.length, color: "text-foreground" },
            { label: "Rascunhos", value: filteredItems.filter(i => i.status === "draft").length, color: "text-muted-foreground" },
            { label: "Agendados", value: filteredItems.filter(i => i.status === "scheduled").length, color: "text-orion-info" },
            { label: "Publicados", value: filteredItems.filter(i => i.status === "published").length, color: "text-orion-success" },
            { label: "IA gerados", value: filteredItems.filter(i => i.ai_generated).length, color: "text-orion-violet-light" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-card border border-border rounded-xl p-3 text-center">
              <p className={cn("text-lg font-semibold", color)}>{value}</p>
              <p className="text-[10px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {showForm && (
          <ContentForm
            campaigns={campaigns}
            defaultDate={selectedDate || today}
            defaultCampaign={campaignFilter}
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* Calendar */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {/* Month nav */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(new Date(year, month - 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-heading text-foreground">{monthNames[month]} {year}</h2>
            <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(new Date(year, month + 1))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-border">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(d => (
              <div key={d} className="text-[10px] text-muted-foreground text-center py-2 font-medium uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[100px] border-b border-r border-border bg-muted/10" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const dayContent = dayItems[dateStr] || [];
              const isToday = dateStr === today;

              return (
                <div key={day}
                  onClick={() => { setSelectedDate(dateStr); if (dayContent.length === 0) setShowForm(true); }}
                  className={cn(
                    "min-h-[100px] border-b border-r border-border p-1.5 cursor-pointer hover:bg-muted/20 transition-colors",
                    isToday && "bg-primary/5"
                  )}
                >
                  <div className={cn(
                    "text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full",
                    isToday ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  )}>
                    {day}
                  </div>
                  <div className="space-y-0.5">
                    {dayContent.slice(0, 3).map(item => {
                      const typeInfo = typeOptions.find(t => t.value === item.content_type);
                      return (
                        <button key={item.id}
                          onClick={e => { e.stopPropagation(); setSelectedItem(item); }}
                          className={cn(
                            "w-full text-left text-[10px] px-1.5 py-0.5 rounded truncate",
                            typeInfo?.color || "bg-muted/50 text-muted-foreground"
                          )}
                        >
                          {item.title}
                        </button>
                      );
                    })}
                    {dayContent.length > 3 && (
                      <p className="text-[9px] text-muted-foreground text-center">+{dayContent.length - 3} mais</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail panel */}
        {selectedItem && (
          <div className="bg-card border border-border rounded-xl p-5 space-y-4 animate-fade-in">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {(() => {
                    const typeInfo = typeOptions.find(t => t.value === selectedItem.content_type);
                    return <span className={cn("text-[10px] px-2 py-0.5 rounded", typeInfo?.color)}>{typeInfo?.label}</span>;
                  })()}
                  {(() => {
                    const statusInfo = statusOptions.find(s => s.value === selectedItem.status);
                    return <span className={cn("text-[10px] px-2 py-0.5 rounded", statusInfo?.color)}>{statusInfo?.label}</span>;
                  })()}
                  {selectedItem.ai_generated && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-orion-violet-light/15 text-orion-violet-light flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" /> IA
                    </span>
                  )}
                </div>
                <h3 className="text-heading text-foreground">{selectedItem.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {channelOptions.find(c => c.value === selectedItem.channel)?.label} ·{" "}
                  {new Date(selectedItem.scheduled_date).toLocaleDateString("pt-BR")}
                  {selectedItem.scheduled_time && ` às ${selectedItem.scheduled_time.slice(0, 5)}`}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedItem(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {selectedItem.copy_text && (
              <div className="bg-background rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">Copy</p>
                <p className="text-sm text-foreground whitespace-pre-wrap">{selectedItem.copy_text}</p>
              </div>
            )}

            {selectedItem.visual_description && (
              <div className="bg-background rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">Visual</p>
                <p className="text-sm text-foreground">{selectedItem.visual_description}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {selectedItem.hashtags && (
                <span className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">{selectedItem.hashtags}</span>
              )}
              {selectedItem.cta && (
                <span className="text-xs bg-primary/10 px-2 py-1 rounded text-primary">CTA: {selectedItem.cta}</span>
              )}
            </div>

            <div className="flex gap-2 pt-3 border-t border-border">
              {selectedItem.status === "draft" && (
                <Button size="sm" variant="outline" className="text-xs gap-1"
                  onClick={() => handleStatusChange(selectedItem.id, "scheduled")}>
                  Agendar
                </Button>
              )}
              {selectedItem.status === "scheduled" && (
                <Button size="sm" variant="outline" className="text-xs gap-1"
                  onClick={() => handleStatusChange(selectedItem.id, "published")}>
                  Marcar publicado
                </Button>
              )}
              <Button size="sm" variant="ghost" className="text-xs text-destructive"
                onClick={() => handleDelete(selectedItem.id)}>
                Excluir
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default ContentCalendar;
