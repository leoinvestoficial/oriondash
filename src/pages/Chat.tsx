import { useState, useRef, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Send, Sparkles, BarChart3, Lightbulb, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { streamChat, ChatMessage } from "@/lib/chatStream";
import { useCompanyDNA } from "@/hooks/useCompanyDNA";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ChatMessages } from "@/components/chat/ChatMessages";
import { ChatInput } from "@/components/chat/ChatInput";

const SUGGESTIONS = [
  { icon: BarChart3, text: "Monte um planejamento de marketing para os próximos 3 meses" },
  { icon: Lightbulb, text: "Quais canais fazem mais sentido para o meu negócio?" },
  { icon: Sparkles, text: "Crie uma proposta de campanha para o meu produto" },
];

const Chat = () => {
  const { user } = useAuth();
  const { dna } = useCompanyDNA();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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

    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantContent } : m));
        }
        return [...prev, { role: "assistant", content: assistantContent }];
      });
    };

    try {
      await streamChat({
        messages: newMessages,
        onDelta: updateAssistant,
        onDone: async () => {
          setIsStreaming(false);
          if (assistantContent) {
            await saveMessage("assistant", assistantContent);
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
          suggestions={messages.length === 0 ? SUGGESTIONS : undefined}
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
