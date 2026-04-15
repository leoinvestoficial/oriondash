import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
}

export const ChatInput = ({ value, onChange, onSend, disabled }: ChatInputProps) => {
  return (
    <div className="px-6 py-4 border-t border-border">
      <div className="max-w-2xl mx-auto flex gap-3">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && onSend()}
          placeholder="Pergunte ao Orion..."
          className="flex-1 bg-orion-surface-2 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          disabled={disabled}
        />
        <Button
          onClick={onSend}
          disabled={!value.trim() || disabled}
          className="orion-gradient text-primary-foreground rounded-xl px-4"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
