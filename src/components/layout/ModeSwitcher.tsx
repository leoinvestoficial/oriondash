import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrionViewMode } from "@/lib/productRoles";

interface ModeSwitcherProps {
  value: OrionViewMode;
  onChange: (mode: OrionViewMode) => void;
  canUsePro: boolean;
  compact?: boolean;
}

export const ModeSwitcher = ({ value, onChange, canUsePro, compact = false }: ModeSwitcherProps) => {
  return (
    <div className={cn(
      "rounded-xl border border-border bg-background/70 p-1",
      compact ? "grid grid-cols-2" : "space-y-1"
    )}>
      {([
        { value: "simplified" as const, label: "Simplificado", help: "clareza e ação" },
        { value: "pro" as const, label: "Pro", help: "controle avançado" },
      ]).map((option) => {
        const disabled = option.value === "pro" && !canUsePro;
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.value)}
            title={disabled ? "Seu perfil tem acesso de leitura simplificada." : option.help}
            className={cn(
              "w-full rounded-lg px-2.5 py-2 text-left text-xs transition-colors",
              compact && "text-center",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
              disabled && "cursor-not-allowed opacity-50 hover:bg-transparent hover:text-muted-foreground"
            )}
          >
            <span className={cn("flex items-center gap-1.5", compact && "justify-center")}>
              {disabled && <Lock className="h-3 w-3" />}
              <span className="font-medium">{option.label}</span>
            </span>
            {!compact && <span className={cn("mt-0.5 block text-[10px]", active ? "text-primary-foreground/80" : "text-muted-foreground")}>{option.help}</span>}
          </button>
        );
      })}
    </div>
  );
};
