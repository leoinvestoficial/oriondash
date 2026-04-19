
-- SSOT: Memória viva do negócio
CREATE TABLE public.business_memory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_dna_id UUID REFERENCES public.company_dna(id) ON DELETE SET NULL,
  memory_type TEXT NOT NULL, -- chat | metric | decision | diagnostic | upload | note | event | task
  source TEXT NOT NULL DEFAULT 'manual', -- manual | system | ai | integration
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  importance INTEGER NOT NULL DEFAULT 3 CHECK (importance BETWEEN 1 AND 5),
  reference_table TEXT,
  reference_id UUID,
  raw_data JSONB DEFAULT '{}'::JSONB,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_business_memory_user_date ON public.business_memory(user_id, occurred_at DESC);
CREATE INDEX idx_business_memory_type ON public.business_memory(user_id, memory_type);
CREATE INDEX idx_business_memory_tags ON public.business_memory USING GIN(tags);
CREATE INDEX idx_business_memory_importance ON public.business_memory(user_id, importance DESC);

ALTER TABLE public.business_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own memory" ON public.business_memory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own memory" ON public.business_memory FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own memory" ON public.business_memory FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own memory" ON public.business_memory FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_business_memory_updated_at
BEFORE UPDATE ON public.business_memory
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Bucket privado para uploads livres da central
INSERT INTO storage.buckets (id, name, public)
VALUES ('memory-uploads', 'memory-uploads', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users view own memory uploads"
ON storage.objects FOR SELECT
USING (bucket_id = 'memory-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload own memory files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'memory-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own memory files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'memory-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own memory files"
ON storage.objects FOR DELETE
USING (bucket_id = 'memory-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
