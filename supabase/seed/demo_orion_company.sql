-- =============================================================================
-- DEMO SEED — Clínica Aurora (Orion Dashboard)
-- =============================================================================
-- Propósito: popular conta de demonstração com dados realistas para apresentação.
-- Escopo: APENAS o usuário demo de desenvolvimento (dev auth bypass).
-- Segurança: NÃO executar em produção. NÃO usar como fallback para usuários reais.
--
-- Pré-requisito: VITE_DEV_AUTH_BYPASS=true no .env local.
-- Demo user ID: 00000000-0000-4000-8000-000000000001
-- Demo user email: demo@orion.local
--
-- Execução:
--   supabase db reset --local        (recria o banco e roda todos os seeds)
--   ou diretamente:
--   psql $DATABASE_URL -f supabase/seed/demo_orion_company.sql
--
-- Idempotente: usa ON CONFLICT DO NOTHING ou INSERT ... IF NOT EXISTS.
-- =============================================================================

DO $$
DECLARE
  v_user_id        uuid := '00000000-0000-4000-8000-000000000001';
  v_company_id     uuid := '00000000-0000-4000-8000-000000000010';
  v_campaign_1_id  uuid := '00000000-0000-4000-8000-000000000021';
  v_campaign_2_id  uuid := '00000000-0000-4000-8000-000000000022';
  v_campaign_3_id  uuid := '00000000-0000-4000-8000-000000000023';
  v_task_1_id      uuid := '00000000-0000-4000-8000-000000000031';
  v_task_2_id      uuid := '00000000-0000-4000-8000-000000000032';
  v_task_3_id      uuid := '00000000-0000-4000-8000-000000000033';
  v_task_4_id      uuid := '00000000-0000-4000-8000-000000000034';
  v_task_5_id      uuid := '00000000-0000-4000-8000-000000000035';
  v_approval_1_id  uuid := '00000000-0000-4000-8000-000000000041';
  v_approval_2_id  uuid := '00000000-0000-4000-8000-000000000042';
  v_approval_3_id  uuid := '00000000-0000-4000-8000-000000000043';
  v_opp_1_id       uuid := '00000000-0000-4000-8000-000000000051';
  v_opp_2_id       uuid := '00000000-0000-4000-8000-000000000052';
  v_opp_3_id       uuid := '00000000-0000-4000-8000-000000000053';
  v_mem_1_id       uuid := '00000000-0000-4000-8000-000000000061';
  v_mem_2_id       uuid := '00000000-0000-4000-8000-000000000062';
  v_mem_3_id       uuid := '00000000-0000-4000-8000-000000000063';
  v_mem_4_id       uuid := '00000000-0000-4000-8000-000000000064';
BEGIN

-- =============================================================================
-- 1. COMPANY DNA — Clínica Aurora
-- =============================================================================

