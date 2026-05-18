import { GitCompareArrows } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ComparePeriodToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function ComparePeriodToggle({ checked, onCheckedChange }: ComparePeriodToggleProps) {
  return (
    <Button
      type="button"
      variant={checked ? "default" : "outline"}
      size="sm"
      onClick={() => onCheckedChange(!checked)}
      className={cn("gap-2", checked && "orion-gradient text-primary-foreground")}
    >
      <GitCompareArrows className="w-4 h-4" />
      Comparar com mes anterior
    </Button>
  );
}

export default ComparePeriodToggle;
