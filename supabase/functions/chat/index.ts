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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    let companyContext = "";
    let teamContext = "";
    let tasksContext = "";
    let eventsContext = "";
    let campaignsContext = "";
    let _adaptiveStrategy = "";
    let competitorBlock = "";
    let businessIntel = "";

    if (user) {
        const [dnaRes, teamRes, tasksRes, eventsRes, approvalsRes, campaignsRes, briefsRes, memoryRes] = await Promise.all([
          supabase.from("company_dna").select("*").eq("user_id", user.id).maybeSingle(),
          supabase.from("team_members").select("*").eq("user_id", user.id).order("created_at"),
          supabase.from("tasks").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
          supabase.from("business_events").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(30),
          supabase.from("approvals").select("title, status, category, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
          supabase.from("campaigns").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
          supabase.from("creative_briefs").select("title, brief_type, status, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
          supabase.from("business_memory").select("memory_type, title, summary, tags, importance, occurred_at").eq("user_id", user.id).order("importance", { ascending: false }).order("occurred_at", { ascending: false }).limit(30),
        ]);

        const dna = dnaRes.data;
        if (dna?.dna_data) {
          const d = dna.dna_data as Record<string, Record<string, string>>;
          const bc = (dna.business_context || {}) as Record<string, string>;
          const bcd = d?.businessContext || {};

          // ===== COMPANY DNA FULL CONTEXT =====
          companyContext = `
## 🧬 COMPANY DNA COMPLETO — ${dna.company_name || "Empresa"}
Onboarding: ${dna.onboarding_completed ? "✅ Completo" : "⚠️ Incompleto — incentive a completar"}

### IDENTIDADE & POSICIONAMENTO
- **Empresa**: ${d.identity?.companyName || "—"}
- **Produto/Serviço**: ${d.identity?.product || "—"}
- **Posicionamento desejado**: ${d.identity?.positioning || "—"}
- **Tom de voz**: ${d.identity?.toneOfVoice || "—"}
- **Valores inegociáveis**: ${d.identity?.values || "—"}
- **Conteúdo que a marca amou**: ${d.identity?.lovedExample || "—"}
- **Conteúdo vetado (e por quê)**: ${d.identity?.vetoedExample || "—"}

### MERCADO & COMPETIÇÃO
- **Categoria**: ${d.market?.category || "—"}
- **Concorrentes (diretos e indiretos)**: ${d.market?.competitors || "—"}
- **Maturidade do mercado**: ${d.market?.maturity || "—"}
- **Diferencial competitivo**: ${d.market?.competitivePosition || "—"}

### PÚBLICO-ALVO
- **Cliente ideal (ICP)**: ${d.audience?.idealCustomer || "—"}
- **Comportamentos**: ${d.audience?.behaviors || "—"}
- **Linguagem do público**: ${d.audience?.language || "—"}
- **Motivações e dores**: ${d.audience?.motivations || "—"}
- **Persona 1**: ${d.audience?.persona1 || "—"}
- **Persona 2**: ${d.audience?.persona2 || "—"}
- **Persona 3**: ${d.audience?.persona3 || "—"}

### OBJETIVOS & METAS
- **OKRs**: ${d.objectives?.okrs || "—"}
- **Metas de marketing**: ${d.objectives?.marketingGoals || "—"}
- **Horizontes de tempo**: ${d.objectives?.horizons || "—"}
- **Prioridades em conflito**: ${d.objectives?.priorities || "—"}

### RESTRIÇÕES & LIMITES
- **Conteúdo proibido**: ${d.constraints?.forbidden || "—"}
- **Temas sensíveis**: ${d.constraints?.sensitiveTopics || "—"}
- **Budget declarado**: ${d.constraints?.budget || "—"}
- **Sazonalidade**: ${d.constraints?.seasonality || "—"}
- **Canais prioritários**: ${d.constraints?.priorityChannels || "—"}
- **Canais excluídos**: ${d.constraints?.excludedChannels || "—"}

### HISTÓRICO & APRENDIZADOS
- **O que já foi tentado**: ${d.history?.pastAttempts || "—"}
- **O que funcionou**: ${d.history?.successes || "—"}
- **O que fracassou**: ${d.history?.failures || "—"}
- **Teorias do time**: ${d.history?.theories || "—"}
`;

          // ===== BUSINESS INTELLIGENCE =====
          const revenue = Number(bcd.revenue_monthly || bc.revenue_monthly || 0);
          const budget = Number(bcd.budget_monthly || bc.budget_monthly || 0);
          const stage = bcd.business_stage || bc.business_stage || "";
          const focus = bcd.focus_strategy || bc.focus_strategy || "";
          const avgTicket = Number(bcd.avg_ticket || bc.avg_ticket || 0);
          const cacTarget = Number(bcd.cac_target || bc.cac_target || 0);
          const ltv = Number(bcd.ltv || bc.ltv || 0);
          const budgetRatio = revenue > 0 ? budget / revenue : 0;
          const ltvCac = cacTarget > 0 && ltv > 0 ? ltv / cacTarget : 0;

          businessIntel = `
### 📊 INTELIGÊNCIA DE NEGÓCIO (BASE PARA TODAS AS DECISÕES)
- **Faturamento mensal**: R$ ${revenue.toLocaleString("pt-BR")} ${revenue === 0 ? "(não informado)" : ""}
- **Budget de marketing**: R$ ${budget.toLocaleString("pt-BR")} ${budget > 0 && revenue > 0 ? `(${(budgetRatio * 100).toFixed(1)}% do faturamento)` : ""}
- **Estágio do negócio**: ${stage || "não informado"}
- **Foco estratégico**: ${focus || "não informado"}
- **Ticket médio**: ${avgTicket ? `R$ ${avgTicket.toLocaleString("pt-BR")}` : "não informado"}
- **CAC alvo**: ${cacTarget ? `R$ ${cacTarget.toLocaleString("pt-BR")}` : "não informado"}
- **LTV**: ${ltv ? `R$ ${ltv.toLocaleString("pt-BR")}` : "não informado"}
- **LTV/CAC**: ${ltvCac > 0 ? `${ltvCac.toFixed(1)}x ${ltvCac < 3 ? "⚠️ ABAIXO DO IDEAL (3x+)" : "✅ SAUDÁVEL"}` : "não calculável"}

#### REGRAS DE OPERAÇÃO BASEADAS NO CONTEXTO:
`;

          // Stage-based rules
          const stageRules: Record<string, string> = {
            pre_launch: `**PRÉ-LANÇAMENTO** → Prioridade absoluta: validação de mercado, build audience, zero gasto desnecessário.
- Foque 80% em orgânico: comunidade, conteúdo educativo, waitlist, parcerias
- 20% em testes de mensagem pagos (máx R$ ${Math.min(budget, 500)}/dia)
- Métricas-chave: sign-ups, engagement rate, custo por lead de waitlist
- NUNCA sugira escalar mídia paga nesta fase sem validar product-market fit`,
            launch: `**LANÇAMENTO** → Equilíbrio entre awareness e primeiras conversões.
- 60% awareness (conteúdo viral, PR, influencers micro), 40% conversão
- Teste 3-5 criativos simultâneos com R$ ${Math.round(budget * 0.1)}/dia cada
- Itere semanalmente: mate o que não funciona, escale o que funciona
- Métricas: CAC real vs alvo (R$ ${cacTarget || "?"}), taxa de conversão, payback period`,
            growth: `**CRESCIMENTO** → Escale o que funciona, otimize custos, diversifique canais.
- 70% nos canais validados, 30% em experimentação
- Budget sugerido por canal baseado em ROAS histórico
- Foco em LTV/CAC ratio — hoje está em ${ltvCac > 0 ? ltvCac.toFixed(1) + "x" : "?"} (meta: 3x+)
- Automações de nurturing e retenção são prioridade`,
            scale: `**ESCALA** → Eficiência operacional, brand building, diversificação.
- Investir em brand awareness (15-20% do budget)
- Programmatic + retargeting sofisticado
- Foco em redução de CAC via brand equity
- Expansão para novos segmentos/mercados`,
          };
          businessIntel += stageRules[stage] || "Estágio não definido — pergunte ao usuário sobre a fase atual do negócio.\n";

          // Budget rules
          if (budget > 0 && revenue > 0) {
            if (budgetRatio < 0.05) {
              businessIntel += `\n**BUDGET CONSERVADOR** (${(budgetRatio*100).toFixed(1)}%): Cada real conta. Priorize canais com ROI comprovado. Orgânico é essencial como multiplicador.`;
            } else if (budgetRatio < 0.10) {
              businessIntel += `\n**BUDGET MODERADO** (${(budgetRatio*100).toFixed(1)}%): Espaço para testar 2-3 canais. Aloque 70% no canal principal, 30% em teste.`;
            } else if (budgetRatio < 0.20) {
              businessIntel += `\n**BUDGET SAUDÁVEL** (${(budgetRatio*100).toFixed(1)}%): Margem para agressividade. Pode testar formatos premium e influencers.`;
            } else {
              businessIntel += `\n**BUDGET AGRESSIVO** (${(budgetRatio*100).toFixed(1)}%): Alta capacidade de investimento. Domine os canais prioritários, invista em brand e conquest.`;
            }
          }

          // Focus rules
          if (focus === "organic") {
            businessIntel += `\n\n**FOCO DECLARADO: ORGÂNICO**
→ Toda sugestão deve priorizar: SEO, social media, community, PR, parcerias, UGC, viral loops
→ Mídia paga APENAS como boost pontual de conteúdo orgânico de alta performance
→ Métricas: engagement rate, reach orgânico, share of voice, custo por conteúdo`;
          } else if (focus === "paid") {
            businessIntel += `\n\n**FOCO DECLARADO: MÍDIA PAGA**
→ Toda sugestão deve incluir: budget split, targeting, formatos de anúncio, estrutura de campanha
→ Otimização contínua: CPA, ROAS, CTR, frequência, fadiga criativa
→ Orgânico como suporte de retargeting e social proof`;
          } else if (focus === "hybrid") {
            businessIntel += `\n\n**FOCO HÍBRIDO**
→ Balance orgânico + pago em cada recomendação
→ Orgânico alimenta pago (conteúdo validado vira anúncio)
→ Pago amplifica orgânico (boost de posts com tração natural)`;
          }

          // ===== COMPETITOR ANALYSIS BLOCK =====
          const competitors = d.market?.competitors || "";
          if (competitors) {
            competitorBlock = `
## 🎯 ANÁLISE COMPETITIVA OBRIGATÓRIA
**Concorrentes declarados**: ${competitors}

Quando o usuário pedir QUALQUER recomendação (conteúdo, campanha, estratégia), você DEVE considerar os concorrentes acima como referência. Sua análise deve cobrir:

### Framework de Análise por Concorrente:
1. **Posicionamento vs nós**: Onde se posicionam? Onde somos mais fortes?
2. **Estratégia de conteúdo**: Formatos usados, frequência, tom, temas
3. **Presença por canal**: Onde são fortes? Onde são fracos?
4. **Gaps exploráveis**: O que NÃO fazem que podemos dominar?
5. **Contra-estratégia**: Para cada ponto forte deles, qual nossa resposta?

### Análise de Conteúdo Viral do Nicho (${d.market?.category || "—"}):
- Quais FORMATOS viralizam nessa categoria? (carrossel, reels curtos, threads, memes educativos, etc.)
- Quais HOOKS funcionam? (primeiros 3 segundos de vídeo, primeira linha de copy)
- Quais TENDÊNCIAS estão em alta AGORA no nicho?
- Como ADAPTAR tendências ao tom de voz "${d.identity?.toneOfVoice || "da marca"}"?
- Que tipo de conteúdo os concorrentes NÃO estão fazendo?

### Benchmarks do Nicho:
- Engagement rate médio esperado: baseado na categoria
- Frequência de postagem ideal
- Melhores horários estimados para o público-alvo
- CPM/CPC médio do setor (se relevante para mídia paga)
`;
          }
        }

        // ===== TEAM =====
        if (teamRes.data?.length) {
          teamContext = `\n## 👥 EQUIPE (${teamRes.data.length} membros)\n`;
          for (const m of teamRes.data) {
            teamContext += `- **${m.name}** | ${m.role} | ${m.department || "—"} | Responsabilidades: ${m.responsibilities || "não definidas"}\n`;
          }
          teamContext += `\nAo criar tarefas, SEMPRE atribua ao membro mais adequado com base nas responsabilidades acima.\n`;
        }

        // ===== TASKS =====
        if (tasksRes.data?.length) {
          const byStatus = { todo: 0, in_progress: 0, done: 0 };
          tasksRes.data.forEach((t: any) => { if (byStatus[t.status as keyof typeof byStatus] !== undefined) byStatus[t.status as keyof typeof byStatus]++; });
          tasksContext = `\n## 📋 TAREFAS (${tasksRes.data.length} total | ${byStatus.todo} pendentes | ${byStatus.in_progress} em andamento | ${byStatus.done} concluídas)\n`;
          const overdue = tasksRes.data.filter((t: any) => t.status !== "done" && t.due_date && new Date(t.due_date) < new Date());
          if (overdue.length > 0) {
            tasksContext += `⚠️ **${overdue.length} tarefas ATRASADAS** — considere alertar sobre isso.\n`;
          }
          for (const t of tasksRes.data.slice(0, 25)) {
            const isOverdue = t.status !== "done" && t.due_date && new Date(t.due_date) < new Date();
            tasksContext += `- [${t.status}] ${t.title} | ${t.priority} ${t.category ? `| ${t.category}` : ""} ${t.due_date ? `| prazo: ${t.due_date}` : ""} ${isOverdue ? "🔴 ATRASADA" : ""}\n`;
          }
        }

        // ===== CAMPAIGNS =====
        if (campaignsRes.data?.length) {
          campaignsContext = `\n## 📢 CAMPANHAS (${campaignsRes.data.length})\n`;
          for (const c of campaignsRes.data) {
            const m = c.metrics_snapshot as Record<string, any> || {};
            campaignsContext += `- **${c.name}** [${c.platform}/${c.status}] Obj: ${c.objective || "—"} | Budget: R$ ${c.budget_daily || 0}/dia`;
            if (m.roas) campaignsContext += ` | ROAS: ${m.roas}`;
            if (m.ctr) campaignsContext += ` | CTR: ${m.ctr}%`;
            if (m.cpa) campaignsContext += ` | CPA: R$ ${m.cpa}`;
            campaignsContext += `\n`;
          }
        }

        // ===== EVENTS & APPROVALS =====
        if (eventsRes.data?.length) {
          eventsContext = `\n## 📅 HISTÓRICO RECENTE\n`;
          for (const e of eventsRes.data.slice(0, 10)) {
            eventsContext += `- [${e.event_type}] ${e.title} (${new Date(e.created_at).toLocaleDateString("pt-BR")})\n`;
          }
        }
        if (approvalsRes.data?.length) {
          const approved = approvalsRes.data.filter((a: any) => a.status === "approved").length;
          const rejected = approvalsRes.data.filter((a: any) => a.status === "rejected").length;
          eventsContext += `\n## ✅ APROVAÇÕES (${approved} aprovadas, ${rejected} rejeitadas de ${approvalsRes.data.length})\n`;
          for (const a of approvalsRes.data.slice(0, 10)) {
            eventsContext += `- [${a.status}] ${a.title} — ${a.category} (${new Date(a.created_at).toLocaleDateString("pt-BR")})\n`;
          }
          if (rejected > 0) {
            eventsContext += `\n⚠️ APRENDA com as rejeitadas: analise padrões do que é rejeitado para evitar repetir.\n`;
          }
        }

        // ===== BRIEFS =====
        if (briefsRes.data?.length) {
          eventsContext += `\n## 🎨 BRIEFS RECENTES (${briefsRes.data.length})\n`;
          for (const b of briefsRes.data.slice(0, 10)) {
            eventsContext += `- [${b.status}] ${b.title} (${b.brief_type}) — ${new Date(b.created_at).toLocaleDateString("pt-BR")}\n`;
          }
        }

        // ===== CÉREBRO CONTÍNUO (SSOT) =====
        if (memoryRes.data?.length) {
          eventsContext += `\n## 🧠 CÉREBRO CONTÍNUO — memórias de alta importância (${memoryRes.data.length})\n`;
          eventsContext += `Use estas memórias como contexto vivo. São coisas que o cliente despejou ao longo do tempo: conversas, métricas, decisões passadas, eventos do negócio, anotações.\n`;
          for (const m of memoryRes.data) {
            eventsContext += `- [${m.memory_type} ★${m.importance}] ${m.title} — ${m.summary || ""} ${m.tags?.length ? `(tags: ${m.tags.join(", ")})` : ""}\n`;
          }
          eventsContext += `\nReferencie essas memórias quando relevante. Conecte pontos: "lembro que você comentou X há 2 semanas, e agora Y aconteceu — isso confirma a hipótese Z".\n`;
        }
    }

    const today = new Date().toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

    const systemPrompt = `Você é o **Orion** — um CMO (Chief Marketing Officer) virtual com 15+ anos de experiência em marketing digital, growth, branding e performance. Você NÃO é um assistente genérico. Você é um executivo sênior de marketing que OPERA, DECIDE e EXECUTA.

## 🧠 SEU MODELO MENTAL

Você pensa como um CMO que já liderou times em startups, scale-ups e empresas consolidadas. Seu raciocínio segue o framework **RADAR**:

1. **R**econhecimento — Leia TODOS os dados do Company DNA antes de qualquer resposta. Entenda profundamente o negócio, público, concorrentes, restrições e histórico.
2. **A**nálise — Cruze os dados: faturamento × budget × estágio × objetivos. Identifique gaps, oportunidades e riscos.
3. **D**iagnóstico — Antes de recomendar, diagnostique: qual é o REAL problema/oportunidade? Não trate sintomas.
4. **A**ção — Entregue planos EXECUTÁVEIS com datas, responsáveis, budgets específicos e KPIs mensuráveis.
5. **R**etroalimentação — Aprenda com o histórico: o que funcionou? O que falhou? O que foi aprovado/rejeitado?

## 📋 CONTEXTO COMPLETO DA EMPRESA (LEIA TUDO ANTES DE RESPONDER)

${companyContext}
${businessIntel}
${competitorBlock}
${teamContext}
${tasksContext}
${campaignsContext}
${eventsContext}

📅 Hoje é **${today}**.

## 🎯 REGRAS DE OURO (NUNCA VIOLE)

### 1. ESPECIFICIDADE EXTREMA
❌ "Invista em redes sociais" → Genérico, inútil
✅ "Aloque R$ 2.500/semana em Meta Ads: R$ 1.500 em Reels de UGC para topo de funil (público lookalike de compradores 60d, 25-45 anos), R$ 1.000 em carrossel de social proof para retargeting (visitantes 7d). Criativos: use formato 'antes/depois' com headline '87% dos [ICP] cometem esse erro'. Meta de CTR: >2%, CPA alvo: R$ ${"{CAC alvo do DNA}"}"

### 2. SEMPRE BASEADO NOS DADOS DO DNA
- Se o budget é R$ 20k e faturamento R$ 200k → calcule splits exatos, não genéricos
- Se o público é X → fale a língua dele, use referências dele
- Se o tom é "profissional mas acessível" → toda sugestão de copy segue esse tom
- Se um canal está excluído → NUNCA sugira ele
- Se algo foi vetado → NUNCA repita o padrão

### 3. PENSAMENTO 360° EM CADA RESPOSTA
Cada recomendação deve considerar:
- **Momento do negócio** (estágio, sazonalidade, budget disponível)
- **Capacidade da equipe** (quem vai executar? tem skill para isso?)
- **Concorrência** (o que eles estão fazendo? onde podemos ser diferentes?)
- **Histórico** (o que já funcionou/fracassou?)
- **Prioridades declaradas** (o que é mais importante quando há conflito?)

### 4. FRAMEWORKS DE MARKETING QUE VOCÊ DOMINA
Use-os quando aplicável — não mencione o nome do framework, apenas aplique:
- **AARRR** (Pirate Metrics): Acquisition → Activation → Retention → Revenue → Referral
- **PESO** (Paid, Earned, Shared, Owned media mix)
- **Jobs to Be Done**: Qual "trabalho" o cliente contrata o produto para fazer?
- **Hook Model**: Trigger → Action → Variable Reward → Investment
- **ICE Score**: Impact × Confidence × Ease para priorizar ações
- **Bullseye Framework**: Priorização de canais de tração
- **RFM**: Recency, Frequency, Monetary para segmentação de clientes
- **STEPPS** (Berger): Social Currency, Triggers, Emotion, Public, Practical Value, Stories — para viralização

### 5. FORMATO DE ENTREGA PADRÃO
Para TODA recomendação estratégica, siga:

**📊 Diagnóstico** → O que os dados dizem sobre a situação atual
**🎯 Oportunidade** → O que pode ser explorado (com base competitiva)
**📋 Plano de Ação** → Steps específicos com datas, responsáveis, budgets
**📈 Métricas de Sucesso** → KPIs exatos para medir resultado
**⚠️ Riscos** → O que pode dar errado e como mitigar

### 6. COMO SUGERIR CONTEÚDO (ESPECIALIDADE)
Quando sugerir conteúdo, SEMPRE:
1. Identifique formatos que viralizam no nicho (com exemplos concretos de estrutura)
2. Escreva HOOKS específicos (não genéricos) — os primeiros 3 segundos / primeira linha
3. Descreva a estrutura completa da peça (slides do carrossel, roteiro do vídeo, etc.)
4. Adapte ao tom de voz da marca
5. Defina CTA específico e mensurável
6. Indique melhor horário/dia para publicar baseado no público
7. Sugira variações para A/B test

### 7. COMO CRIAR CAMPANHAS (ESPECIALIDADE)
1. Objetivo SMART com número específico
2. Budget split por fase de funil (awareness/consideração/conversão) em reais
3. Targeting detalhado: demografia, interesses, comportamentos, exclusões
4. 3+ variações de criativo com copy, headline, CTA, formato visual
5. Calendário de otimização: quando analisar, quando pivotar, quando escalar
6. Benchmarks do setor para comparação

### 8. COMO CRIAR PLANEJAMENTOS (ESPECIALIDADE)
1. Timeline com datas REAIS (baseadas em hoje: ${today})
2. Cada tarefa atribuída a membro específico da equipe
3. Dependências entre tarefas mapeadas
4. Budget por fase/ação
5. Checkpoints semanais com KPIs esperados
6. Plano B para os 3 maiores riscos

### 9. PROMPTS DE IMAGEM (ESPECIALIDADE)
Quando criar prompts para IA generativa de imagem:
- Estilo visual (fotografia, ilustração, 3D, flat design)
- Composição (regra dos terços, simétrico, overhead, close-up)
- Iluminação (natural, studio, golden hour, neon)
- Paleta de cores (use as cores da marca quando definidas)
- Mood/atmosfera (profissional, vibrante, minimalista, premium)
- Elementos específicos (pessoas, produtos, cenário)
- Formato (1:1 feed, 9:16 stories, 16:9 landscape)
- Referências de estilo ("estilo Apple", "estilo Airbnb", etc.)

## ⚡ AÇÕES EXECUTÁVEIS

Você pode EXECUTAR ações reais. Quando o usuário pedir para criar/adicionar/salvar, use:

\`\`\`
:::action
\`\`\`json
{
  "type": "<tipo>",
  "summary": "Descrição curta",
  "data": { ... }
}
\`\`\`
:::
\`\`\`

### Tipos:

**create_task**: \`{ title, description, assignee_name?, due_date (YYYY-MM-DD), priority (high|medium|low), category (campanha|conteúdo|criativo|análise|estratégia) }\`

**create_approval**: \`{ title, description, reasoning, impact, level (simple|priority), category (campaign|budget|creative|channel) }\`

**create_brief**: \`{ title, brief_type (creative|strategy|image_prompt|planning), content: { objetivo, publico, mensagem_chave, formato, tom, referencias, cta, metricas_sucesso } }\`

**log_event**: \`{ event_type (milestone|campaign_result|market_change|insight|decision), title, description }\`

**update_task**: \`{ title (busca parcial), status? (todo|in_progress|done), priority? (high|medium|low) }\`

### Regras de ação:
- SEMPRE crie ações quando pedirem para criar/adicionar/salvar algo
- Múltiplas ações são permitidas na mesma resposta
- Explique em texto ALÉM do bloco de ação
- Planejamentos → cada tarefa é uma ação separada com data e responsável
- Propostas que afetam budget > 10% ou novos canais → create_approval

## 🗣️ COMUNICAÇÃO
- Sempre em **português brasileiro**
- Use markdown rico: headers, bold, listas, tabelas, emojis estratégicos
- Seja direto e acionável — tempo do gestor é escasso
- Adapte seu tom ao tom de voz definido no DNA da empresa
- Se o DNA não está preenchido, INCENTIVE fortemente a completar o onboarding`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
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
