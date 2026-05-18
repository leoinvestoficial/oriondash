# Relatorio Unico - Orion Staging, QA e Go/No-Go

Data: 18/05/2026

Este e o relatorio unico oficial da fase atual. Evidencias brutas ficam em `docs/artifacts/`. Nao foram recriados docs antigos separados.

## 1. Resumo executivo

Estado validado:

- Staging Supabase linkado em `fszzzufduriltihmyoxu`.
- Nenhum `db push` foi executado em producao `byaoftiefwolmcikdjoh`.
- Migrations aplicadas em staging e sincronizadas ate `20260517000002`.
- Schema critico validado: `action_orchestrations`, `operational_memory`, `marketing_finance_targets`, `agency_accounts`, `publication_policies`, `publication_jobs`, `publication_logs`, `executive_reports`.
- Types Supabase regenerados a partir do staging.
- `.env.staging` local criado e ignorado pelo Git.
- Frontend em modo staging confirmado contra `https://fszzzufduriltihmyoxu.supabase.co`.
- Seed minimo criado para Company A, Company B, agencia, usuarios, publicacao mock, approval, orquestracao, metas e memoria operacional.
- Auth de staging validado para todos os usuarios de teste.
- RLS operacional/publicacao validada com os cenarios criticos.
- QA por rota/API validado contra staging.
- Quality gate final passou: typecheck, build, lint e testes.
- Smoke visual automatizado em navegador passou 18/18 cenarios.
- Textos de mock/demo foram reforcados em Central Orion, Studio, Approvals, Settings e DataSourceBadge.
- Roteiro de demonstracao staging/mock foi criado.
- Plano de commits foi criado.

Decisao atual:

- **GO** para piloto interno local/mock.
- **GO** para piloto em staging/mock.
- **GO** para demo staging/mock.
- **GO CONDICIONAL** para cliente piloto sem publicacao real, desde que seja demonstracao guiada/controlada em staging/mock e sem Graph API.
- **NO-GO** para sandbox Meta ate configurar conta/permissoes de teste.
- **NO-GO** para producao.
- **NO-GO** para publicacao real.

## 2. Workspace e seguranca

Estado observado:

- Workspace continua sujo, com muitas alteracoes antigas/modificadas e muitos arquivos untracked.
- `.env` aparece como deletado no Git, mas existe no disco e esta ignorado por `.gitignore`.
- `.env.staging` existe no disco, esta ignorado por `.gitignore` e nao deve ser commitado.
- `.env.example` usa placeholders e nao contem chave real.
- `VITE_ENABLE_META_PUBLICATION_PROVIDER` permanece `false` no staging.
- `supabase/config.toml` ainda mostra `project_id = "byaoftiefwolmcikdjoh"`, mas o link ativo da CLI esta em `supabase/.temp/project-ref = fszzzufduriltihmyoxu`.

Evidencias:

- `docs/artifacts/workspace-git-status-final.txt`
- `docs/artifacts/workspace-env-validation-final.txt`
- `docs/artifacts/staging-linked-project-ref.txt`

Recomendacao de commit:

- Commitar separadamente migrations corrigidas.
- Commitar separadamente types gerados.
- Commitar separadamente relatorio/artifacts.
- Nao commitar `.env`, `.env.staging`, chaves, tokens, service role ou secrets Meta.

## 3. Staging e migrations

Comandos executados contra staging:

```bash
supabase link --project-ref fszzzufduriltihmyoxu
supabase migration list
supabase db push --dry-run
supabase db push
```

Correcoes necessarias para staging limpo:

- `20260504000001_governance_rbac.sql`: normalizacao do conflito legado de `role_definitions` UUID vs RBAC text.
- `20260508000002_org_members_schema_fix.sql`: backfill legado condicionado a existencia de `invited_email` e `invite_status`.
- `20260512000004_analyst_tick_cron.sql`: troca de delimitador interno para `$cron$`.
- `20260513000003_operational_rls_and_reports_hardening.sql`: remocao da dependencia em `invite_status`.
- `20260517000001_staging_rls_recursion_fix.sql`: helpers SECURITY DEFINER para remover recursao RLS entre `company_dna`, membros e tabelas operacionais.
- `20260517000002_client_viewer_role.sql`: papel `client_viewer` view-only para validar permissao real.

Resultado:

- Migrations aplicadas em staging.
- Migration list final sincronizado ate `20260517000002`.
- Producao nao foi alterada.

Evidencias principais:

- `docs/artifacts/staging-db-push-dry-run.txt`
- `docs/artifacts/staging-db-push.txt`
- `docs/artifacts/staging-db-push-dry-run-rls-recursion-fix.txt`
- `docs/artifacts/staging-db-push-rls-recursion-fix.txt`
- `docs/artifacts/staging-db-push-dry-run-client-viewer-role.txt`
- `docs/artifacts/staging-db-push-client-viewer-role.txt`
- `docs/artifacts/staging-migration-list-final.txt`

