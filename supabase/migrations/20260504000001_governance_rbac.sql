-- ============================================================
-- GOVERNANCE MIGRATION: RBAC + ABAC + ReBAC  (idempotent)
-- ============================================================

-- 1a. permissions table (catalog)
CREATE TABLE IF NOT EXISTS public.permissions (
  id text PRIMARY KEY,
  label text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'general',
  created_at timestamptz DEFAULT now()
);
-- Ensure columns exist if table was created by a prior partial migration
ALTER TABLE public.permissions ADD COLUMN IF NOT EXISTS label text NOT NULL DEFAULT '';
ALTER TABLE public.permissions ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'general';

INSERT INTO public.permissions (id, label, category) VALUES
  ('dashboard.view',           'Ver Dashboard',              'dashboard'),
  ('cerebro.view',             'Ver Cérebro',                'cerebro'),
  ('cerebro.interact',         'Interagir com Cérebro',      'cerebro'),
  ('diagnostico.view',         'Ver Diagnóstico',            'diagnostico'),
  ('decisoes.view',            'Ver Decisões',               'decisoes'),
  ('decisoes.apply',           'Aplicar Decisões',           'decisoes'),
  ('strategy.view',            'Ver Estratégia',             'strategy'),
  ('strategy.edit',            'Editar Estratégia',          'strategy'),
  ('intelligence.view',        'Ver Intelligence',           'intelligence'),
  ('funnels.view',             'Ver Funis',                  'funnels'),
  ('funnels.create',           'Criar Funis',                'funnels'),
  ('funnels.edit',             'Editar Funis',               'funnels'),
  ('funnels.approve',          'Aprovar Funis',              'funnels'),
  ('campaigns.view',           'Ver Campanhas',              'campaigns'),
  ('campaigns.create',         'Criar Campanhas',            'campaigns'),
  ('campaigns.edit',           'Editar Campanhas',           'campaigns'),
  ('campaigns.approve',        'Aprovar Campanhas',          'campaigns'),
  ('calendar.view',            'Ver Cronograma',             'calendar'),
  ('calendar.create',          'Criar no Cronograma',        'calendar'),
  ('calendar.edit',            'Editar Cronograma',          'calendar'),
  ('approvals.view',           'Ver Aprovações',             'approvals'),
  ('approvals.approve',        'Aprovar Itens',              'approvals'),
  ('studio.view',              'Ver Estúdio',                'studio'),
  ('studio.create',            'Criar no Estúdio',           'studio'),
  ('personas.view',            'Ver Personas',               'personas'),
  ('brand_identity.view',      'Ver Identidade Visual',      'brand_identity'),
  ('brand_identity.edit',      'Editar Identidade Visual',   'brand_identity'),
  ('clients.view',             'Ver Clientes',               'clients'),
  ('clients.edit',             'Editar Clientes',            'clients'),
  ('tasks.view',               'Ver Tarefas',                'tasks'),
  ('tasks.assign',             'Atribuir Tarefas',           'tasks'),
  ('tasks.complete',           'Concluir Tarefas',           'tasks'),
  ('team.view',                'Ver Equipe',                 'team'),
  ('team.manage',              'Gerenciar Equipe',           'team'),
  ('integrations.view',        'Ver Integrações',            'integrations'),
  ('integrations.manage',      'Gerenciar Integrações',      'integrations'),
  ('metrics.view',             'Ver Métricas',               'metrics'),
  ('metrics.financial.view',   'Ver Métricas Financeiras',   'metrics'),
  ('governance.view',          'Ver Governança',             'governance'),
  ('governance.manage',        'Gerenciar Governança',       'governance'),
  ('settings.view',            'Ver Configurações',          'settings'),
  ('onboarding.view',          'Ver Onboarding',             'onboarding')
ON CONFLICT (id) DO NOTHING;

