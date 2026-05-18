-- 1. Enum de papéis
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'employee');

-- 2. Tabela user_roles
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_dna_id uuid REFERENCES public.company_dna(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'employee',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, company_dna_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Funções security definer (evita recursão RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_company(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_dna_id FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role WHEN 'owner' THEN 1 WHEN 'admin' THEN 2 ELSE 3 END
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY 
    CASE role WHEN 'owner' THEN 1 WHEN 'admin' THEN 2 ELSE 3 END
  LIMIT 1
$$;

-- 4. Políticas user_roles
CREATE POLICY "Users view own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users view roles in same company"
ON public.user_roles FOR SELECT
USING (company_dna_id = public.get_user_company(auth.uid()));

CREATE POLICY "Users insert own role"
ON public.user_roles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners manage company roles"
ON public.user_roles FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.company_dna
    WHERE id = user_roles.company_dna_id AND user_id = auth.uid()
  )
);

-- 5. Trigger: criar role owner quando company_dna é criado
CREATE OR REPLACE FUNCTION public.handle_new_company_dna()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, company_dna_id, role)
  VALUES (NEW.user_id, NEW.id, 'owner')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_company_dna_created
AFTER INSERT ON public.company_dna
FOR EACH ROW EXECUTE FUNCTION public.handle_new_company_dna();

-- 6. Tabela de convites
CREATE TABLE public.company_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_dna_id uuid NOT NULL REFERENCES public.company_dna(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL,
  email text NOT NULL,
  full_name text,
  role app_role NOT NULL DEFAULT 'employee',
  token text NOT NULL UNIQUE DEFAULT md5(random()::text || clock_timestamp()::text || gen_random_uuid()::text),
  status text NOT NULL DEFAULT 'pending', -- pending | accepted | revoked
  accepted_by uuid,
  accepted_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '14 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.company_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage invites"
ON public.company_invites FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.company_dna
    WHERE id = company_invites.company_dna_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Anyone can view by token"
ON public.company_invites FOR SELECT
USING (true);

CREATE POLICY "Invitees can accept"
ON public.company_invites FOR UPDATE
USING (status = 'pending' AND expires_at > now());

-- 7. Preferências do usuário (banners ocultos, tour completo)
CREATE TABLE public.user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  hidden_banners text[] NOT NULL DEFAULT ARRAY[]::text[],
  tour_completed boolean NOT NULL DEFAULT false,
  tour_completed_at timestamptz,
  onboarding_checklist jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own preferences"
ON public.user_preferences FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
