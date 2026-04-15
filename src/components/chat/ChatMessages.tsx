import { forwardRef } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatMessage } from "@/lib/chatStream";
import ReactMarkdown from "react-markdown";

interface ChatMessagesProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  suggestions?: { icon: React.ElementType; text: string }[];
  onSuggestionClick?: (text: string) => void;
}

export const ChatMessages = forwardRef<HTMLDivElement, ChatMessagesProps>(
  ({ messages, isStreaming, suggestions, onSuggestionClick }, ref) => {
    return (
      <div ref={ref} className="flex-1 overflow-auto px-6 py-4 space-y-4">
        {messages.length === 0 && !isStreaming && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
            <div className="w-14 h-14 rounded-2xl orion-gradient flex items-center justify-center orion-glow mb-4">
              <Sparkles className="w-7 h-7 text-primary-foreground" />
            </div>
            <h2 className="text-heading text-foreground mb-2">Como posso ajudar?</h2>
            <p className="text-sm text-muted-foreground max-w-md mb-6">
              Sou o Orion, seu head de marketing com IA. Posso analisar dados, criar propostas, planejar campanhas e muito mais.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
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
              {msg.role === "assistant" ? (
                <div className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <span>{msg.content}</span>
              )}
            </div>
          </div>
        ))}

        {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
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

        {suggestions && suggestions.length > 0 && messages.length === 0 && (
          <div className="flex gap-3 justify-center pt-2">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => onSuggestionClick?.(s.text)}
                className="flex items-center gap-2 bg-card border border-border rounded-xl px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:border-muted-foreground/30 transition-all max-w-xs text-left"
              >
                <s.icon className="w-4 h-4 text-orion-violet-light shrink-0" />
                {s.text}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
);

ChatMessages.displayName = "ChatMessages";
