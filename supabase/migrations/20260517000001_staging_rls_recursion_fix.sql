-- Fix recursive RLS paths discovered during staging validation.
-- Policies should use SECURITY DEFINER helpers instead of querying company_dna
-- directly from policy expressions.

CREATE OR REPLACE FUNCTION public.user_owns_company(_company_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(
    EXISTS (
      SELECT 1
      FROM public.company_dna cd
      WHERE cd.id = _company_id
        AND cd.user_id = auth.uid()
    ),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.user_is_active_company_member(_company_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(
    EXISTS (
      SELECT 1
      FROM public.organization_members om
      WHERE om.company_dna_id = _company_id
        AND om.user_id = auth.uid()
        AND COALESCE(om.status, 'active') IN ('active', 'joined', 'accepted')
    ),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.user_can_view_company(_company_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(
    public.user_owns_company(_company_id)
    OR public.user_is_active_company_member(_company_id)
    OR EXISTS (
      SELECT 1
      FROM public.agency_accounts aa
      WHERE aa.client_company_id = _company_id
        AND aa.status = 'active'
        AND public.user_owns_company(aa.agency_company_id)
    ),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.user_can_operate_company(_company_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(
    public.user_owns_company(_company_id)
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
    public.user_owns_company(_company_id)
    OR public.has_permission(auth.uid(), 'metrics.financial.manage', _company_id)
    OR public.has_permission(auth.uid(), 'governance.manage', _company_id),
    false
  );
$$;

-- company_dna
DROP POLICY IF EXISTS "org_read_company_dna" ON public.company_dna;
CREATE POLICY "org_read_company_dna" ON public.company_dna FOR SELECT
USING (
  auth.uid() = user_id
  OR public.user_is_active_company_member(id)
);

-- organization_members
DROP POLICY IF EXISTS "members_read_own_company" ON public.organization_members;
DROP POLICY IF EXISTS "org_members_company_read" ON public.organization_members;
DROP POLICY IF EXISTS "org_members_owner_write" ON public.organization_members;

CREATE POLICY "members_read_own_company"
ON public.organization_members FOR SELECT
USING (
  public.user_is_active_company_member(company_dna_id)
  OR public.user_owns_company(company_dna_id)
);

CREATE POLICY "org_members_owner_write"
ON public.organization_members FOR ALL
USING (public.user_owns_company(company_dna_id))
WITH CHECK (public.user_owns_company(company_dna_id));

-- agency_accounts
DROP POLICY IF EXISTS "agency_accounts_insert_agency_owner" ON public.agency_accounts;
DROP POLICY IF EXISTS "agency_accounts_update_agency_owner" ON public.agency_accounts;
DROP POLICY IF EXISTS "agency_accounts_delete_agency_owner" ON public.agency_accounts;

CREATE POLICY "agency_accounts_insert_agency_owner"
ON public.agency_accounts FOR INSERT
WITH CHECK (
  auth.uid() = owner_user_id
  AND public.user_owns_company(agency_company_id)
);

CREATE POLICY "agency_accounts_update_agency_owner"
ON public.agency_accounts FOR UPDATE
USING (
  auth.uid() = owner_user_id
  OR public.user_owns_company(agency_company_id)
)
WITH CHECK (
  auth.uid() = owner_user_id
  OR public.user_owns_company(agency_company_id)
);

CREATE POLICY "agency_accounts_delete_agency_owner"
ON public.agency_accounts FOR DELETE
USING (
  auth.uid() = owner_user_id
  OR public.user_owns_company(agency_company_id)
);

-- action_orchestrations
DROP POLICY IF EXISTS "action_orchestrations_delete_owner" ON public.action_orchestrations;
CREATE POLICY "action_orchestrations_delete_owner"
ON public.action_orchestrations FOR DELETE
USING (
  auth.uid() = user_id
  OR public.user_owns_company(company_id)
);

-- operational_memory
DROP POLICY IF EXISTS "operational_memory_delete_owner" ON public.operational_memory;
CREATE POLICY "operational_memory_delete_owner"
ON public.operational_memory FOR DELETE
USING (
  auth.uid() = user_id
  OR public.user_owns_company(company_id)
);

-- marketing_finance_targets
DROP POLICY IF EXISTS "marketing_finance_targets_insert_owner" ON public.marketing_finance_targets;
DROP POLICY IF EXISTS "marketing_finance_targets_update_owner" ON public.marketing_finance_targets;
DROP POLICY IF EXISTS "marketing_finance_targets_delete_owner" ON public.marketing_finance_targets;

CREATE POLICY "marketing_finance_targets_insert_owner"
ON public.marketing_finance_targets FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND (company_id IS NULL OR public.user_can_manage_company_finance(company_id))
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
  OR public.user_owns_company(company_id)
);

-- publication_policies
DROP POLICY IF EXISTS "publication_policies_insert_owner" ON public.publication_policies;
DROP POLICY IF EXISTS "publication_policies_update_owner" ON public.publication_policies;
DROP POLICY IF EXISTS "publication_policies_delete_owner" ON public.publication_policies;

CREATE POLICY "publication_policies_insert_owner"
ON public.publication_policies FOR INSERT
WITH CHECK (
  auth.uid() = created_by
  AND (
    public.user_owns_company(company_id)
    OR public.has_permission(auth.uid(), 'governance.manage', company_id)
  )
);

CREATE POLICY "publication_policies_update_owner"
ON public.publication_policies FOR UPDATE
USING (
  auth.uid() = created_by
  OR public.user_owns_company(company_id)
  OR public.has_permission(auth.uid(), 'governance.manage', company_id)
)
WITH CHECK (
  auth.uid() = created_by
  OR public.user_owns_company(company_id)
  OR public.has_permission(auth.uid(), 'governance.manage', company_id)
);

CREATE POLICY "publication_policies_delete_owner"
ON public.publication_policies FOR DELETE
USING (
  auth.uid() = created_by
  OR public.user_owns_company(company_id)
);

-- publication_jobs
DROP POLICY IF EXISTS "publication_jobs_delete_owner" ON public.publication_jobs;
CREATE POLICY "publication_jobs_delete_owner"
ON public.publication_jobs FOR DELETE
USING (
  auth.uid() = user_id
  OR public.user_owns_company(company_id)
);
