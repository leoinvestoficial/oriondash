DROP POLICY IF EXISTS "Anyone can view by token" ON public.company_invites;

CREATE OR REPLACE FUNCTION public.get_invite_preview(_token text)
RETURNS TABLE (
  email text,
  full_name text,
  role public.app_role,
  status text,
  expires_at timestamptz,
  company_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ci.email,
    ci.full_name,
    ci.role,
    ci.status,
    ci.expires_at,
    cd.company_name
  FROM public.company_invites ci
  LEFT JOIN public.company_dna cd ON cd.id = ci.company_dna_id
  WHERE ci.token = _token
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_invite_preview(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_invite_preview(text) TO anon, authenticated;

ALTER PUBLICATION supabase_realtime DROP TABLE public.tasks;
ALTER PUBLICATION supabase_realtime DROP TABLE public.campaigns;
ALTER PUBLICATION supabase_realtime DROP TABLE public.content_calendar;