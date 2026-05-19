// /settings — preferências do usuário.
// Por ora foca em density_mode (F4). Pode crescer com mais seções:
// notificações, integrações, conta, billing.

import { AppLayout } from "@/components/layout/AppLayout";
import { useDensity, type DensityMode, type Persona } from "@/hooks/useDensity";
import { Loader2, User, Users, Building2, Settings as SettingsIcon, Check, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  DEFAULT_PUBLICATION_POLICY_FORM,
  policyToForm,
  usePublicationPolicies,
  type PublicationPolicyForm,
} from "@/hooks/usePublicationPolicies";
import type { PublicationAutonomyLevel, PublicationChannel, PublicationType } from "@/lib/publicationProviders";

const DENSITY_OPTIONS: Array<{
  id: DensityMode;
  label: string;
  description: string;
  icon: typeof User;
}> = [
  {
    id: "simple",
    label: "Simplificado",
    description: "Linguagem clara, KPIs essenciais, ações destacadas. Ótimo para quem quer clareza e foco operacional.",
    icon: User,
  },
  {
    id: "detailed",
    label: "Detalhado",
    description: "4–5 KPIs, controle granular sobre campanhas, tarefas e métricas. Padrão para operação de marketing.",
    icon: Users,
  },
  {
    id: "pro",
    label: "Pro",
    description: "Alta densidade informacional, múltiplos módulos visíveis, atalhos avançados e visão estratégica completa.",
    icon: Building2,
  },
];

