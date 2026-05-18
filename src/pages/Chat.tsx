import { useState, useRef, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Send, Sparkles, BarChart3, Lightbulb, Brain, ListTodo, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { streamChat, ChatMessage } from "@/lib/chatStream";
import { parseActions, executeAction } from "@/lib/chatActions";
import { useCompanyDNA, type CompanyDNARecord } from "@/hooks/useCompanyDNA";
import { useUserRole } from "@/hooks/useUserRole";
import { useOrionViewMode } from "@/hooks/useOrionViewMode";
import { buildCentralChatContext, type CentralChatContext } from "@/lib/centralChatContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ChatMessages } from "@/components/chat/ChatMessages";
import { ChatInput } from "@/components/chat/ChatInput";
import { PageHelpBanner } from "@/components/help/PageHelpBanner";
import { PAGE_HELP } from "@/lib/pageHelp";

const STATIC_SUGGESTIONS = [
  { icon: BarChart3, text: "Monte um planejamento de marketing para os próximos 3 meses" },
  { icon: ListTodo, text: "Crie tarefas para minha equipe baseado nas prioridades atuais" },
  { icon: Lightbulb, text: "Quais canais fazem mais sentido para o meu negócio?" },
  { icon: Sparkles, text: "Crie uma proposta de campanha e envie para aprovação" },
];

const buildDynamicSuggestions = (dna: CompanyDNARecord | null) => {
  if (!dna?.onboarding_completed || !dna?.company_name) return STATIC_SUGGESTIONS;
  const goals = (dna.dna_data?.goalsConstraints as Record<string, string> | undefined);
  const identity = (dna.dna_data?.identity as Record<string, string> | undefined);
  const primaryGoal = goals?.primary_goal;
  const sector = identity?.sector;
  const name = dna.company_name;
  return [
    {
      icon: BarChart3,
      text: primaryGoal
        ? `Monte um plano de marketing para ${name} focado em: ${primaryGoal}`
        : `Monte um planejamento de marketing para ${name} nos próximos 3 meses`,
    },
    {
      icon: ListTodo,
      text: "Crie tarefas para minha equipe baseado nas prioridades atuais",
    },
    {
      icon: Lightbulb,
      text: sector
        ? `Quais canais fazem mais sentido para empresas de ${sector}?`
        : `Quais canais fazem mais sentido para ${name}?`,
    },
    {
      icon: Sparkles,
      text: primaryGoal
        ? `Crie uma campanha voltada para ${primaryGoal} e envie para aprovação`
        : "Crie uma proposta de campanha e envie para aprovação",
    },
  ];
};

const Chat = () => {
  const { user } = useAuth();
  const { dna } = useCompanyDNA();
  const { role } = useUserRole();
  const { viewMode } = useOrionViewMode();
  const suggestions = useMemo(() => buildDynamicSuggestions(dna), [dna]);
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const promptAppliedRef = useRef(false);

  // Load chat history
  useEffect(() => {
    if (!user) return;
    supabase
      .from("chat_history")
      .select("role, content")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setMessages(data.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })));
        }
      });
  }, [user]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const saveMessage = async (role: "user" | "assistant", content: string) => {
    if (!user) return;
    await supabase.from("chat_history").insert({ user_id: user.id, role, content });
  };

  const processActions = async (content: string) => {
    if (!user) return;
    const { actions } = parseActions(content);
    for (const action of actions) {
      await executeAction(action, user.id, dna?.id);
    }
  };

  const handleSend = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || isStreaming) return;

    const userMsg: ChatMessage = { role: "user", content: msg };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);

    await saveMessage("user", msg);

    let assistantContent = "";
    let centralContext: Record<string, unknown> | undefined;
    if (user) {
      try {
        centralContext = await buildCentralChatContext({ userId: user.id, companyId: dna?.id, role, viewMode }) as unknown as Record<string, unknown>;
      } catch {
        centralContext = undefined;
      }
    }

    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      // Show content without action blocks
      const { cleanContent } = parseActions(assistantContent);
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: cleanContent } : m));
        }
        return [...prev, { role: "assistant", content: cleanContent }];
      });
    };

    try {
      await streamChat({
        messages: newMessages,
        context: centralContext,
        onDelta: updateAssistant,
        onDone: async () => {
          setIsStreaming(false);
          if (assistantContent) {
            // Save full content (with action markers) to history
            await saveMessage("assistant", assistantContent);
            // Execute any actions
            await processActions(assistantContent);
          }
        },
        onError: (error) => {
          setIsStreaming(false);
          toast.error(error);
        },
      });
    } catch (e) {
      setIsStreaming(false);
      toast.error("Erro ao conectar com o Orion");
    }
  };

  useEffect(() => {
    if (promptAppliedRef.current) return;
    const prompt = searchParams.get("prompt");
    if (!prompt) return;
    const withContext = searchParams.get("context") === "central"
      ? `[Contexto: Central Orion]\n${prompt}`
      : prompt;
    promptAppliedRef.current = true;
    setInput(withContext);
    if (searchParams.get("autoSend") === "true") {
      void handleSend(withContext);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasNoDNA = !dna?.onboarding_completed;

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
            <p className="text-[11px] text-muted-foreground">
              {dna?.company_name
                ? `Contexto: ${dna.company_name} · IA com Company DNA`
                : "Consultas livres com IA contextualizada"}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1 bg-orion-surface-2 px-2 py-1 rounded-md">
              <ListTodo className="w-3 h-3" /> Tarefas
            </span>
            <span className="flex items-center gap-1 bg-orion-surface-2 px-2 py-1 rounded-md">
              <CheckCircle2 className="w-3 h-3" /> Aprovações
            </span>
            <span className="flex items-center gap-1 bg-orion-surface-2 px-2 py-1 rounded-md">
              <FileText className="w-3 h-3" /> Briefs
            </span>
          </div>
        </div>

        <div className="px-6 pt-4">
          <PageHelpBanner content={PAGE_HELP.chat} />
        </div>

        {/* DNA Warning */}
        {hasNoDNA && (
          <div className="mx-6 mt-4 bg-orion-warning/10 border border-orion-warning/20 rounded-xl px-4 py-3 flex items-center gap-3">
            <Brain className="w-5 h-5 text-orion-warning shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-foreground">Company DNA incompleto</p>
              <p className="text-xs text-muted-foreground">
                Complete o onboarding para respostas personalizadas ao seu negócio.
              </p>
            </div>
            <a href="/onboarding" className="text-xs text-orion-warning hover:underline shrink-0">
              Completar →
            </a>
          </div>
        )}

        {/* Messages */}
        <ChatMessages
          ref={scrollRef}
          messages={messages}
          isStreaming={isStreaming}
          suggestions={messages.length === 0 ? suggestions : undefined}
          onSuggestionClick={handleSend}
        />

        {/* Input */}
        <ChatInput
          value={input}
          onChange={setInput}
          onSend={() => handleSend()}
          disabled={isStreaming}
        />
      </div>
    </AppLayout>
  );
};

export default Chat;
