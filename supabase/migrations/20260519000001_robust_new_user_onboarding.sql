-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: robust_new_user_onboarding
-- Garante que todo usuário que se registra no Supabase Auth receba
-- automaticamente: profile, user_preferences e company_dna (stub).
-- O user_roles (owner) só é criado aqui caso a company_dna já exista;
-- caso contrário, é criado pelo front-end durante o onboarding wizard.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Garante que user_preferences tem a coluna tour_completed ───────────────
ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS tour_completed BOOLEAN NOT NULL DEFAULT false;

-- ── 2. Função handle_new_user (substitui a versão original que só criava profiles)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full_name TEXT;
  v_company_id UUID;
BEGIN
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );

  -- 2a. Profile (idempotente)
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, v_full_name)
  ON CONFLICT (user_id) DO UPDATE
    SET full_name = EXCLUDED.full_name;

  -- 2b. User preferences (idempotente)
  INSERT INTO public.user_preferences (user_id, density_mode, tour_completed)
  VALUES (NEW.id, 'detailed', false)
  ON CONFLICT (user_id) DO NOTHING;

  -- 2c. Company DNA stub (idempotente) — o onboarding wizard vai preenchê-la
  INSERT INTO public.company_dna (
    id,
    user_id,
    company_name,
    dna_data,
    onboarding_completed
  )
  VALUES (
    gen_random_uuid(),
    NEW.id,
    v_full_name || '''s Company',
    '{}'::jsonb,
    false
  )
  ON CONFLICT (user_id) DO NOTHING
  RETURNING id INTO v_company_id;

  -- 2d. Se o stub foi criado agora, define o usuário como owner
  IF v_company_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, company_dna_id, role)
    VALUES (NEW.id, v_company_id, 'owner')
    ON CONFLICT (user_id, company_dna_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- ── 3. Garante que o trigger existe (cria se não existe, ignora se já existe) ─
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'on_auth_user_created'
      AND tgrelid = 'auth.users'::regclass
  ) THEN
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END;
$$;

-- ── 4. Backfill: cria user_preferences para usuários existentes sem registro ──
INSERT INTO public.user_preferences (user_id, density_mode, tour_completed)
SELECT
  u.id,
  'detailed',
  false
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_preferences p WHERE p.user_id = u.id
);

-- ── 5. Backfill: cria company_dna stub para usuários sem empresa ──────────────
WITH new_companies AS (
  INSERT INTO public.company_dna (user_id, company_name, dna_data, onboarding_completed)
  SELECT
    u.id,
    COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)) || '''s Company',
    '{}'::jsonb,
    false
  FROM auth.users u
  WHERE NOT EXISTS (
    SELECT 1 FROM public.company_dna c WHERE c.user_id = u.id
  )
  RETURNING id, user_id
)
-- 5b. Atribui role owner para quem não tem nenhum role
INSERT INTO public.user_roles (user_id, company_dna_id, role)
SELECT nc.user_id, nc.id, 'owner'
FROM new_companies nc
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles r WHERE r.user_id = nc.user_id
)
ON CONFLICT (user_id, company_dna_id, role) DO NOTHING;