-- 1b. role_definitions table
DO $$
BEGIN
  -- Earlier migrations used role_definitions for operational company job titles
  -- with a UUID primary key. Governance RBAC needs this name for system roles
  -- with text IDs. Fresh staging/prod rebuilds must normalize the legacy shape
  -- before creating RBAC tables; company job titles are recreated later as
  -- company_role_definitions.
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'role_definitions'
      AND column_name = 'id'
      AND data_type <> 'text'
  ) THEN
    ALTER TABLE public.user_roles
      DROP CONSTRAINT IF EXISTS user_roles_job_title_id_fkey;
    ALTER TABLE public.company_invites
      DROP CONSTRAINT IF EXISTS company_invites_job_title_id_fkey;
    DROP TABLE IF EXISTS public.role_definitions CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.role_definitions (
  id text PRIMARY KEY,
  label text NOT NULL DEFAULT '',
  description text,
  is_system boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
-- Ensure columns exist if table was created by a prior partial migration
ALTER TABLE public.role_definitions ADD COLUMN IF NOT EXISTS label text NOT NULL DEFAULT '';
ALTER TABLE public.role_definitions ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.role_definitions ADD COLUMN IF NOT EXISTS is_system boolean DEFAULT true;

INSERT INTO public.role_definitions (id, label, description) VALUES
  ('owner',           'Proprietário',      'Acesso total ao sistema, incluindo governança'),
  ('admin',           'Administrador',     'Acesso administrativo completo, exceto governança avançada'),
  ('gestor',          'Gestor',            'Gerencia equipe, campanhas e estratégia do time'),
  ('gestor_trafego',  'Gestor de Tráfego', 'Especialista em campanhas pagas e funis de conversão'),
  ('designer',        'Designer',          'Criação visual e identidade de marca'),
  ('copywriter',      'Copywriter',        'Produção de conteúdo e textos persuasivos'),
  ('financeiro',      'Financeiro',        'Acesso a métricas financeiras e relatórios'),
  ('social_media',    'Social Media',      'Gestão de redes sociais e calendário editorial'),
  ('employee',        'Colaborador',       'Acesso básico para execução de tarefas')
ON CONFLICT (id) DO NOTHING;

-- 1c. role_permissions table
CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id text REFERENCES public.role_definitions(id) ON DELETE CASCADE,
  permission_id text REFERENCES public.permissions(id) ON DELETE CASCADE,
  scope text NOT NULL DEFAULT 'company',
  PRIMARY KEY (role_id, permission_id)
);

-- owner: ALL permissions with scope='company'
INSERT INTO public.role_permissions (role_id, permission_id, scope)
SELECT 'owner', id, 'company' FROM public.permissions
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- admin: ALL except governance.manage
INSERT INTO public.role_permissions (role_id, permission_id, scope)
SELECT 'admin', id, 'company' FROM public.permissions WHERE id <> 'governance.manage'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- gestor
INSERT INTO public.role_permissions (role_id, permission_id, scope) VALUES
  ('gestor', 'dashboard.view',       'team'),
  ('gestor', 'strategy.view',        'team'),
  ('gestor', 'strategy.edit',        'team'),
  ('gestor', 'campaigns.view',       'team'),
  ('gestor', 'campaigns.create',     'team'),
  ('gestor', 'campaigns.edit',       'team'),
  ('gestor', 'funnels.view',         'team'),
  ('gestor', 'funnels.edit',         'team'),
  ('gestor', 'calendar.view',        'team'),
  ('gestor', 'calendar.edit',        'team'),
  ('gestor', 'tasks.view',           'team'),
  ('gestor', 'tasks.assign',         'team'),
  ('gestor', 'tasks.complete',       'own'),
  ('gestor', 'team.view',            'team'),
  ('gestor', 'team.manage',          'team'),
  ('gestor', 'metrics.view',         'team'),
  ('gestor', 'approvals.view',       'team'),
  ('gestor', 'approvals.approve',    'team'),
  ('gestor', 'intelligence.view',    'team'),
  ('gestor', 'decisoes.view',        'team'),
  ('gestor', 'cerebro.view',         'own'),
  ('gestor', 'cerebro.interact',     'own'),
  ('gestor', 'settings.view',        'own')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- gestor_trafego
INSERT INTO public.role_permissions (role_id, permission_id, scope) VALUES
  ('gestor_trafego', 'dashboard.view',      'company'),
  ('gestor_trafego', 'campaigns.view',      'company'),
  ('gestor_trafego', 'campaigns.create',    'company'),
  ('gestor_trafego', 'campaigns.edit',      'company'),
  ('gestor_trafego', 'funnels.view',        'company'),
  ('gestor_trafego', 'funnels.create',      'company'),
  ('gestor_trafego', 'funnels.edit',        'company'),
  ('gestor_trafego', 'metrics.view',        'company'),
  ('gestor_trafego', 'decisoes.view',       'company'),
  ('gestor_trafego', 'decisoes.apply',      'own'),
  ('gestor_trafego', 'tasks.view',          'assigned'),
  ('gestor_trafego', 'tasks.complete',      'assigned'),
  ('gestor_trafego', 'intelligence.view',   'company'),
  ('gestor_trafego', 'calendar.view',       'company'),
  ('gestor_trafego', 'settings.view',       'own'),
  ('gestor_trafego', 'cerebro.view',        'own'),
  ('gestor_trafego', 'cerebro.interact',    'own')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- designer
