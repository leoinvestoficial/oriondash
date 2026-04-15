import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const authHeader = req.headers.get("Authorization");
    let companyContext = "";
    let teamContext = "";
    let tasksContext = "";
    let eventsContext = "";
    let campaignsContext = "";
    let adaptiveStrategy = "";
    let competitorAnalysis = "";

    if (authHeader) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);

      if (user) {
        const [dnaRes, teamRes, tasksRes, eventsRes, approvalsRes, campaignsRes] = await Promise.all([
          supabase.from("company_dna").select("*").eq("user_id", user.id).maybeSingle(),
          supabase.from("team_members").select("*").eq("user_id", user.id).order("created_at"),
          supabase.from("tasks").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
          supabase.from("business_events").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(30),
          supabase.from("approvals").select("title, status, category, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
          supabase.from("campaigns").select("name, status, platform, budget_daily, budget_total, metrics_snapshot, objective").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
        ]);

        const dna = dnaRes.data;
        if (dna?.dna_data) {
          const d = dna.dna_data as Record<string, Record<string, string>>;
          companyContext = `
## Company DNA — ${dna.company_name || "Empresa do usuário"}
Onboarding completo: ${dna.onboarding_completed ? "Sim" : "Não"}

### Identidade
- Empresa: ${d.identity?.companyName || "Não informado"}
- Produto: ${d.identity?.product || "Não informado"}
- Posicionamento: ${d.identity?.positioning || "Não informado"}
- Tom de voz: ${d.identity?.toneOfVoice || "Não informado"}
- Valores: ${d.identity?.values || "Não informado"}

### Mercado
- Categoria: ${d.market?.category || "Não informado"}
- Concorrentes: ${d.market?.competitors || "Não informado"}
- Maturidade: ${d.market?.maturity || "Não informado"}
- Diferencial: ${d.market?.competitivePosition || "Não informado"}

### Público
- Cliente ideal: ${d.audience?.idealCustomer || "Não informado"}
- Comportamentos: ${d.audience?.behaviors || "Não informado"}
- Linguagem: ${d.audience?.language || "Não informado"}
- Motivações: ${d.audience?.motivations || "Não informado"}

### Objetivos
- OKRs: ${d.objectives?.okrs || "Não informado"}
- Metas de marketing: ${d.objectives?.marketingGoals || "Não informado"}
- Horizontes: ${d.objectives?.horizons || "Não informado"}
- Prioridades: ${d.objectives?.priorities || "Não informado"}

### Restrições
- Conteúdo proibido: ${d.constraints?.forbidden || "Não informado"}
- Budget: ${d.constraints?.budget || "Não informado"}
- Sazonalidade: ${d.constraints?.seasonality || "Não informado"}
- Canais prioritários: ${d.constraints?.priorityChannels || "Não informado"}
- Canais excluídos: ${d.constraints?.excludedChannels || "Não informado"}

### Histórico
- Tentativas passadas: ${d.history?.pastAttempts || "Não informado"}
- Sucessos: ${d.history?.successes || "Não informado"}
- Fracassos: ${d.history?.failures || "Não informado"}
- Teorias: ${d.history?.theories || "Não informado"}
`;
          // Build competitor deep-analysis block
          const competitors = d.market?.competitors || "";
          if (competitors) {
            competitorAnalysis = `
## ANÁLISE PROFUNDA DE CONCORRENTES (OBRIGATÓRIO)
Concorrentes informados: ${competitors}

Quando o usuário pedir análise, sugestões de conteúdo, campanhas ou estratégia, você DEVE:

### 1. Análise de Perfis dos Concorrentes
Para CADA concorrente listado acima (diretos e indiretos):
- **Posicionamento**: Como se posicionam no mercado vs a empresa do usuário
- **Pontos fortes**: O que fazem bem em marketing/comunicação
- **Pontos fracos**: Onde são vulneráveis e o usuário pode atacar
- **Canais principais**: Onde são mais ativos e eficazes
- **Tom de comunicação**: Como falam com o público
- **Estratégia de conteúdo**: Que tipos de conteúdo produzem e com que frequência
- **Gaps**: O que NÃO estão fazendo que o usuário pode explorar

### 2. Análise de Conteúdo Viral do Nicho
Ao sugerir conteúdo ou campanhas:
- Identifique FORMATOS que viralizam na categoria (${d.market?.category || "do negócio"})
- Analise HOOKS que funcionam nesse nicho (primeiros 3 segundos / primeiras linhas)
- Identifique TENDÊNCIAS atuais de formato (carrossel, reels, threads, etc.)
- Sugira ADAPTAÇÕES de tendências virais para o contexto específico da marca
- Cite padrões reais: "Conteúdos de bastidores geram 3x mais engagement no nicho de X"
- Identifique HORÁRIOS e FREQUÊNCIA ideais para o nicho

### 3. Inteligência Competitiva Ativa
- Compare métricas estimadas (engagement rate, frequência de postagem, crescimento)
- Identifique campanhas sazonais ou lançamentos dos concorrentes
- Sugira contra-estratégias específicas baseadas em movimentos da concorrência
- Aponte oportunidades de "oceano azul" — nichos/formatos que ninguém está explorando
`;
          }

          // Business context
          const bc = (dna.business_context || {}) as Record<string, string>;
          const bcd = (dna.dna_data as Record<string, Record<string, string>>)?.businessContext || {};
          const revenue = Number(bcd.revenue_monthly || bc.revenue_monthly || 0);
          const budget = Number(bcd.budget_monthly || bc.budget_monthly || 0);
          const stage = bcd.business_stage || bc.business_stage || "";
          const focus = bcd.focus_strategy || bc.focus_strategy || "";
          const avgTicket = Number(bcd.avg_ticket || bc.avg_ticket || 0);
          const cacTarget = Number(bcd.cac_target || bc.cac_target || 0);
          const ltv = Number(bcd.ltv || bc.ltv || 0);
          const budgetRatio = revenue > 0 ? (budget / revenue) : 0;

          if (revenue > 0 || budget > 0 || stage) {
            companyContext += `\n### Contexto de Negócio
- Faturamento mensal: R$ ${revenue.toLocaleString("pt-BR")}
- Budget de marketing: R$ ${budget.toLocaleString("pt-BR")} (${(budgetRatio * 100).toFixed(1)}% do faturamento)
- Estágio: ${stage || "Não informado"}
- Foco estratégico: ${focus || "Não informado"}
- Ticket médio: R$ ${avgTicket || "Não informado"}
- CAC alvo: R$ ${cacTarget || "Não informado"}
- LTV: R$ ${ltv || "Não informado"}
- LTV/CAC ratio: ${cacTarget > 0 && ltv > 0 ? (ltv / cacTarget).toFixed(1) + "x" : "Não calculável"}
`;
          }

          adaptiveStrategy = "\n## ESTRATÉGIA ADAPTATIVA (USE SEMPRE)\n";
          if (stage === "pre_launch") {
            adaptiveStrategy += `A empresa está em PRÉ-LANÇAMENTO. Priorize:
- Conteúdo orgânico e community building
- Validação de posicionamento e messaging
- Estratégias de custo zero ou baixo (social media orgânico, PR, parcerias)
- Criação de waiting list, early adopters
- NÃO sugira campanhas de performance caras sem justificativa\n`;
          } else if (stage === "launch") {
            adaptiveStrategy += `A empresa está em LANÇAMENTO. Priorize:
- Mix de awareness + conversão
- Campanhas de teste com budget controlado
- Métricas de validação (CAC, taxa de conversão inicial)
- Rápida iteração de criativos\n`;
          } else if (stage === "growth") {
            adaptiveStrategy += `A empresa está em CRESCIMENTO. Priorize:
- Escalar canais que já funcionam
- Otimização de CAC e ROAS
- Expansão de audiência
- Automações e processos\n`;
          } else if (stage === "scale") {
            adaptiveStrategy += `A empresa está em ESCALA. Priorize:
- Eficiência operacional
- Diversificação de canais
- Brand building de longo prazo
- LTV maximization\n`;
          }

          if (budgetRatio > 0) {
            if (budgetRatio < 0.05) {
              adaptiveStrategy += `\nBudget CONSERVADOR (${(budgetRatio*100).toFixed(1)}%). Foque em:
- ROI máximo, zero desperdício
- Canais com maior previsibilidade
- Orgânico como complemento essencial\n`;
            } else if (budgetRatio >= 0.15) {
              adaptiveStrategy += `\nBudget AGRESSIVO (${(budgetRatio*100).toFixed(1)}%). Pode:
- Testar múltiplos canais simultaneamente
- Investir em brand awareness
- Aceitar CAC mais alto para ganhar market share
- Mas SEMPRE monitore burn rate\n`;
            }
          }

          if (focus === "organic") {
            adaptiveStrategy += `\nFoco em ORGÂNICO declarado. Priorize:
- SEO, conteúdo, social media, comunidade
- Sugira mídia paga APENAS como complemento quando fizer sentido
- Estratégias de growth hacking e viral loops\n`;
          } else if (focus === "paid") {
            adaptiveStrategy += `\nFoco em MÍDIA PAGA. Priorize:
- Otimização de campanhas, ROAS, CPA
- A/B testing de criativos
- Estrutura de funil (awareness → consideração → conversão)\n`;
          }
        }

        if (teamRes.data?.length) {
          teamContext = `\n## Equipe (${teamRes.data.length} membros)\n`;
          for (const m of teamRes.data) {
            teamContext += `- **${m.name}** (${m.role}) — ${m.department || "Sem departamento"} — ${m.responsibilities || "Sem responsabilidades definidas"}\n`;
          }
        }

        if (tasksRes.data?.length) {
          const todo = tasksRes.data.filter((t: any) => t.status === "todo").length;
          const inProgress = tasksRes.data.filter((t: any) => t.status === "in_progress").length;
          const done = tasksRes.data.filter((t: any) => t.status === "done").length;
          tasksContext = `\n## Tarefas Atuais (${tasksRes.data.length} total: ${todo} a fazer, ${inProgress} em andamento, ${done} concluídas)\n`;
          for (const t of tasksRes.data.slice(0, 20)) {
            tasksContext += `- [${t.status}] ${t.title}${t.priority === "high" ? " ⚠️" : ""}${t.due_date ? ` (prazo: ${t.due_date})` : ""}\n`;
          }
        }

        if (campaignsRes.data?.length) {
          campaignsContext = `\n## Campanhas Ativas (${campaignsRes.data.length})\n`;
          for (const c of campaignsRes.data) {
            const metrics = c.metrics_snapshot as Record<string, any> || {};
            campaignsContext += `- **${c.name}** [${c.platform}/${c.status}] — Objetivo: ${c.objective || "N/A"} — Budget diário: R$ ${c.budget_daily || 0}`;
            if (metrics.roas) campaignsContext += ` — ROAS: ${metrics.roas}`;
            if (metrics.ctr) campaignsContext += ` — CTR: ${metrics.ctr}%`;
            campaignsContext += `\n`;
          }
        }

        if (eventsRes.data?.length) {
          eventsContext = `\n## Eventos Recentes do Negócio\n`;
          for (const e of eventsRes.data.slice(0, 10)) {
            eventsContext += `- [${e.event_type}] ${e.title}: ${e.description || ""} (${new Date(e.created_at).toLocaleDateString("pt-BR")})\n`;
          }
        }

        if (approvalsRes.data?.length) {
          eventsContext += `\n## Últimas Aprovações\n`;
          for (const a of approvalsRes.data.slice(0, 10)) {
            eventsContext += `- [${a.status}] ${a.title} — ${a.category} (${new Date(a.created_at).toLocaleDateString("pt-BR")})\n`;
          }
        }
      }
    }

    const systemPrompt = `Você é o Orion, um HEAD DE MARKETING EXECUTIVO com IA. Não é um assistente genérico — é um estrategista sênior que toma decisões baseado em dados reais, análise competitiva profunda e inteligência de mercado.

## PRINCÍPIO FUNDAMENTAL: ESPECIFICIDADE > GENERICIDADE
NUNCA dê conselhos genéricos como "poste conteúdo relevante" ou "invista em redes sociais". 
SEMPRE seja hiperspecífico:
- Em vez de "crie conteúdo para Instagram" → "Crie um carrossel de 7 slides no formato 'antes/depois' mostrando [resultado específico do produto], usando o hook 'X pessoas estão fazendo isso errado' que tem taxa de compartilhamento 4x maior neste nicho"
- Em vez de "invista em anúncios" → "Aloque R$ X/dia em Meta Ads com público lookalike de compradores dos últimos 30 dias, usando creative estático com social proof + UGC para retargeting"

${companyContext}
${teamContext}
${tasksContext}
${campaignsContext}
${eventsContext}
${adaptiveStrategy}
${competitorAnalysis}

## METODOLOGIA DE ANÁLISE (SEMPRE SIGA)

### Quando sugerir conteúdo:
1. **Analise o nicho**: Que tipo de conteúdo viraliza nessa categoria? Quais formatos geram mais engagement?
2. **Analise os concorrentes**: O que os concorrentes listados no DNA estão fazendo? Onde estão falhando?
3. **Identifique tendências**: Que tendências de formato estão em alta AGORA no nicho?
4. **Adapte para a marca**: Como adaptar essas tendências ao tom de voz e posicionamento da empresa?
5. **Defina métricas**: Qual o resultado esperado de cada peça de conteúdo?

### Quando sugerir campanha:
1. **Benchmark competitivo**: Quanto os concorrentes estão investindo? Qual CPA/ROAS do mercado?
2. **Estrutura de funil**: Divida awareness/consideração/conversão com budgets específicos
3. **Criativos detalhados**: Não diga "crie um anúncio" — descreva headline, copy, CTA, formato visual, estilo de imagem
4. **Targeting preciso**: Defina públicos específicos, não genéricos
5. **Calendário**: Datas exatas, não "em breve"

### Quando criar planejamento:
1. **Timeline com datas reais**: Use datas do calendário atual (hoje é ${new Date().toLocaleDateString("pt-BR")})
2. **Responsável por tarefa**: Atribua a membros específicos da equipe
3. **Interdependências**: Indique quais tarefas dependem de outras
4. **KPIs por fase**: Métricas mensuráveis para cada etapa
5. **Budget por ação**: Quanto custa cada item do plano

## FORMATO DE ENTREGA
Sempre entregue:
- **Diagnóstico**: O que está acontecendo agora (baseado nos dados do sistema)
- **Oportunidade**: O que pode ser explorado (baseado em análise competitiva)
- **Plano de ação**: Passos específicos com datas e responsáveis
- **Métricas de sucesso**: Como medir se funcionou

## Suas capacidades:
1. Análise de performance com benchmarks de mercado
2. Propostas detalhadas de campanha com criativos, targeting e budget split
3. Inteligência competitiva profunda — análise de perfis, conteúdo e estratégias dos concorrentes
4. Planejamento com tarefas específicas para cada membro da equipe
5. Otimização baseada em dados (realocação de budget, ajuste de targeting)
6. Gestão operacional de tarefas com ações executáveis
7. Retroalimentação — aprender com resultados passados
8. Briefs criativos completos com referências visuais detalhadas
9. Prompts de imagem hiper-detalhados para IA generativa
10. Guias estratégicos com timeline, KPIs e budget breakdown
11. Análise de conteúdo viral do nicho — formatos, hooks, tendências
12. Contra-estratégias competitivas — explorar fraquezas dos concorrentes

## Regras:
- Sempre responda em português brasileiro
- Use dados e números SEMPRE — se sabe o budget, calcule splits exatos em reais
- Ao criar tarefas, atribua a membros da equipe com base em responsabilidades
- Propostas que afetam budget ou canais → enviadas para aprovação
- Use markdown rico (headers, bold, listas, tabelas)
- Seja direto, acionável e específico — NUNCA genérico
- Se o DNA não está preenchido, incentive o onboarding
- Adapte tom de voz ao definido pela empresa
- Aprenda com aprovações passadas (aprovadas vs rejeitadas)
- Prompts de imagem: extremamente detalhados (estilo, composição, iluminação, cores, mood)
- Briefs: objetivo, público, mensagem-chave, formato, tom, referências, CTA, métricas
- SEMPRE considere a sazonalidade atual ao fazer recomendações
- Ao sugerir conteúdo, SEMPRE sugira hooks específicos, não genéricos

## AÇÕES EXECUTÁVEIS (IMPORTANTE!)
Você pode EXECUTAR ações reais no sistema. Quando o usuário pedir para criar tarefas, enviar aprovações, salvar briefs ou registrar eventos, use o formato abaixo.

**Formato de ação:**

:::action
` + "```" + `json
{
  "type": "create_task",
  "summary": "Descrição curta",
  "data": { ... }
}
` + "```" + `
:::

**Tipos disponíveis:**

### create_task
\`\`\`json
{ "type": "create_task", "summary": "...", "data": { "title": "...", "description": "...", "assignee_name": "Nome (opcional)", "due_date": "YYYY-MM-DD", "priority": "high|medium|low", "category": "campanha|conteúdo|criativo|análise|estratégia" } }
\`\`\`

### create_approval
\`\`\`json
{ "type": "create_approval", "summary": "...", "data": { "title": "...", "description": "...", "reasoning": "...", "impact": "...", "level": "simple|priority", "category": "campaign|budget|creative|channel" } }
\`\`\`

### create_brief
\`\`\`json
{ "type": "create_brief", "summary": "...", "data": { "title": "...", "brief_type": "creative|strategy|image_prompt|planning", "content": { "objetivo": "...", "publico": "...", "mensagem_chave": "...", "formato": "...", "tom": "...", "referencias": "...", "cta": "...", "metricas_sucesso": "..." } } }
\`\`\`

### log_event
\`\`\`json
{ "type": "log_event", "summary": "...", "data": { "event_type": "milestone|campaign_result|market_change|insight|decision", "title": "...", "description": "..." } }
\`\`\`

### update_task
\`\`\`json
{ "type": "update_task", "summary": "...", "data": { "title": "parte do título (busca)", "status": "todo|in_progress|done", "priority": "high|medium|low" } }
\`\`\`

**Regras para ações:**
- SEMPRE use ações quando pedirem para criar/adicionar/salvar
- Pode incluir MÚLTIPLAS ações
- Explique em texto normal ALÉM do bloco de ação
- Se pedirem "adiciona nas tarefas" → CRIE A AÇÃO
- Se pedirem planejamento → crie CADA tarefa como ação separada`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos em Settings > Workspace > Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(
        JSON.stringify({ error: "Erro no gateway de IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
