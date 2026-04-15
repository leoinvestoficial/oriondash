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

    if (authHeader) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);

      if (user) {
        // Fetch all context in parallel
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

          // Adaptive strategy instructions based on context
          let adaptiveStrategy = "\n## ESTRATÉGIA ADAPTATIVA (USE SEMPRE)\n";
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

        // Team context
        if (teamRes.data?.length) {
          teamContext = `\n## Equipe (${teamRes.data.length} membros)\n`;
          for (const m of teamRes.data) {
            teamContext += `- **${m.name}** (${m.role}) — ${m.department || "Sem departamento"} — ${m.responsibilities || "Sem responsabilidades definidas"}\n`;
          }
        }

        // Tasks context
        if (tasksRes.data?.length) {
          const todo = tasksRes.data.filter(t => t.status === "todo").length;
          const inProgress = tasksRes.data.filter(t => t.status === "in_progress").length;
          const done = tasksRes.data.filter(t => t.status === "done").length;
          tasksContext = `\n## Tarefas Atuais (${tasksRes.data.length} total: ${todo} a fazer, ${inProgress} em andamento, ${done} concluídas)\n`;
          for (const t of tasksRes.data.slice(0, 20)) {
            tasksContext += `- [${t.status}] ${t.title}${t.priority === "high" ? " ⚠️" : ""}${t.due_date ? ` (prazo: ${t.due_date})` : ""}\n`;
          }
        }

        // Campaigns context
        let campaignsContext = "";
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

        // Business events context
        if (eventsRes.data?.length) {
          eventsContext = `\n## Eventos Recentes do Negócio\n`;
          for (const e of eventsRes.data.slice(0, 10)) {
            eventsContext += `- [${e.event_type}] ${e.title}: ${e.description || ""} (${new Date(e.created_at).toLocaleDateString("pt-BR")})\n`;
          }
        }

        // Approvals context
        if (approvalsRes.data?.length) {
          eventsContext += `\n## Últimas Aprovações\n`;
          for (const a of approvalsRes.data.slice(0, 10)) {
            eventsContext += `- [${a.status}] ${a.title} — ${a.category} (${new Date(a.created_at).toLocaleDateString("pt-BR")})\n`;
          }
        }
      }
    }

    const systemPrompt = `Você é o Orion, um head de marketing com IA que opera como um colaborador sênior autônomo.

Você tem acesso ao Company DNA, equipe, tarefas e histórico do negócio. SEMPRE use esse contexto em TODAS as respostas. Nunca dê conselhos genéricos.

${companyContext}
${teamContext}
${tasksContext}
${campaignsContext}
${eventsContext}

## Suas capacidades:
1. **Análise de performance**: Analise métricas, identifique tendências e anomalias
2. **Propostas de campanha**: Crie propostas detalhadas com budget, canais, criativos e KPIs
3. **Intelligence de mercado**: Analise concorrência e oportunidades baseado no contexto
4. **Planejamento**: Crie planos com tarefas específicas para cada membro da equipe
5. **Otimização**: Sugira realocações de budget, ajustes de targeting e melhorias
6. **Gestão de tarefas**: Quando solicitado, gere tarefas detalhadas e atribua aos membros corretos
7. **Retroalimentação**: Use eventos passados, aprovações e resultados para adaptar recomendações
8. **Briefs criativos**: Gere briefs completos com objetivo, público, formato, tom, referências visuais
9. **Prompts de imagem**: Quando solicitado, gere prompts detalhados para geradores de imagem IA (Midjourney, DALL-E, etc.)
10. **Guias estratégicos**: Monte guias completos de canais, budget split, timeline, KPIs e métricas de sucesso

## Regras:
- Sempre responda em português brasileiro
- Use dados e números concretos quando possível — se sabe o budget, calcule splits exatos
- Ao gerar planejamentos, atribua tarefas a membros específicos da equipe com base em suas responsabilidades
- Quando sugerir ações que afetem budget ou canais reais, informe que será enviada para aprovação
- Use markdown para formatação (bold, listas, headers)
- Seja direto e acionável — não enrole
- Se o Company DNA não estiver preenchido, incentive o usuário a completar o onboarding
- Adapte o tom de voz ao tom definido pela empresa no DNA
- Aprenda com aprovações passadas (aprovadas vs rejeitadas) para refinar futuras propostas
- Quando gerar prompts de imagem, seja extremamente detalhado: estilo visual, composição, iluminação, cores, mood, formato
- Ao criar briefs criativos, inclua: objetivo, público-alvo, mensagem-chave, formato, tom, referências, CTA, métricas de sucesso`;

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