INSERT INTO public.role_permissions (role_id, permission_id, scope) VALUES
  ('designer', 'dashboard.view',       'own'),
  ('designer', 'studio.view',          'company'),
  ('designer', 'studio.create',        'own'),
  ('designer', 'brand_identity.view',  'company'),
  ('designer', 'brand_identity.edit',  'own'),
  ('designer', 'tasks.view',           'assigned'),
  ('designer', 'tasks.complete',       'assigned'),
  ('designer', 'calendar.view',        'company'),
  ('designer', 'approvals.view',       'assigned'),
  ('designer', 'settings.view',        'own')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- copywriter
INSERT INTO public.role_permissions (role_id, permission_id, scope) VALUES
  ('copywriter', 'dashboard.view',      'own'),
  ('copywriter', 'studio.view',         'company'),
  ('copywriter', 'studio.create',       'own'),
  ('copywriter', 'calendar.view',       'company'),
  ('copywriter', 'calendar.create',     'own'),
  ('copywriter', 'calendar.edit',       'assigned'),
  ('copywriter', 'tasks.view',          'assigned'),
  ('copywriter', 'tasks.complete',      'assigned'),
  ('copywriter', 'approvals.view',      'assigned'),
  ('copywriter', 'personas.view',       'company'),
  ('copywriter', 'settings.view',       'own'),
  ('copywriter', 'cerebro.view',        'own'),
  ('copywriter', 'cerebro.interact',    'own')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- financeiro
INSERT INTO public.role_permissions (role_id, permission_id, scope) VALUES
  ('financeiro', 'dashboard.view',          'company'),
  ('financeiro', 'metrics.view',            'company'),
  ('financeiro', 'metrics.financial.view',  'company'),
  ('financeiro', 'campaigns.view',          'company'),
  ('financeiro', 'tasks.view',              'assigned'),
  ('financeiro', 'tasks.complete',          'assigned'),
  ('financeiro', 'settings.view',           'own')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- social_media
INSERT INTO public.role_permissions (role_id, permission_id, scope) VALUES
  ('social_media', 'dashboard.view',      'own'),
  ('social_media', 'calendar.view',       'company'),
  ('social_media', 'calendar.create',     'own'),
  ('social_media', 'calendar.edit',       'assigned'),
  ('social_media', 'studio.view',         'company'),
  ('social_media', 'approvals.view',      'assigned'),
  ('social_media', 'approvals.approve',   'assigned'),
  ('social_media', 'tasks.view',          'assigned'),
  ('social_media', 'tasks.complete',      'assigned'),
  ('social_media', 'personas.view',       'company'),
  ('social_media', 'settings.view',       'own'),
  ('social_media', 'cerebro.view',        'own'),
  ('social_media', 'cerebro.interact',    'own')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- employee
INSERT INTO public.role_permissions (role_id, permission_id, scope) VALUES
  ('employee', 'dashboard.view',   'own'),
  ('employee', 'tasks.view',       'assigned'),
  ('employee', 'tasks.complete',   'assigned'),
  ('employee', 'calendar.view',    'assigned'),
  ('employee', 'settings.view',    'own')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- 1d. organization_members table
