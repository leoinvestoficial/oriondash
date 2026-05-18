// FloatingChat — widget de chat persistente disponível em todas as páginas.
// Abre como painel lateral, mantém histórico da sessão e usa o mesmo backend
// que a página /chat (streamChat + chat_history).

import { useCallback, useEffect, useRef, useState } from "react";
import {
  MessageSquare,
  X,
  Send,
  Loader2,
  Minimize2,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { streamChat, type ChatMessage } from "@/lib/chatStream";
import { parseActions, executeAction } from "@/lib/chatActions";
import { useCompanyDNA } from "@/hooks/useCompanyDNA";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// ─── Quick suggestions shown when chat is empty ────────────────────────────────
const SUGGESTIONS = [
  "Crie um funil de vendas para meu produto principal",
  "Analise meu CRM e sugira oportunidades de recompra",
  "Quais campanhas devo pausar ou escalar agora?",
  "Monte metas de marketing para o próximo mês",
];

// ─── Message bubble ─────────────────────────────────────────────────────────────
function Bubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <div className={cn("flex gap-2 text-sm", isUser ? "flex-row-reverse" : "flex-row")}>
      {!isUser && (
        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles className="w-3 h-3 text-primary" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3 py-2 leading-relaxed whitespace-pre-wrap break-words",
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-muted/60 text-foreground rounded-tl-sm",
        )}
      >
        {msg.content}
      </div>
    </div>
  );
}

// ─── Main floating chat ─────────────────────────────────────────────────────────
export function FloatingChat() {
  const { user } = useAuth();
  const { dna } = useCompanyDNA();
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [unread, setUnread] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const historyLoaded = useRef(false);

  // Load chat history once
  useEffect(() => {
    if (!user || historyLoaded.current) return;
    historyLoaded.current = true;
    supabase
      .from("chat_history")
      .select("role, content")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(50)
      .then(({ data }) => {
        if (data?.length) {
          setMessages(data.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })));
        }
      });
  }, [user]);

  // Auto-scroll
  useEffect(() => {
    if (open && !minimized) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, open, minimized]);

  // Focus input when opened
  useEffect(() => {
    if (open && !minimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, minimized]);

  const saveMessage = useCallback(
    async (role: "user" | "assistant", content: string) => {
      if (!user) return;
      await supabase.from("chat_history").insert({ user_id: user.id, role, content });
    },
    [user],
  );

  const processActions = useCallback(
    async (content: string) => {
      if (!user || !dna) return;
      const { actions } = parseActions(content);
      for (const action of actions) {
        await executeAction(action, user.id, dna.id);
      }
    },
    [user, dna],
  );

  const handleSend = useCallback(
    async (text?: string) => {
      const msg = (text || input).trim();
      if (!msg || streaming) return;

      const userMsg: ChatMessage = { role: "user", content: msg };
      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      setInput("");
      setStreaming(true);

      await saveMessage("user", msg);

      let assistantContent = "";

      const updateAssistant = (chunk: string) => {
        assistantContent += chunk;
        const { cleanContent } = parseActions(assistantContent);
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: cleanContent } : m));
          }
          return [...prev, { role: "assistant", content: cleanContent }];
        });
        // Increment unread if panel is closed/minimized
        if (!open || minimized) setUnread((n) => n + 1);
      };

      try {
        await streamChat({
          messages: newMessages,
          onDelta: updateAssistant,
          onDone: async () => {
            setStreaming(false);
            if (assistantContent) {
              await saveMessage("assistant", assistantContent);
              await processActions(assistantContent);
            }
          },
          onError: (err) => {
            setStreaming(false);
            toast.error(err);
          },
        });
      } catch {
        setStreaming(false);
      }
    },
    [input, messages, streaming, open, minimized, saveMessage, processActions],
  );

  const handleOpen = () => {
    setOpen(true);
    setMinimized(false);
    setUnread(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const companyName = dna?.company_name || "sua empresa";

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={handleOpen}
          className="fixed bottom-5 right-5 z-50 w-13 h-13 rounded-full orion-gradient shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
          aria-label="Abrir chat com IA"
        >
          <div className="relative">
            <MessageSquare className="w-6 h-6 text-white" />
            {unread > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </div>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div
          className={cn(
            "fixed bottom-5 right-5 z-50 flex flex-col rounded-2xl border border-white/10 bg-background shadow-2xl transition-all duration-200",
            minimized
              ? "w-72 h-12"
              : "w-[360px] sm:w-[400px] h-[580px] max-h-[85vh]",
          )}
        >
          {/* Header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 rounded-t-2xl bg-card shrink-0">
            <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Orion IA</p>
              {!minimized && (
                <p className="text-[10px] text-muted-foreground truncate">{companyName}</p>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMinimized((m) => !m)}
                className="p-1 rounded hover:bg-muted/30 text-muted-foreground transition-colors"
                aria-label={minimized ? "Expandir" : "Minimizar"}
              >
                {minimized ? (
                  <ChevronDown className="w-4 h-4 rotate-180" />
                ) : (
                  <Minimize2 className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded hover:bg-muted/30 text-muted-foreground transition-colors"
                aria-label="Fechar chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* Messages */}
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth"
              >
                {messages.length === 0 ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                      </div>
                      <p className="text-sm font-medium">Olá! Sou o Orion.</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Seu especialista em marketing de {companyName}. Como posso ajudar?
                      </p>
                    </div>
                    <div className="space-y-2">
                      {SUGGESTIONS.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => handleSend(s)}
                          className="w-full text-left text-xs rounded-lg border border-white/5 bg-muted/20 px-3 py-2 hover:bg-muted/40 transition-colors text-muted-foreground hover:text-foreground"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((m, i) => <Bubble key={i} msg={m} />)
                )}

                {streaming && (
                  <div className="flex gap-2 items-center">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <Sparkles className="w-3 h-3 text-primary" />
                    </div>
                    <div className="flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0ms]" />
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="px-3 pb-3 shrink-0">
                <div className="flex items-end gap-2 rounded-xl border border-white/10 bg-muted/20 px-3 py-2">
                  <textarea
                    ref={inputRef}
                    rows={1}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Pergunte ao Orion..."
                    className="flex-1 bg-transparent text-sm resize-none outline-none placeholder:text-muted-foreground max-h-[120px] min-h-[20px]"
                    disabled={streaming}
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={!input.trim() || streaming}
                    className={cn(
                      "shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all",
                      input.trim() && !streaming
                        ? "bg-primary text-primary-foreground hover:opacity-90"
                        : "bg-muted/30 text-muted-foreground cursor-not-allowed",
                    )}
                    aria-label="Enviar"
                  >
                    {streaming ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground text-center mt-1.5">
                  IA com contexto completo de {companyName} · Enter para enviar
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
