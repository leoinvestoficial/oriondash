-- Tabela de cargos definidos pelo dono no Company DNA
CREATE TABLE public.role_definitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_dna_id UUID NOT NULL REFERENCES public.company_dna(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  responsibilities TEXT,
  tools TEXT,
  headcount INTEGER NOT NULL DEFAULT 1,
  seniority TEXT,
  area TEXT DEFAULT 'marketing',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.role_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view company roles"
ON public.role_definitions FOR SELECT
USING (company_dna_id = public.get_user_company(auth.uid()));

CREATE POLICY "Owners insert roles"
ON public.role_definitions FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.company_dna
  WHERE id = role_definitions.company_dna_id AND user_id = auth.uid()
));

CREATE POLICY "Owners update roles"
ON public.role_definitions FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.company_dna
  WHERE id = role_definitions.company_dna_id AND user_id = auth.uid()
));

CREATE POLICY "Owners delete roles"
ON public.role_definitions FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.company_dna
  WHERE id = role_definitions.company_dna_id AND user_id = auth.uid()
));

CREATE TRIGGER update_role_definitions_updated_at
BEFORE UPDATE ON public.role_definitions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_role_definitions_company ON public.role_definitions(company_dna_id);

-- Vincula colaborador a um cargo específico
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS job_title_id UUID REFERENCES public.role_definitions(id) ON DELETE SET NULL;
ALTER TABLE public.company_invites ADD COLUMN IF NOT EXISTS job_title_id UUID REFERENCES public.role_definitions(id) ON DELETE SET NULL;

-- Estrutura geral da equipe
ALTER TABLE public.company_dna ADD COLUMN IF NOT EXISTS team_structure JSONB NOT NULL DEFAULT '{}'::jsonb;