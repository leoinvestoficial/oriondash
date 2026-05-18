-- Adds a restricted client viewer role for portal/client approvals.
-- This role can inspect basic operational context but cannot execute or publish.

INSERT INTO public.role_definitions (id, label, description, is_system)
VALUES (
  'client_viewer',
  'Cliente - Visualizador',
  'Acesso de cliente para acompanhar contexto, relatorios e aprovacoes sem operar execucao.',
  true
)
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  is_system = EXCLUDED.is_system;

DELETE FROM public.role_permissions
WHERE role_id = 'client_viewer';

INSERT INTO public.role_permissions (role_id, permission_id, scope)
VALUES
  ('client_viewer', 'dashboard.view', 'company'),
  ('client_viewer', 'campaigns.view', 'company'),
  ('client_viewer', 'approvals.view', 'company'),
  ('client_viewer', 'metrics.view', 'company'),
  ('client_viewer', 'settings.view', 'own')
ON CONFLICT (role_id, permission_id) DO NOTHING;
