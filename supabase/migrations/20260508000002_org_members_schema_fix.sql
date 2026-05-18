-- Fix organization_members schema to match frontend expectations
-- The frontend needs: name, email (not invited_email), status (not invite_status), custom_permissions

ALTER TABLE public.organization_members
  ADD COLUMN IF NOT EXISTS name              TEXT,
  ADD COLUMN IF NOT EXISTS email             TEXT,
  ADD COLUMN IF NOT EXISTS status            TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS custom_permissions JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Backfill legacy columns only when they exist. Some environments were created
-- after organization_members already used the normalized schema.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'organization_members'
      AND column_name = 'invited_email'
  ) THEN
    UPDATE public.organization_members
    SET email = invited_email
    WHERE email IS NULL AND invited_email IS NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'organization_members'
      AND column_name = 'invite_status'
  ) THEN
    UPDATE public.organization_members
    SET status = CASE
      WHEN invite_status = 'accepted' THEN 'active'
      WHEN invite_status = 'pending'  THEN 'pending'
      ELSE 'inactive'
    END
    WHERE status = 'active' AND invite_status IS NOT NULL;
  END IF;
END $$;

-- Index for common query pattern (user_id + status)
CREATE INDEX IF NOT EXISTS idx_org_members_user_status
  ON public.organization_members (user_id, status);

-- Index for company_dna_id lookups
CREATE INDEX IF NOT EXISTS idx_org_members_company
  ON public.organization_members (company_dna_id);

-- Foreign key to role_definitions so PostgREST can resolve the join
-- organization_members.role_id → role_definitions.id
ALTER TABLE public.organization_members
  ADD CONSTRAINT fk_org_members_role
  FOREIGN KEY (role_id) REFERENCES public.role_definitions(id)
  ON UPDATE CASCADE
  ON DELETE SET DEFAULT;
