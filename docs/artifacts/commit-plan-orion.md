# Plano de Commits - Orion

Data: 18/05/2026

## Não commitar

- `.env`
- `.env.staging`
- service role keys
- tokens Meta/Supabase
- dumps locais sensíveis
- qualquer secret em artifact

## Commit 1 - Migrations corrigidas

Arquivos sugeridos:

- `supabase/migrations/20260504000001_governance_rbac.sql`
- `supabase/migrations/20260508000002_org_members_schema_fix.sql`
- `supabase/migrations/20260512000004_analyst_tick_cron.sql`
- `supabase/migrations/20260513000003_operational_rls_and_reports_hardening.sql`
- `supabase/migrations/20260517000001_staging_rls_recursion_fix.sql`
- `supabase/migrations/20260517000002_client_viewer_role.sql`

Mensagem sugerida:

`fix: harden staging migrations and operational rls`

## Commit 2 - Types Supabase

Arquivos sugeridos:

- `src/integrations/supabase/types.ts`

Mensagem sugerida:

`chore: regenerate supabase types from staging`

## Commit 3 - Central/loop operacional

Arquivos sugeridos:

- `src/pages/CentralOrion.tsx`
- `src/hooks/useCentralOrion.ts`
- `src/hooks/useActionOrchestrations.ts`
- `src/hooks/useMarketingFinanceTargets.ts`
- `src/lib/operationalMemory.ts`
- `src/lib/deriveOperationalLearning.ts`
- `src/lib/centralChatContext.ts`
- componentes em `src/components/central/`

Mensagem sugerida:

`feat: consolidate central orion operational loop`

## Commit 4 - Publicação Assistida

Arquivos sugeridos:

- `src/hooks/usePublicationJobs.ts`
- `src/hooks/usePublicationPolicies.ts`
- `src/lib/publicationProviders.ts`
- `src/lib/publicationRules.ts`
- `src/pages/Studio.tsx`
- `src/pages/Approvals.tsx`
- `src/pages/Settings.tsx`
- `src/components/studio/BriefCard.tsx`
- `supabase/migrations/20260514000001_assisted_publication_layer.sql`
- testes de publicação

Mensagem sugerida:

`feat: add safe assisted publication workflow`

## Commit 5 - Staging, QA e artifacts

Arquivos sugeridos:

- `docs/RELATORIO_GO_NO_GO_ORION_STAGING.md`
- `docs/artifacts/`
- `.gitignore`

Mensagem sugerida:

`docs: add staging validation and go no-go evidence`

## Commit 6 - Env example

Arquivos sugeridos:

- `.env.example`

Mensagem sugerida:

`chore: document safe staging env flags`

## Observação

O workspace está grande e contém muitas mudanças antigas. Antes de commitar, revisar `git diff --stat` e evitar commit amplo misturando produto, banco, docs e arquivos locais.
