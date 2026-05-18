-- Assisted publication layer. Non-destructive and policy-first: the AI can
-- prepare/schedule within explicit autonomy limits, but sensitive publication
-- requires approval.

CREATE TABLE IF NOT EXISTS public.publication_policies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES public.company_dna(id) ON DELETE CASCADE,
  channel text NOT NULL,
  publication_type text NOT NULL,
  autonomy_level_allowed text NOT NULL DEFAULT 'assisted_execution'
    CHECK (autonomy_level_allowed IN ('insight_only', 'assisted_execution', 'partial_automation', 'limited_autonomy')),
  requires_approval boolean NOT NULL DEFAULT true,
  approval_role_required text,
  max_daily_posts integer,
  max_daily_budget numeric,
  allowed_time_windows jsonb NOT NULL DEFAULT '[]'::jsonb,
  blocked_words text[] NOT NULL DEFAULT '{}',
  required_brand_checks text[] NOT NULL DEFAULT '{}',
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, channel, publication_type)
);

ALTER TABLE public.publication_policies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "publication_policies_select_company" ON public.publication_policies;
DROP POLICY IF EXISTS "publication_policies_insert_owner" ON public.publication_policies;
DROP POLICY IF EXISTS "publication_policies_update_owner" ON public.publication_policies;
DROP POLICY IF EXISTS "publication_policies_delete_owner" ON public.publication_policies;

CREATE POLICY "publication_policies_select_company"
ON public.publication_policies FOR SELECT
USING (
  auth.uid() = created_by
  OR public.user_can_view_company(company_id)
);

CREATE POLICY "publication_policies_insert_owner"
ON public.publication_policies FOR INSERT
WITH CHECK (
  auth.uid() = created_by
  AND (
    company_id IN (SELECT id FROM public.company_dna WHERE user_id = auth.uid())
    OR public.has_permission(auth.uid(), 'governance.manage', company_id)
  )
);

CREATE POLICY "publication_policies_update_owner"
ON public.publication_policies FOR UPDATE
USING (
  auth.uid() = created_by
  OR company_id IN (SELECT id FROM public.company_dna WHERE user_id = auth.uid())
  OR public.has_permission(auth.uid(), 'governance.manage', company_id)
)
WITH CHECK (
  auth.uid() = created_by
  OR company_id IN (SELECT id FROM public.company_dna WHERE user_id = auth.uid())
  OR public.has_permission(auth.uid(), 'governance.manage', company_id)
);

CREATE POLICY "publication_policies_delete_owner"
ON public.publication_policies FOR DELETE
USING (
  auth.uid() = created_by
  OR company_id IN (SELECT id FROM public.company_dna WHERE user_id = auth.uid())
);

DROP TRIGGER IF EXISTS update_publication_policies_updated_at ON public.publication_policies;
CREATE TRIGGER update_publication_policies_updated_at
BEFORE UPDATE ON public.publication_policies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.publication_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES public.company_dna(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  source_type text NOT NULL DEFAULT 'manual',
  source_id uuid,
  orchestration_id uuid REFERENCES public.action_orchestrations(id) ON DELETE SET NULL,
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE SET NULL,
  approval_id uuid REFERENCES public.approvals(id) ON DELETE SET NULL,
  channel text NOT NULL CHECK (channel IN ('instagram', 'facebook', 'meta_ads', 'google_ads', 'tiktok', 'linkedin', 'email', 'whatsapp')),
  publication_type text NOT NULL CHECK (publication_type IN ('organic_post', 'paid_ad', 'story', 'reel', 'carousel', 'email', 'whatsapp_message', 'landing_page_update')),
  title text NOT NULL,
  copy text,
  caption text,
  creative_asset_url text,
  creative_asset_id uuid,
  scheduled_at timestamptz,
  published_at timestamptz,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'awaiting_approval', 'approved', 'scheduled', 'publishing', 'published', 'failed', 'canceled', 'expired')),
  autonomy_level text NOT NULL DEFAULT 'assisted_execution'
    CHECK (autonomy_level IN ('insight_only', 'assisted_execution', 'partial_automation', 'limited_autonomy')),
  requires_approval boolean NOT NULL DEFAULT true,
  approved_by uuid,
  approved_at timestamptz,
  external_platform text,
  external_post_id text,
  external_campaign_id text,
  error_message text,
  policy_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  data_origin text NOT NULL DEFAULT 'mock'
    CHECK (data_origin IN ('real', 'imported', 'inferred', 'estimated', 'demo', 'mock', 'unknown')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.publication_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "publication_jobs_select_company" ON public.publication_jobs;
DROP POLICY IF EXISTS "publication_jobs_insert_company" ON public.publication_jobs;
DROP POLICY IF EXISTS "publication_jobs_update_company" ON public.publication_jobs;
DROP POLICY IF EXISTS "publication_jobs_delete_owner" ON public.publication_jobs;

CREATE POLICY "publication_jobs_select_company"
ON public.publication_jobs FOR SELECT
USING (
  auth.uid() = user_id
  OR public.user_can_view_company(company_id)
);

CREATE POLICY "publication_jobs_insert_company"
ON public.publication_jobs FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND (company_id IS NULL OR public.user_can_operate_company(company_id))
);

