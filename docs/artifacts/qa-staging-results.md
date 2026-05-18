# QA Staging API Results

## Environment

- Dev server: http://127.0.0.1:8080
- Supabase URL: https://fszzzufduriltihmyoxu.supabase.co
- Meta provider flag: false
- Dev auth bypass: false

## SPA routes
- /: HTTP 200
- /central: HTTP 200
- /dashboard: HTTP 200
- /studio: HTTP 200
- /approvals: HTTP 200
- /chat?prompt=Teste&context=central: HTTP 200

## Auth

- owner_company_a login: pass
- manager_company_a login: pass
- client_viewer_company_a login: pass
- owner_company_b login: pass
- agency_admin login: pass

## Owner A data visibility

- publication_jobs Company A count: 2
- publication_logs Company A count: 1
- operational_memory Company A count: 1
- action_orchestrations Company A count: 2
- marketing_finance_targets Company A count: 1

## Cross-company visibility

- owner_company_b sees Company A publication_jobs count: 0
- agency_admin sees linked Company A publication_jobs count: 2

## Publication mock

- job 90000000-0000-4000-8000-000000000001: status=awaiting_approval, data_origin=mock, channel=instagram, type=organic_post, requires_approval=true

## Operational memory

- memory d0000000-0000-4000-8000-000000000001: type=publication_learning, source=publication_job, channel=instagram, title=Publicacao mock preparada para remarketing
