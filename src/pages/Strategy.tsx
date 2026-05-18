import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHelpBanner } from "@/components/help/PageHelpBanner";
import { PAGE_HELP } from "@/lib/pageHelp";
import { useCompanyDNA } from "@/hooks/useCompanyDNA";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { useStrategySummary } from "@/hooks/useStrategySummary";
import { useOutcomeLearningSummary } from "@/hooks/useOutcomeLearningSummary";
import { useIntelligenceSummary } from "@/hooks/useIntelligenceSummary";
import { buildStrategyRecommendations } from "@/lib/strategyPlanner";
import { getGoalProgress } from "@/lib/goalProgress";
import { toast } from "sonner";
import { ArrowRight, Brain, FlaskConical, Goal, Lightbulb, Plus, Rocket } from "lucide-react";

const Strategy = () => {
  const { user } = useAuth();
  const { dna } = useCompanyDNA();
  const { metrics } = useDashboardMetrics(14);
  const strategySummary = useStrategySummary();
  const learning = useOutcomeLearningSummary();
  const intelligence = useIntelligenceSummary();
  const [goals, setGoals] = useState<any[]>([]);
  const [hypotheses, setHypotheses] = useState<any[]>([]);
  const [outcomes, setOutcomes] = useState<any[]>([]);
  const [goalForm, setGoalForm] = useState({ goal_name: "", target_metric: "", target_value: "", timeframe: "", notes: "" });
  const [hypothesisForm, setHypothesisForm] = useState({ title: "", hypothesis_statement: "", channel: "", audience: "", experiment_plan: "", success_metric: "", priority: "medium", strategic_goal_id: "none" });

  const fetchAll = async () => {
    if (!user) return;
    const [goalsRes, hypothesesRes, outcomesRes] = await Promise.all([
      supabase.from("strategic_goals").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("marketing_hypotheses").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("decision_outcomes").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);
    setGoals(goalsRes.data || []);
    setHypotheses(hypothesesRes.data || []);
    setOutcomes(outcomesRes.data || []);
  };

  useEffect(() => { fetchAll(); }, [user]);

  const recommendations = useMemo(() => buildStrategyRecommendations({
    dna: dna?.dna_data,
    metrics,
    intelligence,
    learning,
    goals,
    hypotheses,
    campaignCount: metrics?.campaignsList.length || 0,
  }), [dna, metrics, intelligence, learning, goals, hypotheses]);

  const createGoal = async () => {
    if (!user || !goalForm.goal_name.trim() || !goalForm.target_metric.trim()) return;
    const { error } = await supabase.from("strategic_goals").insert({
      user_id: user.id,
      company_dna_id: dna?.id || null,
      goal_name: goalForm.goal_name,
      target_metric: goalForm.target_metric,
      target_value: goalForm.target_value ? Number(goalForm.target_value) : null,
      timeframe: goalForm.timeframe || null,
      notes: goalForm.notes || null,
    });
    if (error) return toast.error("Erro ao criar meta");
    toast.success("Meta criada");
    setGoalForm({ goal_name: "", target_metric: "", target_value: "", timeframe: "", notes: "" });
    fetchAll();
  };

  const createHypothesis = async (prefill?: any) => {
    if (!user) return;
    const source = prefill || hypothesisForm;
    if (!source.title?.trim() || !source.hypothesis_statement?.trim()) return;
    const { error } = await supabase.from("marketing_hypotheses").insert({
      user_id: user.id,
      company_dna_id: dna?.id || null,
      title: source.title,
      hypothesis_statement: source.hypothesis_statement,
      channel: source.channel || null,
      audience: source.audience || null,
      experiment_plan: source.experiment_plan || null,
      success_metric: source.success_metric || null,
      priority: source.priority || "medium",
      strategic_goal_id: source.strategic_goal_id && source.strategic_goal_id !== "none" ? source.strategic_goal_id : null,
    });
    if (error) return toast.error("Erro ao criar hipótese");
    toast.success("Hipótese criada");
    if (!prefill) {
      setHypothesisForm({ title: "", hypothesis_statement: "", channel: "", audience: "", experiment_plan: "", success_metric: "", priority: "medium", strategic_goal_id: "none" });
    }
    fetchAll();
  };

  const createCampaignFromRecommendation = async (item: any) => {
    if (!user) return;
    const { error } = await supabase.from("campaigns").insert({
      user_id: user.id,
      name: item.title,
      platform: item.platform,
      objective: item.objective,
      budget_daily: item.budgetDaily,
      budget_total: item.budgetTotal,
      targeting: {
        audience: item.audience,
        strategy_notes: item.strategyNotes,
        targeting_notes: item.targetingNotes,
      } as any,
      metrics_snapshot: {} as any,
      status: "draft",
    });
    if (error) return toast.error("Erro ao criar campanha");
    toast.success("Campanha criada a partir da estratégia");
  };

  const createBriefFromRecommendation = async (item: any) => {
    if (!user) return;
    const { error } = await supabase.from("creative_briefs").insert({
      user_id: user.id,
      title: item.title,
      brief_type: "strategy",
      status: "draft",
      content: item.creativeBrief as any,
    });
    if (error) return toast.error("Erro ao criar brief");
    toast.success("Brief criado a partir da recomendação");
  };

  const updateOutcome = async (id: string, patch: Record<string, any>) => {
    const { error } = await supabase.from("decision_outcomes").update(patch).eq("id", id);
    if (error) return toast.error("Erro ao atualizar outcome");
    toast.success("Outcome atualizado");
    fetchAll();
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-display text-foreground">Strategy</h1>
          <p className="text-sm text-muted-foreground">Metas, hipóteses, outcomes e planner executável.</p>
        </div>

        <PageHelpBanner content={PAGE_HELP.strategy} />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-xs text-muted-foreground mb-2">Meta ativa</p>
            <p className="text-sm font-medium text-foreground">{strategySummary.activeGoal?.goal_name || "Sem meta ativa"}</p>
            <p className="text-xs text-muted-foreground mt-2">{strategySummary.activeGoal?.target_metric || "Defina a métrica principal"}</p>
            {strategySummary.activeGoal && (
              <p className="text-xs text-primary mt-2">Progresso estimado {Math.round(getGoalProgress(strategySummary.activeGoal, metrics).progressPct || 0)}%</p>
            )}
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-xs text-muted-foreground mb-2">Hipótese prioritária</p>
            <p className="text-sm font-medium text-foreground">{strategySummary.priorityHypothesis?.title || "Sem hipótese priorizada"}</p>
            <p className="text-xs text-muted-foreground mt-2">{strategySummary.priorityHypothesis?.priority || "—"}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-xs text-muted-foreground mb-2">Outcomes pendentes</p>
            <p className="text-2xl font-semibold text-foreground">{learning.pendingReviewCount}</p>
            <p className="text-xs text-muted-foreground mt-2">Validados {learning.validatedCount} · Invalidados {learning.invalidatedCount}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <p className="text-xs text-muted-foreground mb-2">Planner lendo intelligence</p>
            <p className="text-sm font-medium text-foreground">{intelligence.topSignal?.title || "Sem sinais mapeados"}</p>
            <p className="text-xs text-muted-foreground mt-2">Concorrentes {intelligence.activeCompetitorsCount} · Benchmarks {intelligence.benchmarkCount}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <section className="bg-card border border-border rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2"><Goal className="w-4 h-4 text-primary" /><h2 className="text-heading text-foreground">Criar meta</h2></div>
            <Input value={goalForm.goal_name} onChange={(e) => setGoalForm((p) => ({ ...p, goal_name: e.target.value }))} placeholder="Nome da meta" className="bg-background" />
            <div className="grid grid-cols-2 gap-2">
              <Input value={goalForm.target_metric} onChange={(e) => setGoalForm((p) => ({ ...p, target_metric: e.target.value }))} placeholder="Métrica alvo" className="bg-background" />
              <Input value={goalForm.target_value} onChange={(e) => setGoalForm((p) => ({ ...p, target_value: e.target.value }))} placeholder="Valor alvo" className="bg-background" />
            </div>
            <Input value={goalForm.timeframe} onChange={(e) => setGoalForm((p) => ({ ...p, timeframe: e.target.value }))} placeholder="Prazo" className="bg-background" />
            <Textarea value={goalForm.notes} onChange={(e) => setGoalForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Notas" rows={3} className="bg-background resize-none" />
            <Button onClick={createGoal} className="orion-gradient text-primary-foreground gap-2"><Plus className="w-4 h-4" />Adicionar meta</Button>
          </section>

          <section className="bg-card border border-border rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2"><FlaskConical className="w-4 h-4 text-primary" /><h2 className="text-heading text-foreground">Criar hipótese</h2></div>
            <Input value={hypothesisForm.title} onChange={(e) => setHypothesisForm((p) => ({ ...p, title: e.target.value }))} placeholder="Título da hipótese" className="bg-background" />
            <Textarea value={hypothesisForm.hypothesis_statement} onChange={(e) => setHypothesisForm((p) => ({ ...p, hypothesis_statement: e.target.value }))} placeholder="Se fizermos X, esperamos Y" rows={3} className="bg-background resize-none" />
            <div className="grid grid-cols-2 gap-2">
              <Input value={hypothesisForm.channel} onChange={(e) => setHypothesisForm((p) => ({ ...p, channel: e.target.value }))} placeholder="Canal" className="bg-background" />
              <Input value={hypothesisForm.audience} onChange={(e) => setHypothesisForm((p) => ({ ...p, audience: e.target.value }))} placeholder="Audiência" className="bg-background" />
            </div>
            <Textarea value={hypothesisForm.experiment_plan} onChange={(e) => setHypothesisForm((p) => ({ ...p, experiment_plan: e.target.value }))} placeholder="Plano de experimento" rows={2} className="bg-background resize-none" />
            <div className="grid grid-cols-2 gap-2">
              <Input value={hypothesisForm.success_metric} onChange={(e) => setHypothesisForm((p) => ({ ...p, success_metric: e.target.value }))} placeholder="Métrica de sucesso" className="bg-background" />
              <Select value={hypothesisForm.priority} onValueChange={(v) => setHypothesisForm((p) => ({ ...p, priority: v }))}><SelectTrigger className="bg-background"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="high">Alta</SelectItem><SelectItem value="medium">Média</SelectItem><SelectItem value="low">Baixa</SelectItem></SelectContent></Select>
            </div>
            <Select value={hypothesisForm.strategic_goal_id} onValueChange={(v) => setHypothesisForm((p) => ({ ...p, strategic_goal_id: v }))}><SelectTrigger className="bg-background"><SelectValue placeholder="Meta vinculada" /></SelectTrigger><SelectContent><SelectItem value="none">Sem meta vinculada</SelectItem>{goals.map((goal) => <SelectItem key={goal.id} value={goal.id}>{goal.goal_name}</SelectItem>)}</SelectContent></Select>
            <Button onClick={() => createHypothesis()} className="orion-gradient text-primary-foreground gap-2"><Plus className="w-4 h-4" />Adicionar hipótese</Button>
          </section>
        </div>

        <section className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2"><Brain className="w-4 h-4 text-primary" /><h2 className="text-heading text-foreground">Planner estratégico</h2></div>
          <div className="rounded-lg border border-border bg-background p-3 text-xs text-muted-foreground">
            Lendo concorrentes, sinais e benchmarks para montar as próximas recomendações executáveis.
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {recommendations.map((item) => (
              <div key={item.id} className="rounded-xl border border-border bg-background p-4 space-y-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.reason}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                  <p><span className="text-foreground">Objetivo:</span> {item.objective}</p>
                  <p><span className="text-foreground">Plataforma:</span> {item.platform}</p>
                  <p><span className="text-foreground">Budget diário:</span> R$ {item.budgetDaily}</p>
                  <p><span className="text-foreground">Janela:</span> {item.timeWindow}</p>
                </div>
                <p className="text-xs text-muted-foreground">Impacto esperado: {item.expectedImpact}</p>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => createCampaignFromRecommendation(item)} className="gap-2"><Rocket className="w-3 h-3" />Criar campanha</Button>
                  <Button size="sm" variant="outline" onClick={() => createBriefFromRecommendation(item)} className="gap-2"><Lightbulb className="w-3 h-3" />Criar brief</Button>
                  <Button size="sm" variant="outline" onClick={() => createHypothesis({
                    title: item.title,
                    hypothesis_statement: item.reason || item.expectedImpact,
                    channel: item.platform,
                    audience: item.audience,
                    experiment_plan: item.strategyNotes,
                    success_metric: item.objective,
                    priority: "medium",
                    strategic_goal_id: strategySummary.activeGoal?.id || "none",
                  })} className="gap-2"><ArrowRight className="w-3 h-3" />Salvar hipótese</Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <section className="bg-card border border-border rounded-xl p-5 space-y-3 xl:col-span-1">
            <h2 className="text-heading text-foreground">Metas</h2>
            {goals.map((goal) => {
              const progress = getGoalProgress(goal, metrics);
              return (
                <div key={goal.id} className="rounded-lg border border-border bg-background p-3">
                  <p className="text-sm font-medium text-foreground">{goal.goal_name}</p>
                  <p className="text-xs text-muted-foreground">{goal.target_metric} · alvo {goal.target_value ?? "—"}</p>
                  <p className="text-xs text-primary mt-1">Progresso {progress.progressPct !== null ? `${Math.round(progress.progressPct)}%` : "indisponível"}</p>
                </div>
              );
            })}
          </section>

          <section className="bg-card border border-border rounded-xl p-5 space-y-3 xl:col-span-1">
            <h2 className="text-heading text-foreground">Hipóteses</h2>
            {hypotheses.map((item) => <div key={item.id} className="rounded-lg border border-border bg-background p-3"><p className="text-sm font-medium text-foreground">{item.title}</p><p className="text-xs text-muted-foreground">{item.channel || "Canal indefinido"} · {item.priority}</p><p className="text-xs text-muted-foreground mt-1">{item.hypothesis_statement}</p><p className="text-xs text-primary mt-1">Meta vinculada: {goals.find((goal) => goal.id === item.strategic_goal_id)?.goal_name || "Nenhuma"}</p></div>)}
          </section>

          <section className="bg-card border border-border rounded-xl p-5 space-y-3 xl:col-span-1">
            <h2 className="text-heading text-foreground">Outcomes</h2>
            {outcomes.map((item) => (
              <div key={item.id} className="rounded-lg border border-border bg-background p-3 space-y-2">
                <p className="text-sm font-medium text-foreground">{item.summary}</p>
                <Textarea defaultValue={item.notes || ""} onBlur={(e) => updateOutcome(item.id, { notes: e.target.value })} placeholder="Notas de revisão" rows={2} className="bg-card resize-none" />
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "Validar", value: "validated" },
                    { label: "Invalidar", value: "invalidated" },
                    { label: "Pending", value: "pending_review" },
                  ].map((status) => (
                    <Button key={status.value} size="sm" variant="outline" onClick={() => updateOutcome(item.id, { outcome_status: status.value, reviewed_at: new Date().toISOString() })}>{status.label}</Button>
                  ))}
                </div>
              </div>
            ))}
          </section>
        </div>
      </div>
    </AppLayout>
  );
};

export default Strategy;