CREATE POLICY "publication_jobs_update_company"
ON public.publication_jobs FOR UPDATE
USING (
  auth.uid() = user_id
  OR public.user_can_operate_company(company_id)
  OR public.has_permission(auth.uid(), 'approvals.approve', company_id)
)
WITH CHECK (
  auth.uid() = user_id
  OR public.user_can_operate_company(company_id)
  OR public.has_permission(auth.uid(), 'approvals.approve', company_id)
);

CREATE POLICY "publication_jobs_delete_owner"
ON public.publication_jobs FOR DELETE
USING (
  auth.uid() = user_id
  OR company_id IN (SELECT id FROM public.company_dna WHERE user_id = auth.uid())
);

DROP TRIGGER IF EXISTS update_publication_jobs_updated_at ON public.publication_jobs;
CREATE TRIGGER update_publication_jobs_updated_at
BEFORE UPDATE ON public.publication_jobs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_publication_jobs_company_status
ON public.publication_jobs(company_id, status, scheduled_at DESC);

CREATE INDEX IF NOT EXISTS idx_publication_jobs_user_status
ON public.publication_jobs(user_id, status, scheduled_at DESC);

CREATE TABLE IF NOT EXISTS public.publication_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES public.company_dna(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  publication_job_id uuid NOT NULL REFERENCES public.publication_jobs(id) ON DELETE CASCADE,
  action text NOT NULL,
  status_from text,
  status_to text,
  channel text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.publication_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "publication_logs_select_company" ON public.publication_logs;
DROP POLICY IF EXISTS "publication_logs_insert_company" ON public.publication_logs;

CREATE POLICY "publication_logs_select_company"
ON public.publication_logs FOR SELECT
USING (
  auth.uid() = user_id
  OR public.user_can_view_company(company_id)
);

CREATE POLICY "publication_logs_insert_company"
ON public.publication_logs FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND (company_id IS NULL OR public.user_can_operate_company(company_id))
);

CREATE INDEX IF NOT EXISTS idx_publication_logs_job_created
ON public.publication_logs(publication_job_id, created_at DESC);

ALTER TABLE public.operational_memory
  DROP CONSTRAINT IF EXISTS operational_memory_memory_type_check;

ALTER TABLE public.operational_memory
  ADD CONSTRAINT operational_memory_memory_type_check
  CHECK (memory_type IN (
    'decision_learning', 'orchestration_learning', 'creative_learning',
    'general_learning', 'publication_learning', 'winning_creative',
    'failed_creative', 'winning_copy', 'failed_copy',
    'audience_learning', 'offer_learning', 'campaign_learning',
    'funnel_learning', 'budget_learning', 'approval_learning',
    'agency_learning'
  ));

ALTER TABLE public.approvals
  ADD COLUMN IF NOT EXISTS approval_type text,
  ADD COLUMN IF NOT EXISTS related_entity_type text,
  ADD COLUMN IF NOT EXISTS related_entity_id uuid,
  ADD COLUMN IF NOT EXISTS requested_by uuid,
  ADD COLUMN IF NOT EXISTS assigned_to uuid,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejected_at timestamptz;
