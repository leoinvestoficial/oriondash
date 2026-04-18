CREATE TABLE public.diagnostics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_dna_id UUID REFERENCES public.company_dna(id) ON DELETE SET NULL,
  business_metrics_id UUID REFERENCES public.business_metrics(id) ON DELETE SET NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  area_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  bottlenecks JSONB NOT NULL DEFAULT '[]'::jsonb,
  executive_summary TEXT NOT NULL DEFAULT '',
  recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
  raw_response JSONB NOT NULL DEFAULT '{}'::jsonb,
  model_used TEXT NOT NULL DEFAULT 'google/gemini-2.5-pro',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.diagnostics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own diagnostics" ON public.diagnostics
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own diagnostics" ON public.diagnostics
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own diagnostics" ON public.diagnostics
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own diagnostics" ON public.diagnostics
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_diagnostics_user_created ON public.diagnostics(user_id, created_at DESC);

CREATE TRIGGER update_diagnostics_updated_at
  BEFORE UPDATE ON public.diagnostics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();