const Settings = () => {
  const { density, setDensity, loading } = useDensity();
  const { policies, loading: policiesLoading, available: policiesAvailable, savePolicy } = usePublicationPolicies();
  const [saving, setSaving] = useState<DensityMode | null>(null);
  const [policyForm, setPolicyForm] = useState<PublicationPolicyForm>(DEFAULT_PUBLICATION_POLICY_FORM);
  const [editingPolicyId, setEditingPolicyId] = useState<string | null>(null);

  const handleSelect = async (mode: DensityMode) => {
    if (mode === density) return;
    setSaving(mode);
    try {
      await setDensity(mode);
      toast.success("Densidade atualizada");
    } catch {
      toast.error("Falha ao salvar");
    } finally {
      setSaving(null);
    }
  };

  const editPolicy = (policyId: string) => {
    const policy = policies.find((item) => item.id === policyId);
    if (!policy) return;
    setEditingPolicyId(policy.id);
    setPolicyForm(policyToForm(policy));
  };

  const resetPolicyForm = () => {
    setEditingPolicyId(null);
    setPolicyForm(DEFAULT_PUBLICATION_POLICY_FORM);
  };

  const submitPolicy = async () => {
    await savePolicy(policyForm, editingPolicyId);
    resetPolicyForm();
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-primary" />
            Configurações
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ajuste como o Orion se comporta no seu dia a dia.
          </p>
        </div>

        {/* Density */}
        <section className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div>
            <h2 className="text-base font-semibold">Densidade da interface</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Controla quanto detalhe o Orion mostra em cada tela. Você pode mudar a qualquer momento.
            </p>
            </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {DENSITY_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isActive = opt.id === density;
              const isSaving = saving === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => handleSelect(opt.id)}
                  disabled={saving !== null}
                  className={cn(
                    "text-left p-4 rounded-xl border-2 transition-all flex flex-col gap-2 min-h-[140px]",
                    isActive
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background hover:border-primary/50 hover:bg-muted/30",
                    "disabled:opacity-60 disabled:cursor-wait",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      isActive ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                    )}>
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
                    </div>
                    {isActive && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary uppercase tracking-wide">
                        <Check className="w-3 h-3" /> Atual
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-foreground">{opt.label}</span>
                  <p className="text-xs text-muted-foreground leading-relaxed">{opt.description}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Placeholder pra próximas seções */}
        <section className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold">Políticas de Publicação</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Essas regras definem até onde o Orion pode ir antes de pedir aprovação.
              </p>
              <p className="mt-2 text-xs text-orion-coral">
                Ambiente staging/mock: Meta/Instagram real está desativado. Essas políticas controlam apenas preparação, aprovação e agendamento demonstrativo dentro do Orion.
              </p>
              {!policiesAvailable && (
                <p className="mt-2 text-xs text-orion-warning">
                  Políticas dependem das migrations de Publicação Assistida aplicadas em staging/remoto.
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Canal</span>
              <select
                value={policyForm.channel}
                onChange={(event) => setPolicyForm((prev) => ({ ...prev, channel: event.target.value as PublicationChannel }))}
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
                value={policyForm.publication_type}
                onChange={(event) => setPolicyForm((prev) => ({ ...prev, publication_type: event.target.value as PublicationType }))}
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
              <span className="text-xs text-muted-foreground">Autonomia permitida</span>
              <select
                value={policyForm.autonomy_level_allowed}
                onChange={(event) => setPolicyForm((prev) => ({ ...prev, autonomy_level_allowed: event.target.value as PublicationAutonomyLevel }))}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="insight_only">Insight apenas</option>
                <option value="assisted_execution">Execução assistida</option>
                <option value="partial_automation">Automação parcial</option>
                <option value="limited_autonomy">Autonomia limitada</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Papel aprovador</span>
              <Input
                value={policyForm.approval_role_required}
                onChange={(event) => setPolicyForm((prev) => ({ ...prev, approval_role_required: event.target.value }))}
                placeholder="owner, manager, agency_admin"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Limite diário de posts</span>
              <Input
                type="number"
                min="0"
                value={policyForm.max_daily_posts}
                onChange={(event) => setPolicyForm((prev) => ({ ...prev, max_daily_posts: event.target.value }))}
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Limite diário de verba</span>
              <Input
                type="number"
                min="0"
                value={policyForm.max_daily_budget}
                onChange={(event) => setPolicyForm((prev) => ({ ...prev, max_daily_budget: event.target.value }))}
                placeholder="Obrigatório para paid media"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Janelas permitidas</span>
              <Input
                value={policyForm.allowed_time_windows}
                onChange={(event) => setPolicyForm((prev) => ({ ...prev, allowed_time_windows: event.target.value }))}
                placeholder="09:00-18:00, 19:00-21:00"
              />
            </label>
            <label className="space-y-1">
              <span className="text-xs text-muted-foreground">Palavras bloqueadas</span>
              <Input
                value={policyForm.blocked_words}
                onChange={(event) => setPolicyForm((prev) => ({ ...prev, blocked_words: event.target.value }))}
                placeholder="milagre, garantido, grátis"
              />
            </label>
            <label className="space-y-1 md:col-span-2">
              <span className="text-xs text-muted-foreground">Brand checks obrigatórios</span>
              <Input
                value={policyForm.required_brand_checks}
                onChange={(event) => setPolicyForm((prev) => ({ ...prev, required_brand_checks: event.target.value }))}
                placeholder="brand_voice, blocked_words, visual_identity"
              />
            </label>
            <div className="md:col-span-2 flex items-center justify-between rounded-lg border border-border bg-background/50 p-3">
              <div>
                <p className="text-sm text-foreground">Exige aprovação</p>
                <p className="text-xs text-muted-foreground">Canais pagos sempre exigem aprovação, mesmo se desligado aqui. No staging/mock, nenhuma publicação é enviada para canal real.</p>
              </div>
              <Switch
                checked={policyForm.publication_type === "paid_ad" || policyForm.channel === "meta_ads" || policyForm.channel === "google_ads" || policyForm.requires_approval}
                disabled={policyForm.publication_type === "paid_ad" || policyForm.channel === "meta_ads" || policyForm.channel === "google_ads"}
                onCheckedChange={(checked) => setPolicyForm((prev) => ({ ...prev, requires_approval: checked }))}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={submitPolicy} disabled={!policiesAvailable}>
              {editingPolicyId ? "Salvar política" : "Criar política"}
            </Button>
            {editingPolicyId && <Button variant="outline" onClick={resetPolicyForm}>Cancelar edição</Button>}
          </div>

          <div className="space-y-2">
            {policiesLoading ? (
              <p className="text-xs text-muted-foreground">Carregando políticas...</p>
            ) : policies.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sem políticas configuradas. O Orion usa fallback conservador com aprovação obrigatória.</p>
            ) : policies.map((policy) => (
              <button
                key={policy.id}
                onClick={() => editPolicy(policy.id)}
                className="w-full rounded-lg border border-border bg-background/50 p-3 text-left hover:bg-muted/30"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{policy.channel} · {policy.publication_type}</p>
                  <span className="text-[10px] text-muted-foreground">{policy.autonomy_level_allowed}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {policy.requires_approval ? "Exige aprovação" : "Sem aprovação obrigatória"} · {policy.max_daily_posts ?? "sem"} posts/dia
                </p>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-dashed border-border p-5 text-center text-xs text-muted-foreground">
          Mais opções (notificações, conta, billing) virão aqui em breve.
        </section>
      </div>
    </AppLayout>
  );
};

export default Settings;
