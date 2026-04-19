import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBrain } from "@/hooks/useBrain";
import { Brain, Plus, Sparkles, Trash2, Loader2, MessageSquare, BarChart3, Target, FileText, StickyNote, Zap } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PageHelpBanner } from "@/components/help/PageHelpBanner";
import { PAGE_HELP } from "@/lib/pageHelp";

const TYPE_ICONS: Record<string, any> = {
  chat: MessageSquare, metric: BarChart3, decision: Zap, diagnostic: Target,
  upload: FileText, note: StickyNote, event: Sparkles, task: FileText,
};

const TYPE_LABELS: Record<string, string> = {
  all: "Tudo", chat: "Chats", metric: "Métricas", decision: "Decisões",
  diagnostic: "Diagnósticos", upload: "Uploads", note: "Anotações", event: "Eventos", task: "Tarefas",
};

export default function Cerebro() {
  const { memories, loading, ingest, ingesting, remove, briefing, context, refreshBriefing, generatingBriefing, filter, setFilter } = useBrain();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("note");

  const submit = async () => {
    if (!title.trim()) return;
    await ingest({ memory_type: type, title, content, source: "manual" });
    setTitle(""); setContent(""); setShowForm(false);
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-medium flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              Cérebro Contínuo
            </h1>
            <p className="text-sm text-muted-foreground mt-1">SSOT da operação — tudo que importa, num só lugar. A IA aprende continuamente daqui.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refreshBriefing()} disabled={generatingBriefing}>
              {generatingBriefing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Briefing IA
            </Button>
            <Button onClick={() => setShowForm((v) => !v)}>
              <Plus className="h-4 w-4 mr-2" /> Registrar
            </Button>
          </div>
        </div>

        <PageHelpBanner content={PAGE_HELP.cerebro} />

        {(briefing || context) && (
          <Card className="p-5 border-primary/30 bg-primary/5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="font-medium">Big Picture agora</h2>
            </div>
            {briefing ? (
              <div className="text-sm whitespace-pre-wrap text-foreground/90">{briefing}</div>
            ) : (
              <p className="text-sm text-muted-foreground">Clique em "Briefing IA" pra gerar a leitura consolidada.</p>
            )}
            {context && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-primary/20">
                <Stat label="Score" value={context.latest_diagnostic?.score ?? "—"} />
                <Stat label="ROAS" value={context.latest_metrics?.avg_roas ?? "—"} />
                <Stat label="Decisões pendentes" value={context.pending_decisions?.length ?? 0} />
                <Stat label="Memórias" value={memories.length} />
              </div>
            )}
          </Card>
        )}

        {showForm && (
          <Card className="p-5 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] gap-3">
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["note","event","metric","decision","upload","chat","task"].map((t) => (
                    <SelectItem key={t} value={t}>{TYPE_LABELS[t] ?? t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input placeholder="Título (ex: Cliente reclamou do tempo de entrega)" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <Textarea placeholder="Detalhes, contexto, números, links… A IA resume e tagueia automaticamente." value={content} onChange={(e) => setContent(e.target.value)} rows={4} />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button onClick={submit} disabled={ingesting || !title.trim()}>
                {ingesting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Salvar no cérebro
              </Button>
            </div>
          </Card>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          {Object.entries(TYPE_LABELS).map(([k, label]) => (
            <Button key={k} size="sm" variant={filter === k ? "default" : "outline"} onClick={() => setFilter(k)}>
              {label}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : memories.length === 0 ? (
          <Card className="p-12 text-center">
            <Brain className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">Nada registrado ainda. Comece despejando qualquer coisa: ideia, métrica, conversa com cliente, print de campanha…</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {memories.map((m) => {
              const Icon = TYPE_ICONS[m.memory_type] ?? StickyNote;
              return (
                <Card key={m.id} className="p-4 hover:border-primary/40 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-md bg-muted/50"><Icon className="h-4 w-4 text-primary" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium text-sm">{m.title}</div>
                          {m.summary && <div className="text-sm text-muted-foreground mt-1">{m.summary}</div>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className="text-xs">★ {m.importance}</Badge>
                          <Button size="sm" variant="ghost" onClick={() => remove(m.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mt-2">
                        {m.tags?.slice(0, 6).map((t) => (
                          <Badge key={t} variant="secondary" className="text-[10px] font-normal">{t}</Badge>
                        ))}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {format(new Date(m.occurred_at), "dd MMM, HH:mm", { locale: ptBR })} · {m.source}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

const Stat = ({ label, value }: { label: string; value: any }) => (
  <div>
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="text-lg font-medium">{value}</div>
  </div>
);