INSERT INTO public.company_dna (
  id,
  user_id,
  company_name,
  dna_data,
  onboarding_completed,
  created_at,
  updated_at
)
VALUES (
  v_company_id,
  v_user_id,
  'Clínica Aurora',
  jsonb_build_object(
    'identity', jsonb_build_object(
      'companyName',        'Clínica Aurora',
      'businessModel',      'B2C — clínica de estética e dermatologia premium com agendamentos presenciais e protocolos personalizados',
      'product',            'Avaliação estética + protocolos premium: bioestimulador de colágeno, harmonização facial, peeling, laser, botox, skincare guiado',
      'avgTicket',          'R$ 1.200',
      'competitiveEdge',    'Atendimento consultivo e personalizado, protocolos naturais sem exagero, resultado elegante e duradouro',
      'marketPositioning',  'Clínica premium de estética natural, focada em resultados elegantes e atendimento de alta qualidade em Salvador',
      'toneOfVoice',        'Sofisticado, acolhedor, claro, seguro e elegante. Evitar promessas exageradas e linguagem apelativa',
      'values',             'Naturalidade, segurança, sofisticação, ética profissional, resultado consistente',
      'brandPromises',      'Resultados naturais e duradouros com protocolos personalizados e atendimento consultivo',
      'lovedExample',       'Clínica Lavid, Clínica Renata Bueno — estética premium com comunicação sofisticada',
      'vetoedExample',      'Comunicação com antes/depois agressivo, promessas de resultado garantido, apelo sensacionalista'
    ),
    'marketPositioning', jsonb_build_object(
      'category',           'Clínica estética e dermatologia premium',
      'market_tier',        'Premium',
      'direct_competitors', 'Clínicas estéticas premium de Salvador, dermatologistas particulares, clínicas de harmonização facial',
      'indirect_competitors','Spas urbanos, médicos estetas autônomos, procedimentos de baixo custo',
      'unique_advantage',   'Combinação de expertise médica, comunicação sofisticada e atendimento consultivo personalizado',
      'market_trends',      'Crescimento de harmonização natural, skincare preventivo, rejuvenescimento masculino, fidelização por protocolos'
    ),
    'audience', jsonb_build_object(
      'idealCustomer',      'Mulheres de 28 a 55 anos, classe média alta e alta, moradoras de Salvador, interessadas em rejuvenescimento natural, skincare avançado e autoestima',
      'secondarySegments',  'Homens de 32 a 55 anos buscando tratamentos discretos — queda de cabelo, faciais, melhora de aparência sem exagero',
      'objections',         'Preço alto, medo de resultado artificial, desconfiança de resultados rápidos, experiências ruins anteriores',
      'triggers',           'Evento social importante, insatisfação com envelhecimento, recomendação de amiga, antes/depois natural convincente',
      'channels',           'Instagram, WhatsApp, indicação, Google, tráfego pago Meta Ads',
      'motivations',        'Autoestima, aparência natural, cuidado preventivo, sofisticação, segurança no procedimento',
      'language',           'Sofisticado mas acessível, sem jargões excessivos, depoimentos reais, antes/depois naturais'
    ),
    'metrics', jsonb_build_object(
      'monthly_revenue',    '85000',
      'budget_monthly',     '8000',
      'avg_ticket',         '1200',
      'avg_margin_pct',     '42',
      'cac_current',        '380',
      'ltv_estimated',      '4800',
      'monthly_traffic',    '3200',
      'conversion_rate_pct','3.2',
      'avg_roas',           '5.2',
      'perceived_bottlenecks','Conversão no WhatsApp, reativação de leads parados, dependência de indicação',
      'current_tools',      'Meta Ads, WhatsApp Business, Google Meu Negócio, sistema de agendamento próprio'
    ),
    'goalsConstraints', jsonb_build_object(
      'primary_goal',       'growth',
      'target_metric',      'Aumentar agendamentos de avaliação qualificada em 30% em 90 dias',
      'channels',           'Meta Ads, WhatsApp, Instagram orgânico, Google',
      'seasonalities',      'Alta: dezembro (festas), junho/julho (inverno), setembro/outubro (carnaval antecipado)',
      'operational_limits', 'Equipe enxuta, aprovação humana obrigatória para campanhas sensíveis, limite de R$ 8.000/mês em mídia paga',
      'forbidden',          'Promessa de resultado garantido, antes/depois agressivo, linguagem apelativa ou sensacionalista, cirurgias',
      'history',            'Campanhas com linguagem educativa geraram leads mais qualificados. Criativos com estética natural performaram melhor. WhatsApp é principal gargalo na conversão.'
    ),
    'teamRoles', jsonb_build_object(
      'structure',          'Dona da clínica, coordenadora comercial, social media, gestora de tráfego, recepcionista/WhatsApp, especialistas',
      'marketing_owner',    'Gestora de tráfego + social media',
      'commercial_owner',   'Coordenadora comercial',
      'decision_maker',     'Dona da clínica'
    ),
    'salesProduct', jsonb_build_object(
      'main_offer',         'Avaliação estética personalizada + protocolo facial premium',
      'sales_process',      'Lead entra por Instagram/WhatsApp/indicação → Secretária qualifica → Agenda avaliação → Especialista atende e recomenda protocolo',
      'avg_sales_cycle',    '3 a 7 dias desde o primeiro contato até agendamento',
      'location',           'Salvador, BA'
    )
  ),
  true,
  now() - interval '14 days',
  now() - interval '2 days'
)
ON CONFLICT (id) DO UPDATE SET
  company_name = EXCLUDED.company_name,
  dna_data = EXCLUDED.dna_data,
  onboarding_completed = EXCLUDED.onboarding_completed,
  updated_at = now();

-- =============================================================================
-- 2. USER ROLE — owner
-- =============================================================================

INSERT INTO public.user_roles (user_id, role, company_dna_id)
VALUES (v_user_id, 'owner', v_company_id)
ON CONFLICT (user_id) DO UPDATE SET
  role = EXCLUDED.role,
  company_dna_id = EXCLUDED.company_dna_id;