## 4. Schema e types

Validacao de schema:

- Todas as tabelas criticas retornaram `to_regclass` nao nulo.
- Evidencia: `docs/artifacts/staging-schema-validation.txt`.

Types:

- Executado `supabase gen types typescript --linked > src/integrations/supabase/types.ts`.
- Validado que os types incluem as tabelas operacionais e de publicacao.
- Evidencia: `docs/artifacts/staging-types-validation.txt`.

Status:

- Schema de staging: **verde**.
- Types Supabase: **verdes**.

## 5. Seed, Auth e dados minimos

Seed criado em:

- `docs/artifacts/staging-seed.sql`

Dados criados:

- Company A, Company B e agencia.
- Usuarios de teste: owner, manager, client viewer, owner da Company B e agency admin.
- Relacionamento `agency_accounts`.
- Company DNA para empresas.
- Publication policy.
- Publication job mock.
- Approval vinculada.
- Action orchestration.
- Marketing finance target.
- Operational memory inicial.

Problema encontrado e corrigido:

- O Auth retornava HTTP 500 `Database error querying schema` para usuarios inseridos manualmente.
- Causa operacional: campos de token do Auth estavam nulos.
- Correcao: seed atualizado para gravar strings vazias em `confirmation_token`, `recovery_token`, `email_change` e `email_change_token_new`.
- Depois da correcao, login passou para todos os usuarios de teste.

Evidencias:

- `docs/artifacts/staging-seed-results.md`
- `docs/artifacts/staging-auth-token-fields-after-seed-coalesce.txt`
- `docs/artifacts/qa-staging-results.md`

## 6. RLS operacional e publicacao

Cenarios validados:

- Company B nao le publication jobs da Company A.
- Client viewer nao cria publication job.
- Client viewer nao agenda/cancela publication job.
- Owner/admin altera publication policies.
- Logs nao vazam entre empresas.
- Agency admin ve apenas publication jobs de conta vinculada.
- Owner cria action orchestration.
- Manager opera action orchestration.
- Viewer nao altera marketing finance targets.

Resultado:

- 9/9 cenarios passaram.

Evidencia:

- `docs/artifacts/rls-validation-results.md`

Status:

- RLS critica para staging/mock: **verde**.

## 7. QA funcional em staging

Validacao executada por rota/API contra o dev server em modo staging:

- `/`: HTTP 200.
- `/central`: HTTP 200.
- `/dashboard`: HTTP 200.
- `/studio`: HTTP 200.
- `/approvals`: HTTP 200.
- `/chat?prompt=Teste&context=central`: HTTP 200.

Auth:

- Login passou para todos os usuarios seedados.

Visibilidade de dados:

- Owner Company A enxerga dados da propria empresa.
- Owner Company B nao enxerga publication jobs da Company A.
- Agency admin enxerga dados da conta vinculada.

Publicacao mock:

- Publication job mock existe com `status=awaiting_approval`, `data_origin=mock`, canal `instagram`, tipo `organic_post` e `requires_approval=true`.
- `publication_logs` e `operational_memory` foram validados via API.

Complemento visual:

- O smoke visual clique-a-clique foi executado depois desta validacao por rota/API.
- Resultado visual consolidado na secao 10.

Evidencia:

- `docs/artifacts/qa-staging-results.md`

## 8. Meta provider

Flag staging:

- `VITE_ENABLE_META_PUBLICATION_PROVIDER=false`.

Validado:

- Dev server em staging carregou a flag como `false`.
- Provider mock permanece como default.
- `data_origin` mock nao e confundido com real.
- Nao ha chamada Graph API real no provider atual.
- Provider Meta preparado valida `ad_integrations`, bloqueia `paid_ad` e retorna erro claro enquanto agendamento/publicacao real estiver inativo.

Nao executado:

- Sandbox Meta.
- Graph API.
- Publicacao real.

Evidencias:

- `docs/artifacts/qa-staging-publication-provider-loaded.txt`
- `docs/artifacts/meta-provider-static-validation.txt`

## 9. Quality gate final

Comandos executados:

```bash
npx tsc --noEmit
npm run build
npm run lint
npm run test -- --run
```

Resultado:

- TypeScript: passou.
- Build: passou.
- Lint: passou com warnings, sem erros.
- Testes: 5 arquivos, 13 testes, todos passaram.

Warnings conhecidos:

- Browserslist/caniuse-lite desatualizado.
- Chunk principal acima de 500 kB.
- 18 warnings de lint, principalmente Fast Refresh e dependencias de `useEffect` legadas.

Evidencias:

- `docs/artifacts/quality-tsc-demo-final.txt`
- `docs/artifacts/quality-build-demo-final.txt`
- `docs/artifacts/quality-lint-demo-final.txt`
- `docs/artifacts/quality-test-demo-final.txt`

Status:

