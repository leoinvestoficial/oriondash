
-- Tabela: snapshots históricos de métricas de negócio
CREATE TABLE public.business_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_dna_id UUID REFERENCES public.company_dna(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  -- Economics
  avg_ticket NUMERIC,
  avg_margin_pct NUMERIC,
  cac_current NUMERIC,
  ltv_estimated NUMERIC,
  payback_months NUMERIC,
  -- Funnel snapshot
  monthly_traffic INTEGER,
  conversion_rate_pct NUMERIC,
  avg_roas NUMERIC,
  monthly_revenue NUMERIC,
  -- Context
  perceived_bottlenecks TEXT,
  current_tools TEXT,
  team_size INTEGER,
  notes TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.business_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own business metrics"
  ON public.business_metrics FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own business metrics"
  ON public.business_metrics FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own business metrics"
  ON public.business_metrics FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own business metrics"
  ON public.business_metrics FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_business_metrics_updated_at
  BEFORE UPDATE ON public.business_metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_business_metrics_user_date ON public.business_metrics(user_id, snapshot_date DESC);

-- Tabela: criativos uploadados pelo cliente no onboarding
CREATE TABLE public.creative_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_dna_id UUID REFERENCES public.company_dna(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  asset_kind TEXT NOT NULL DEFAULT 'ad',
  performance_label TEXT,
  copy_text TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.creative_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own creative uploads"
  ON public.creative_uploads FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_creative_uploads_updated_at
  BEFORE UPDATE ON public.creative_uploads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Bucket de storage para criativos (privado)
INSERT INTO storage.buckets (id, name, public)
VALUES ('creative-uploads', 'creative-uploads', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users view own creative files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'creative-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload own creative files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'creative-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own creative files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'creative-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own creative files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'creative-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