CREATE TABLE IF NOT EXISTS public.organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_dna_id uuid NOT NULL REFERENCES public.company_dna(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  role_id text NOT NULL REFERENCES public.role_definitions(id) DEFAULT 'employee',
  name text,
  email text,
  department text,
  seniority text,
  reports_to uuid REFERENCES public.organization_members(id) ON DELETE SET NULL,
  invited_by uuid REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'active',
  custom_permissions jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (company_dna_id, user_id)
);

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- 1e. audit_log table
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_dna_id uuid REFERENCES public.company_dna(id) ON DELETE SET NULL,
  user_id uuid,
  action text NOT NULL,
  resource_type text,
  resource_id text,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- 1f. has_permission() function (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.has_permission(
  _user_id uuid,
  _permission_id text,
  _company_dna_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om
    JOIN public.role_permissions rp ON rp.role_id = om.role_id
    WHERE om.user_id = _user_id
      AND (_company_dna_id IS NULL OR om.company_dna_id = _company_dna_id)
      AND rp.permission_id = _permission_id
      AND om.status = 'active'
    UNION ALL
    SELECT 1
    FROM public.organization_members om
    WHERE om.user_id = _user_id
      AND (_company_dna_id IS NULL OR om.company_dna_id = _company_dna_id)
      AND om.status = 'active'
      AND (om.custom_permissions->>_permission_id)::boolean = true
  )
$$;

-- 1g. get_effective_permissions() function
CREATE OR REPLACE FUNCTION public.get_effective_permissions(_user_id uuid)
RETURNS TABLE (permission_id text, scope text, company_dna_id uuid)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT DISTINCT rp.permission_id, rp.scope, om.company_dna_id
  FROM public.organization_members om
  JOIN public.role_permissions rp ON rp.role_id = om.role_id
  WHERE om.user_id = _user_id AND om.status = 'active'
  UNION
  SELECT key, 'company', om.company_dna_id
  FROM public.organization_members om,
       jsonb_each(om.custom_permissions) AS c(key, value)
  WHERE om.user_id = _user_id AND om.status = 'active'
    AND value::text = 'true'
$$;

-- 1h. RLS policies for organization_members (drop first to avoid duplicates)
DROP POLICY IF EXISTS "members_read_own_company"    ON public.organization_members;
DROP POLICY IF EXISTS "governance_manage_members"   ON public.organization_members;
DROP POLICY IF EXISTS "governance_update_members"   ON public.organization_members;
DROP POLICY IF EXISTS "governance_delete_members"   ON public.organization_members;

CREATE POLICY "members_read_own_company" ON public.organization_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members self
    WHERE self.user_id = auth.uid()
      AND self.company_dna_id = organization_members.company_dna_id
      AND self.status = 'active'
  )
);

CREATE POLICY "governance_manage_members" ON public.organization_members FOR INSERT
WITH CHECK (public.has_permission(auth.uid(), 'governance.manage', company_dna_id));

CREATE POLICY "governance_update_members" ON public.organization_members FOR UPDATE
USING (public.has_permission(auth.uid(), 'governance.manage', company_dna_id));

CREATE POLICY "governance_delete_members" ON public.organization_members FOR DELETE
USING (public.has_permission(auth.uid(), 'governance.manage', company_dna_id));

-- 1i. RLS for audit_log
DROP POLICY IF EXISTS "audit_read_governance" ON public.audit_log;
DROP POLICY IF EXISTS "audit_insert_service"  ON public.audit_log;

CREATE POLICY "audit_read_governance" ON public.audit_log FOR SELECT
USING (public.has_permission(auth.uid(), 'governance.view', company_dna_id));

CREATE POLICY "audit_insert_service" ON public.audit_log FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 1j. Migrate existing user_roles → organization_members
INSERT INTO public.organization_members (company_dna_id, user_id, role_id, status)
SELECT
  ur.company_dna_id,
  ur.user_id,
  CASE ur.role
    WHEN 'owner' THEN 'owner'
    WHEN 'admin' THEN 'admin'
    ELSE 'employee'
  END,
  'active'
FROM public.user_roles ur
WHERE ur.company_dna_id IS NOT NULL
ON CONFLICT (company_dna_id, user_id) DO NOTHING;

-- 1k. Fix user_roles self-promotion vulnerability
DROP POLICY IF EXISTS "Users insert own role" ON public.user_roles;
DROP POLICY IF EXISTS "service_only_insert_roles" ON public.user_roles;
CREATE POLICY "service_only_insert_roles" ON public.user_roles FOR INSERT
WITH CHECK (false);

-- 1l. Update handle_new_company_dna trigger to also insert into organization_members
CREATE OR REPLACE FUNCTION public.handle_new_company_dna()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, company_dna_id, role)
  VALUES (NEW.user_id, NEW.id, 'owner')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.organization_members (company_dna_id, user_id, role_id, status)
  VALUES (NEW.id, NEW.user_id, 'owner', 'active')
  ON CONFLICT (company_dna_id, user_id) DO NOTHING;

  RETURN NEW;
END;
$$;