-- =============================================================================
-- 3. CAMPANHAS
-- =============================================================================

-- Campanha 1: Avaliação Facial Premium — Meta Ads (ativa)
INSERT INTO public.campaigns (
  id, user_id, name, platform, status, objective,
  budget_daily, budget_total,
  metrics_snapshot,
  start_date, created_at, updated_at
)
VALUES (
  v_campaign_1_id, v_user_id,
  'Avaliação Facial Premium',
  'meta_ads', 'active',
  'Gerar avaliações qualificadas via tráfego pago',
  320, 3200,
  jsonb_build_object(
    'spend',        3200,
    'revenue',      18400,
    'roas',         5.75,
    'leads',        96,
    'cpa',          33.33,
    'ctr',          1.8,
    'cpc',          1.42,
    'conversions',  96,
    'impressions',  225000,
    'clicks',       4050
  ),
  (current_date - interval '30 days')::date,
  now() - interval '30 days',
  now() - interval '1 day'
)
ON CONFLICT (id) DO UPDATE SET
  metrics_snapshot = EXCLUDED.metrics_snapshot,
  updated_at = now();

-- Campanha 2: Reativação de Leads Antigos (ativa)
INSERT INTO public.campaigns (
  id, user_id, name, platform, status, objective,
  budget_daily, budget_total,
  metrics_snapshot,
  start_date, created_at, updated_at
)
VALUES (
  v_campaign_2_id, v_user_id,
  'Reativação de Leads Antigos — WhatsApp CRM',
  'whatsapp', 'active',
  'Recuperar leads parados há mais de 30 dias',
  0, 0,
  jsonb_build_object(
    'opportunities',   42,
    'revenue_potential', 38000,
    'priority',        'alta',
    'leads_without_followup', 18,
    'avg_days_idle',   11
  ),
  (current_date - interval '7 days')::date,
  now() - interval '7 days',
  now() - interval '12 hours'
)
ON CONFLICT (id) DO UPDATE SET
  metrics_snapshot = EXCLUDED.metrics_snapshot,
  updated_at = now();

-- Campanha 3: Skincare de Verão (planejada)
INSERT INTO public.campaigns (
  id, user_id, name, platform, status, objective,
  budget_daily, budget_total,
  metrics_snapshot,
  start_date, created_at, updated_at
)
VALUES (
  v_campaign_3_id, v_user_id,
  'Skincare de Verão — Instagram + Meta Ads',
  'instagram', 'planned',
  'Conteúdo educativo e geração de agendamentos via Instagram',
  150, 1500,
  jsonb_build_object(
    'status', 'planned',
    'expected_leads', 40,
    'expected_roas',  4.5
  ),
  (current_date + interval '7 days')::date,
  now() - interval '3 days',
  now() - interval '3 days'
)
ON CONFLICT (id) DO UPDATE SET
  metrics_snapshot = EXCLUDED.metrics_snapshot,
  updated_at = now();

-- =============================================================================
-- 4. TAREFAS
-- =============================================================================

INSERT INTO public.tasks (id, user_id, company_dna_id, title, description, priority, status, due_date, created_by_ai, created_at, updated_at)
VALUES
  (
    v_task_1_id, v_user_id, v_company_id,
    'Revisar criativos da campanha Avaliação Facial Premium',
    'Os criativos da campanha ativa estão com CTR abaixo do esperado. Revisar copy, imagem e CTA. Testar variante com depoimento.',
    'high', 'todo',
    (current_date + interval '2 days')::date,
    true, now() - interval '1 day', now() - interval '1 day'
  ),
  (
    v_task_2_id, v_user_id, v_company_id,
    'Responder 18 leads sem follow-up',
    'Há 18 leads qualificados sem retorno há mais de 7 dias. Coordenadora comercial deve entrar em contato via WhatsApp com sequência de reativação.',
    'high', 'todo',
    current_date::date,
    true, now() - interval '2 days', now() - interval '2 days'
  ),
  (
    v_task_3_id, v_user_id, v_company_id,
    'Aprovar calendário de conteúdo da próxima semana',
    '5 posts prontos aguardando aprovação final antes de agendar no Instagram. Revisar tom de voz e call-to-action.',
    'medium', 'todo',
    (current_date + interval '3 days')::date,
    false, now() - interval '3 days', now() - interval '3 days'
  ),
  (
    v_task_4_id, v_user_id, v_company_id,
    'Validar copy da campanha de reativação WhatsApp',
    'A copy da mensagem de reativação de leads precisa de revisão antes do disparo. Verificar conformidade ética e tom de voz.',
    'medium', 'in_progress',
    (current_date + interval '1 day')::date,
    true, now() - interval '4 days', now() - interval '1 day'
  ),
  (
    v_task_5_id, v_user_id, v_company_id,
    'Atualizar fotos dos protocolos premium',
    'As imagens dos protocolos de rejuvenescimento e bioestimulador no site e Instagram estão desatualizadas. Agendar sessão fotográfica.',
    'low', 'todo',
    (current_date + interval '10 days')::date,
    false, now() - interval '5 days', now() - interval '5 days'
  )
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  updated_at = now();

