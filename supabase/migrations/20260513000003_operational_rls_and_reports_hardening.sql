-- Operational hardening: safer company-scoped RLS for the Orion operational
-- layer plus additive executive_reports convergence. This migration is
-- intentionally non-destructive.

CREATE OR REPLACE FUNCTION public.user_can_view_company(_company_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(
    _company_id IN (
      SELECT id FROM public.company_dna WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.organization_members om
      WHERE om.company_dna_id = _company_id
        AND om.user_id = auth.uid()
        AND COALESCE(om.status, 'active') IN ('active', 'joined', 'accepted')
    )
    OR EXISTS (
      SELECT 1
      FROM public.agency_accounts aa
      WHERE aa.client_company_id = _company_id
        AND aa.status = 'active'
        AND aa.agency_company_id IN (
          SELECT id FROM public.company_dna WHERE user_id = auth.uid()
        )
    ),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.user_can_operate_company(_company_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(
    _company_id IN (
      SELECT id FROM public.company_dna WHERE user_id = auth.uid()
    )
    OR public.has_permission(auth.uid(), 'tasks.edit', _company_id)
    OR public.has_permission(auth.uid(), 'campaigns.edit', _company_id)
    OR public.has_permission(auth.uid(), 'approvals.approve', _company_id),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.user_can_manage_company_finance(_company_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(
    _company_id IN (
      SELECT id FROM public.company_dna WHERE user_id = auth.uid()
    )
    OR public.has_permission(auth.uid(), 'metrics.financial.manage', _company_id)
    OR public.has_permission(auth.uid(), 'governance.manage', _company_id),
    false
  );
$$;

-- Permission used by finance target policies. Existing role seeds keep working.
INSERT INTO public.permissions (id, label, category)
VALUES ('metrics.financial.manage', 'Gerenciar Metas Financeiras', 'metrics')
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  category = EXCLUDED.category;

INSERT INTO public.role_permissions (role_id, permission_id, scope)
VALUES
  ('owner', 'metrics.financial.manage', 'company'),
  ('admin', 'metrics.financial.manage', 'company')
ON CONFLICT DO NOTHING;

-- Operational memory: additive fields for derived learnings.
ALTER TABLE public.operational_memory
  ADD COLUMN IF NOT EXISTS learning_type text,
  ADD COLUMN IF NOT EXISTS source_count integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS related_entities jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS period_start date,
  ADD COLUMN IF NOT EXISTS period_end date,
  ADD COLUMN IF NOT EXISTS generated_by text NOT NULL DEFAULT 'user';

CREATE INDEX IF NOT EXISTS idx_operational_memory_learning_period
ON public.operational_memory(company_id, learning_type, period_start DESC);

-- action_orchestrations RLS: company scoped, not only row owner scoped.
DROP POLICY IF EXISTS "Users manage own action orchestrations" ON public.action_orchestrations;
DROP POLICY IF EXISTS "action_orchestrations_select_company" ON public.action_orchestrations;
DROP POLICY IF EXISTS "action_orchestrations_insert_company" ON public.action_orchestrations;
DROP POLICY IF EXISTS "action_orchestrations_update_company" ON public.action_orchestrations;
DROP POLICY IF EXISTS "action_orchestrations_delete_owner" ON public.action_orchestrations;

CREATE POLICY "action_orchestrations_select_company"
ON public.action_orchestrations FOR SELECT
USING (
  auth.uid() = user_id
  OR public.user_can_view_company(company_id)
);

CREATE POLICY "action_orchestrations_insert_company"
ON public.action_orchestrations FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND (company_id IS NULL OR public.user_can_operate_company(company_id))
);

CREATE POLICY "action_orchestrations_update_company"
ON public.action_orchestrations FOR UPDATE
USING (
  auth.uid() = user_id
  OR public.user_can_operate_company(company_id)
)
WITH CHECK (
  auth.uid() = user_id
  OR public.user_can_operate_company(company_id)
);

CREATE POLICY "action_orchestrations_delete_owner"
ON public.action_orchestrations FOR DELETE
USING (
  auth.uid() = user_id
  OR company_id IN (SELECT id FROM public.company_dna WHERE user_id = auth.uid())
);

-- operational_memory RLS.
DROP POLICY IF EXISTS "Users manage own operational memory" ON public.operational_memory;
DROP POLICY IF EXISTS "operational_memory_select_company" ON public.operational_memory;
DROP POLICY IF EXISTS "operational_memory_insert_company" ON public.operational_memory;
DROP POLICY IF EXISTS "operational_memory_update_company" ON public.operational_memory;
DROP POLICY IF EXISTS "operational_memory_delete_owner" ON public.operational_memory;

CREATE POLICY "operational_memory_select_company"
ON public.operational_memory FOR SELECT
USING (
  auth.uid() = user_id
  OR public.user_can_view_company(company_id)
);

CREATE POLICY "operational_memory_insert_company"
ON public.operational_memory FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND (company_id IS NULL OR public.user_can_operate_company(company_id))
);

CREATE POLICY "operational_memory_update_company"
ON public.operational_memory FOR UPDATE
USING (
  auth.uid() = user_id
  OR public.user_can_operate_company(company_id)
)
WITH CHECK (
  auth.uid() = user_id
  OR public.user_can_operate_company(company_id)
);

CREATE POLICY "operational_memory_delete_owner"
ON public.operational_memory FOR DELETE
USING (
  auth.uid() = user_id
  OR company_id IN (SELECT id FROM public.company_dna WHERE user_id = auth.uid())
);

-- marketing_finance_targets RLS. View can be broader than write.
DROP POLICY IF EXISTS "Users manage own marketing finance targets" ON public.marketing_finance_targets;
DROP POLICY IF EXISTS "marketing_finance_targets_select_company" ON public.marketing_finance_targets;
DROP POLICY IF EXISTS "marketing_finance_targets_insert_owner" ON public.marketing_finance_targets;
DROP POLICY IF EXISTS "marketing_finance_targets_update_owner" ON public.marketing_finance_targets;
DROP POLICY IF EXISTS "marketing_finance_targets_delete_owner" ON public.marketing_finance_targets;

CREATE POLICY "marketing_finance_targets_select_company"
ON public.marketing_finance_targets FOR SELECT
USING (
  auth.uid() = user_id
  OR public.user_can_view_company(company_id)
);

CREATE POLICY "marketing_finance_targets_insert_owner"
ON public.marketing_finance_targets FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND public.user_can_manage_company_finance(company_id)
);

CREATE POLICY "marketing_finance_targets_update_owner"
ON public.marketing_finance_targets FOR UPDATE
USING (
  auth.uid() = user_id
  OR public.user_can_manage_company_finance(company_id)
)
WITH CHECK (
  auth.uid() = user_id
  OR public.user_can_manage_company_finance(company_id)
);

CREATE POLICY "marketing_finance_targets_delete_owner"
ON public.marketing_finance_targets FOR DELETE
USING (
  auth.uid() = user_id
  OR company_id IN (SELECT id FROM public.company_dna WHERE user_id = auth.uid())
);

-- agency_accounts RLS.
DROP POLICY IF EXISTS "Users manage own agency accounts" ON public.agency_accounts;
DROP POLICY IF EXISTS "agency_accounts_select_related" ON public.agency_accounts;
DROP POLICY IF EXISTS "agency_accounts_insert_agency_owner" ON public.agency_accounts;
DROP POLICY IF EXISTS "agency_accounts_update_agency_owner" ON public.agency_accounts;
DROP POLICY IF EXISTS "agency_accounts_delete_agency_owner" ON public.agency_accounts;

CREATE POLICY "agency_accounts_select_related"
ON public.agency_accounts FOR SELECT
USING (
  auth.uid() = owner_user_id
  OR public.user_can_view_company(agency_company_id)
  OR public.user_can_view_company(client_company_id)
);

CREATE POLICY "agency_accounts_insert_agency_owner"
ON public.agency_accounts FOR INSERT
WITH CHECK (
  auth.uid() = owner_user_id
  AND agency_company_id IN (SELECT id FROM public.company_dna WHERE user_id = auth.uid())
);

CREATE POLICY "agency_accounts_update_agency_owner"
ON public.agency_accounts FOR UPDATE
USING (
  auth.uid() = owner_user_id
  OR agency_company_id IN (SELECT id FROM public.company_dna WHERE user_id = auth.uid())
)
WITH CHECK (
  auth.uid() = owner_user_id
  OR agency_company_id IN (SELECT id FROM public.company_dna WHERE user_id = auth.uid())
);

CREATE POLICY "agency_accounts_delete_agency_owner"
ON public.agency_accounts FOR DELETE
USING (
  auth.uid() = owner_user_id
  OR agency_company_id IN (SELECT id FROM public.company_dna WHERE user_id = auth.uid())
);

-- executive_reports additive convergence. No drop, no data rewrite.
ALTER TABLE public.executive_reports
  ADD COLUMN IF NOT EXISTS company_dna_id uuid REFERENCES public.company_dna(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS report_type text NOT NULL DEFAULT 'weekly',
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'ready',
  ADD COLUMN IF NOT EXISTS content jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS decisions_applied integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS top_win text,
  ADD COLUMN IF NOT EXISTS top_loss text,
  ADD COLUMN IF NOT EXISTS next_priority text,
  ADD COLUMN IF NOT EXISTS raw_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS generated_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_executive_reports_company_created
ON public.executive_reports(company_dna_id, created_at DESC);
