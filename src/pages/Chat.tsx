import { useState, useRef, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Send, Sparkles, BarChart3, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  type?: "text" | "insight" | "chart";
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: "1",
    role: "assistant",
    content: "Olá! Sou o Orion, seu assistente de marketing com IA. Posso analisar campanhas, gerar propostas, responder perguntas sobre performance e muito mais. Como posso ajudar?",
  },
];

const SUGGESTIONS = [
  { icon: BarChart3, text: "Como foi minha performance este mês?" },
  { icon: Lightbulb, text: "Crie uma proposta para lançar o Produto Y" },
  { icon: Sparkles, text: "O que a concorrência está fazendo diferente?" },
];

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const simulateResponse = (userMessage: string) => {
    setIsTyping(true);

    // Simulated AI responses based on keywords
    let response = "Entendi sua pergunta. Vou analisar os dados disponíveis e preparar uma resposta detalhada. Em um ambiente de produção, eu consultaria o Company DNA e os dados em tempo real para fornecer insights personalizados.";

    if (userMessage.toLowerCase().includes("performance") || userMessage.toLowerCase().includes("mês")) {
      response = `📊 **Resumo de Performance — Abril 2026**

**Gasto total:** R$ 42.350 (-8.2% vs. março)
**ROAS geral:** 3.8x (+12.5%)
**Leads gerados:** 1.247 (+22.1% — 22% acima da meta)
**CAC médio:** R$ 34 (-15.3%)

**Destaques por canal:**
- 🟣 **Meta Ads:** ROAS 4.2x, 342 leads. Vídeo curto performou 3x melhor que carrossel.
- 🟢 **Google Ads:** ROAS 5.1x, melhor canal. Campanhas de Search puxando resultado.
- 🔴 **TikTok:** CPC subiu 34%, recomendo realocar 15% do budget.
- 🟡 **LinkedIn:** Estável, bom para B2B mas volume limitado.

**Recomendação:** Realocar budget de TikTok para Google Search. Já criei uma proposta de realocação na Central de Aprovações.`;
    } else if (userMessage.toLowerCase().includes("concorrência") || userMessage.toLowerCase().includes("concorrente")) {
      response = `🔍 **Market Intelligence — Concorrência**

Detectei 3 movimentações relevantes:

1. **Competidor A** aumentou investimento em Google Ads em ~40% nas últimas 2 semanas. Provável preparação para lançamento.

2. **Competidor B** pausou campanhas de TikTok — pode indicar reestruturação ou corte de budget.

3. **Competidor C** está testando posicionamento premium com copy focada em exclusividade. Share of voice deles subiu 12%.

**Oportunidade:** Com Competidor B saindo do TikTok, há uma janela para captar o público órfão. Mas dado seu ROAS atual no canal, sugiro testar com budget limitado antes.`;
    } else if (userMessage.toLowerCase().includes("proposta") || userMessage.toLowerCase().includes("lançar")) {
      response = `🚀 **Proposta de Campanha — Lançamento**

Baseado no Company DNA e histórico, aqui está minha proposta:

**Objetivo:** Gerar 500 leads qualificados em 30 dias
**Budget recomendado:** R$ 18.000

**Distribuição por canal:**
- Meta Ads (50%): Vídeo curto + retargeting
- Google Search (30%): Keywords de intenção alta
- LinkedIn (20%): Conteúdo técnico para decisores

**Criativos sugeridos:**
- 4 variações de vídeo 15s com demonstração
- 6 headlines para Search baseadas em benefício temporal
- 3 posts educativos para LinkedIn

**KPIs de referência:**
- CAC alvo: R$ 36
- ROAS mínimo: 3.5x
- Taxa de conversão: 4.2%

Quer que eu envie para aprovação?`;
    }

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "assistant", content: response },
      ]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSend = (text?: string) => {
    const msg = text || input.trim();
    if (!msg) return;

    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "user", content: msg },
    ]);
    setInput("");
    simulateResponse(msg);
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg orion-gradient flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-heading text-foreground">Chat com Orion</h1>
            <p className="text-[11px] text-muted-foreground">Consultas livres com dados e propostas acionáveis</p>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-auto px-6 py-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "max-w-2xl animate-fade-in",
                msg.role === "user" ? "ml-auto" : ""
              )}
            >
              <div
                className={cn(
                  "rounded-xl px-4 py-3 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border text-foreground"
                )}
              >
                {msg.role === "assistant" && (
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-3 h-3 text-orion-violet-light" />
                    <span className="text-[10px] text-orion-violet-light font-medium">Orion</span>
                  </div>
                )}
                <div className="whitespace-pre-wrap">
                  {msg.content.split(/(\*\*.*?\*\*)/).map((part, i) => {
                    if (part.startsWith("**") && part.endsWith("**")) {
                      return <strong key={i} className="font-medium">{part.slice(2, -2)}</strong>;
                    }
                    return part;
                  })}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="max-w-2xl animate-fade-in">
              <div className="bg-card border border-border rounded-xl px-4 py-3 inline-flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-orion-violet-light rounded-full animate-pulse-glow" />
                  <span className="w-2 h-2 bg-orion-violet-light rounded-full animate-pulse-glow" style={{ animationDelay: "0.2s" }} />
                  <span className="w-2 h-2 bg-orion-violet-light rounded-full animate-pulse-glow" style={{ animationDelay: "0.4s" }} />
                </div>
                <span className="text-xs text-muted-foreground">Orion está analisando...</span>
              </div>
            </div>
          )}

          {/* Suggestions */}
          {messages.length <= 1 && (
            <div className="flex gap-3 pt-4">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(s.text)}
                  className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:border-muted-foreground/30 transition-all"
                >
                  <s.icon className="w-4 h-4 text-orion-violet-light" />
                  {s.text}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-t border-border">
          <div className="max-w-2xl mx-auto flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Pergunte ao Orion..."
              className="flex-1 bg-orion-surface-2 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              className="orion-gradient text-primary-foreground rounded-xl px-4"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Chat;