-- =============================================================================
-- 5. APROVAÇÕES
-- =============================================================================

INSERT INTO public.approvals (
  id, user_id, company_id, title, description, category,
  approval_type, impact, level, reasoning, status,
  created_at, updated_at
)
VALUES
  (
    v_approval_1_id, v_user_id, v_company_id,
    'Criativo — Campanha Avaliação Facial Premium (variante B)',
    'Nova variante de criativo com depoimento real de paciente. Copy ajustada para destacar naturalidade dos resultados.',
    'creative',
    'creative_approval',
    'CTR atual de 1.8%. Variante com depoimento estimada em +40% de CTR com base em testes anteriores.',
    'standard',
    'Criativo gerado pelo Orion com base em análise de performance da campanha ativa. Requer aprovação antes de subir para Meta Ads.',
    'pending',
    now() - interval '12 hours', now() - interval '12 hours'
  ),
  (
    v_approval_2_id, v_user_id, v_company_id,
    'Copy de reativação WhatsApp — sequência de 3 mensagens',
    'Sequência de mensagens para leads sem follow-up há mais de 7 dias. Tom consultivo, sem pressão de vendas.',
    'campaign',
    'content_approval',
    'Pipeline de R$ 22.000 em leads sem retorno. Estimativa de recuperação de 25-35% com sequência adequada.',
    'standard',
    'Sequência criada pela IA baseada no histórico de conversão da clínica. Revisão humana obrigatória antes do disparo.',
    'pending',
    now() - interval '1 day', now() - interval '1 day'
  ),
  (
    v_approval_3_id, v_user_id, v_company_id,
    'Orçamento adicional R$ 1.000 — Campanha Avaliação Facial Premium',
    'Campanha com ROAS 5.75x acima da meta (4x). Solicitação de verba adicional de R$ 1.000 para escalar resultados nos próximos 7 dias.',
    'budget',
    'budget_approval',
    'ROAS atual 5.75x vs meta 4x. Cada R$ 1.000 investido gera aproximadamente R$ 5.750 em receita atribuída.',
    'high',
    'IA detectou performance acima da meta. Escalar neste momento tem alta probabilidade de manter eficiência. Janela de oportunidade: 7 dias.',
    'pending',
    now() - interval '6 hours', now() - interval '6 hours'
  )
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  updated_at = now();

-- =============================================================================
-- 6. CRM OPPORTUNITIES
-- =============================================================================

INSERT INTO public.crm_opportunities (
  id, user_id, title, opportunity_type,
  expected_revenue, expected_margin,
  status, rationale, recommended_channel,
  created_at, updated_at
)
VALUES
  (
    v_opp_1_id, v_user_id,
    'Leads quentes sem follow-up (18 contatos)',
    'reactivation',
    22000, 40,
    'open',
    '18 leads qualificados que demonstraram interesse mas não agendaram. Maioria parada há 8-14 dias. Alta probabilidade de conversão com abordagem consultiva.',
    'whatsapp',
    now() - interval '3 days', now() - interval '3 days'
  ),
  (
    v_opp_2_id, v_user_id,
    'Clientes com protocolo encerrado — recompra provável',
    'upsell',
    28000, 42,
    'open',
    'Clientes que completaram protocolos há 60-90 dias. Janela ideal de retorno para manutenção e novos procedimentos.',
    'whatsapp',
    now() - interval '5 days', now() - interval '5 days'
  ),
  (
    v_opp_3_id, v_user_id,
    'Segmento masculino — rejuvenescimento discreto',
    'new_segment',
    18000, 38,
    'qualified',
    'Leads masculinos qualificados que demonstraram interesse em tratamentos faciais. Segmento em crescimento, pouco atendido localmente.',
    'instagram',
    now() - interval '7 days', now() - interval '2 days'
  )
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  updated_at = now();

