// EmptyState — componente reutilizável pra listas vazias.
//
// Uso:
//   <EmptyState
//     icon={Sparkles}
//     title="Nenhuma hipótese ainda"
//     description="Crie sua primeira hipótese pra começar a testar."
//     action={{ label: "Criar hipótese", onClick: () => setShowForm(true) }}
//   />
//
// Princípio: lista vazia sempre tem um CTA específico — nunca só "Nenhum item".

import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "ghost";
  };
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  className,
  size = "md",
}: EmptyStateProps) => {
  const padding = size === "sm" ? "py-8 px-4" : size === "lg" ? "py-16 px-6" : "py-12 px-5";
  const iconSize = size === "sm" ? "w-8 h-8" : size === "lg" ? "w-14 h-14" : "w-10 h-10";
  const iconWrap = size === "sm" ? "w-14 h-14" : size === "lg" ? "w-20 h-20" : "w-16 h-16";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        padding,
        className,
      )}
    >
      {Icon && (
        <div
          className={cn(
            "rounded-full flex items-center justify-center bg-muted text-muted-foreground mb-4",
            iconWrap,
          )}
        >
          <Icon className={iconSize} strokeWidth={1.5} />
        </div>
      )}
      <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-4 leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <Button
          onClick={action.onClick}
          variant={action.variant ?? "default"}
          size="sm"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