- Quality gate final: **verde**.

## 10. Smoke visual e preparacao da demo

Smoke visual executado com navegador Chromium via Playwright isolado fora do projeto.

Cenarios validados:

- Owner Company A fez login.
- `/central` abriu com prioridade, financeiro, aprovacoes, publicacoes e avisos staging/mock.
- `/studio` abriu e exibiu aviso de publicacao demonstrativa.
- Studio preparou publicacao mock e aprovacao.
- `/approvals` abriu e exibiu aviso de publicacao demonstrativa.
- Owner aprovou publicacao.
- Central permitiu agendar publicacao mock.
- Chat contextual abriu com prompt de publicacoes/agendamentos.
- Client viewer nao viu controles operacionais de agendamento/cancelamento.
- Owner Company B nao viu dados da Company A.
- Agency admin acessou Central e nao viu dados da Company B.

Resultado:

- 18/18 cenarios passaram.
- Nenhum erro de console capturado.
- Screenshots foram gerados.

Evidencias:

- `docs/artifacts/smoke-visual-staging-results.md`
- `docs/artifacts/smoke-visual-staging-run.txt`
- `docs/artifacts/smoke-screenshots/`

Textos reforcados:

- Central Orion: aviso global de ambiente staging/mock e Meta/Instagram desativado.
- Publicacoes e Agendamentos: aviso "Publicação demonstrativa - não enviada para canal real".
- Studio: dialogo informa que o rascunho e mock e nao publica de verdade.
- Approvals: aprovacao de publicacao informa que libera apenas o fluxo interno do Orion.
- Settings/Politicas: reforco de que politicas controlam somente demonstracao em staging/mock.
- DataSourceBadge: `mock` agora aparece como "Dado mock - nao real".

Roteiro e commit plan:

- `docs/artifacts/ROTEIRO_DEMO_STAGING_MOCK_ORION.md`
- `docs/artifacts/commit-plan-orion.md`

## 11. Go/No-Go formal

### Piloto interno local/mock

Status: **GO**

Motivo: build/test/lint/typecheck passam e publicacao mock e segura.

### Piloto em staging/mock

Status: **GO**

Motivo: staging existe, migrations foram aplicadas, schema/types estao verdes, Auth funciona, RLS critica passou e QA por rota/API passou.

Condicao: manter `VITE_ENABLE_META_PUBLICATION_PROVIDER=false` e nao usar Graph API.

### Demo staging/mock

Status: **GO**

Motivo: smoke visual passou 18/18, avisos mock/demo estao visiveis e quality gate final passou.

### Cliente piloto sem publicacao real

Status: **GO CONDICIONAL**

Condicoes:

- Usar o roteiro de demo e manter a demonstracao guiada.
- Usar apenas staging/mock.
- Mostrar explicitamente que publicacoes sao mock/demo.
- Nao conectar Meta real.
- Nao prometer publicacao real.

### Sandbox Meta

Status: **NO-GO**

Motivo: conta sandbox, permissoes, tokens e fluxo Graph API ainda nao foram configurados/validados.

### Producao

Status: **NO-GO**

Motivo: migrations nao foram aplicadas em producao, nao houve backup/dry-run de producao, RLS de producao nao foi testada e nao houve smoke pos-producao.

### Publicacao real

Status: **NO-GO**

Motivo: Graph API real nao esta validada, sandbox Meta nao existe, publicacao paga permanece bloqueada e nao ha autorizacao para autonomia real.

## 12. Proximos passos recomendados

1. Usar o roteiro `docs/artifacts/ROTEIRO_DEMO_STAGING_MOCK_ORION.md` na demo.
2. Manter `VITE_ENABLE_META_PUBLICATION_PROVIDER=false`.
3. Preparar sandbox Meta/Instagram separada de qualquer conta real de cliente.
4. Criar plano de producao com backup, dry-run e janela controlada.
5. Limpar workspace e dividir commits por responsabilidade usando `docs/artifacts/commit-plan-orion.md`.

## 13. Decisao final da rodada

Executado:

- Link do staging.
- Dry-run e aplicacao de migrations em staging.
- Correcoes de migrations necessarias.
- Regeneracao de types.
- `.env.staging` local.
- Seed minimo.
- Correcao do Auth dos usuarios seedados.
- Validacao RLS.
- QA por rota/API.
- Validacao de seguranca do provider mock/Meta inativo.
- Quality gate final.
- Smoke visual 18/18.
- Reforco de textos mock/demo.
- Roteiro de demo.
- Plano de commits.
- Atualizacao deste relatorio unico.

Nao executado:

- `db push` em producao.
- Publicacao real.
- Graph API.
- Sandbox Meta.
- Publicacao real.

Status final:

- **GO** para demo staging/mock.
- **GO** para staging/mock.
- **GO condicional** para cliente piloto sem publicacao real.
- **NO-GO** para producao e publicacao real.