-- =============================================================================
-- 7. BUSINESS MEMORY (Company Brain)
-- =============================================================================

INSERT INTO public.business_memory (
  id, user_id, company_dna_id, title, content, summary,
  memory_type, source, importance,
  tags, occurred_at, created_at, updated_at
)
VALUES
  (
    v_mem_1_id, v_user_id, v_company_id,
    'Criativos com linguagem educativa convertem mais',
    'Campanha Avaliação Facial Premium testou 3 variantes: (A) promocional com desconto, (B) depoimento real, (C) conteúdo educativo sobre bioestimulador. A variante C gerou CTR 2.4% vs média de 1.8% e leads 35% mais qualificados que converteram 22% melhor no WhatsApp.',
    'Campanhas com linguagem educativa sobre procedimentos geraram leads mais qualificados e maior taxa de conversão.',
    'campaign_learning', 'campaign_analysis', 90,
    ARRAY['criativos', 'conteudo-educativo', 'ctr', 'conversao'],
    now() - interval '21 days',
    now() - interval '21 days', now() - interval '21 days'
  ),
  (
    v_mem_2_id, v_user_id, v_company_id,
    'WhatsApp é principal gargalo de conversão',
    'Análise do funil de vendas identificou que 67% dos leads qualificados não agendam avaliação por demora no retorno do WhatsApp (>24h). Taxa de conversão cai 58% quando resposta demora mais de 48h. Gargalo: capacidade de atendimento da recepcionista.',
    'Leads sem resposta após 48h tiveram queda forte de conversão. WhatsApp é o principal gargalo.',
    'funnel_analysis', 'crm_analysis', 95,
    ARRAY['whatsapp', 'conversao', 'funil', 'gargalo', 'resposta-rapida'],
    now() - interval '14 days',
    now() - interval '14 days', now() - interval '14 days'
  ),
  (
    v_mem_3_id, v_user_id, v_company_id,
    'Estética natural performa melhor que estética transformação',
    'A/B test de criativos no Instagram: fotos com resultado discreto e natural vs transformações dramáticas. O primeiro grupo gerou engajamento 3x maior e leads 45% mais qualificados. Público alvo valoriza naturalidade e autenticidade.',
    'Criativos com estética natural performaram melhor que criativos com transformações exageradas.',
    'creative_learning', 'studio_analysis', 85,
    ARRAY['criativos', 'estetica-natural', 'instagram', 'engajamento'],
    now() - interval '30 days',
    now() - interval '30 days', now() - interval '30 days'
  ),
  (
    v_mem_4_id, v_user_id, v_company_id,
    'Campanha de reativação anterior recuperou 28% dos leads',
    'Em março de 2026, sequência de 3 mensagens WhatsApp para leads parados há 30+ dias recuperou 28% para agendamento. Mensagem mais efetiva foi a 2ª (valor educativo + depoimento), não a oferta direta. Tempo ideal de envio: 10h-12h ou 18h-20h.',
    'Sequência de reativação WhatsApp com 3 mensagens recuperou 28% de leads inativos em campanha anterior.',
    'campaign_result', 'whatsapp_campaign', 88,
    ARRAY['reativacao', 'whatsapp', 'leads-inativos', 'conversao'],
    now() - interval '60 days',
    now() - interval '60 days', now() - interval '60 days'
  )
ON CONFLICT (id) DO UPDATE SET
  content = EXCLUDED.content,
  summary = EXCLUDED.summary,
  updated_at = now();

-- =============================================================================
-- LOG
-- =============================================================================

RAISE NOTICE '✅ Demo seed executado com sucesso!';
RAISE NOTICE '   Company: Clínica Aurora (user_id: 00000000-0000-4000-8000-000000000001)';
RAISE NOTICE '   Campanhas: 3 (2 ativas, 1 planejada)';
RAISE NOTICE '   Tarefas: 5';
RAISE NOTICE '   Aprovações: 3 (pendentes)';
RAISE NOTICE '   Oportunidades CRM: 3';
RAISE NOTICE '   Memórias Company Brain: 4';
RAISE NOTICE '   ATENÇÃO: Dados exclusivos para conta demo. Não usar em produção.';

END $$;
