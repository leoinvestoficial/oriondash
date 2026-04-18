CREATE TABLE public.ai_decisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  diagnostic_id UUID REFERENCES public.diagnostics(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  title TEXT NOT NULL,
  rationale TEXT NOT NULL,
  evidence TEXT NOT NULL DEFAULT '',
  expected_impact TEXT NOT NULL DEFAULT '',
  severity TEXT NOT NULL DEFAULT 'media' CHECK (severity IN ('alta','media','baixa')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','applied','dismissed')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  result JSONB NOT NULL DEFAULT '{}'::jsonb,
  applied_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own decisions" ON public.ai_decisions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own decisions" ON public.ai_decisions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own decisions" ON public.ai_decisions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own decisions" ON public.ai_decisions FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_ai_decisions_user_status ON public.ai_decisions(user_id, status, created_at DESC);

CREATE TRIGGER update_ai_decisions_updated_at
  BEFORE UPDATE ON public.ai_decisions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.metrics_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  metric TEXT NOT NULL,
  delta_pct NUMERIC,
  current_value NUMERIC,
  previous_value NUMERIC,
  severity TEXT NOT NULL DEFAULT 'media' CHECK (severity IN ('alta','media','baixa')),
  message TEXT NOT NULL,
  acknowledged BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.metrics_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own alerts" ON public.metrics_alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own alerts" ON public.metrics_alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own alerts" ON public.metrics_alerts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own alerts" ON public.metrics_alerts FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_metrics_alerts_user_ack ON public.metrics_alerts(user_id, acknowledged, created_at DESC);