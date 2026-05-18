# Roteiro Demo Staging/Mock - Orion

Data: 18/05/2026

Objetivo: demonstrar o Orion como Central Operacional de Marketing com IA em ambiente staging/mock, sem publicacao real.

## Aviso inicial obrigatório

- Esta demo roda em staging.
- Publicações são demonstrativas e ficam registradas apenas dentro do Orion.
- Meta/Instagram real está desativado.
- Nenhuma publicação é enviada para canal real.

## Roteiro

1. Abrir `/central` com `owner_company_a`.
   - Mostrar a Central Orion como sala de comando.
   - Destacar prioridade número 1, impacto financeiro, aprovações e publicações.
   - Apontar o aviso "Ambiente staging/mock".

2. Explicar o loop.
   - Detectar: Orion encontra prioridade/risco.
   - Decidir: recomendação vira ação.
   - Executar: ação vira aprovação/publicação mock.
   - Aprender: logs e memória operacional registram o evento.

3. Abrir `/studio`.
   - Selecionar o brief mock de remarketing.
   - Clicar em "Preparar publicação".
   - Reforçar o aviso: "Publicação demonstrativa em staging/mock".
   - Criar rascunho mock e aprovação.

4. Abrir `/approvals`.
   - Mostrar a aprovação humana como barreira de governança.
   - Reforçar que aprovar libera apenas o fluxo interno do Orion.
   - Aprovar a publicação.

5. Voltar para `/central`.
   - Mostrar a publicação na seção "Publicações e Agendamentos".
   - Agendar em modo mock.
   - Confirmar badge "Dado mock - nao real" e aviso de publicação demonstrativa.

6. Abrir `/chat?prompt=Quais%20publica%C3%A7%C3%B5es%20est%C3%A3o%20aguardando%20aprova%C3%A7%C3%A3o%3F&context=central`.
   - Mostrar que o chat abre com contexto da Central.
   - Perguntar sobre publicações/agendamentos.
   - Reforçar que o chat deve explicar usando dados mock/demo quando aplicável.

7. Mostrar governança por perfil.
   - `client_viewer_company_a`: não deve conseguir criar/agendar/cancelar publicação.
   - `owner_company_b`: não vê dados da Company A.
   - `agency_admin`: vê apenas contas vinculadas.

## Fechamento

Mensagem recomendada:

"O Orion já prepara a próxima ação, pede aprovação e registra o aprendizado. Nesta demo, a publicação é mock: validamos operação e governança sem risco de publicar nada em canal real."

## Não demonstrar nesta fase

- Publicação real.
- Graph API.
- Meta sandbox.
- Paid ads.
- Produção.
