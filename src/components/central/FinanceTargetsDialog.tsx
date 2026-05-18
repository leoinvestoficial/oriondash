import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMarketingFinanceTargets } from "@/hooks/useMarketingFinanceTargets";
import { toast } from "sonner";

interface FinanceTargetsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

export const FinanceTargetsDialog = ({ open, onOpenChange, onSaved }: FinanceTargetsDialogProps) => {
  const { target, save } = useMarketingFinanceTargets();
  const [form, setForm] = useState({
    monthly_budget: "",
    target_cpa: "",
    target_cac: "",
    target_roas: "",
    estimated_margin: "",
    break_even_cpa: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({
      monthly_budget: target?.monthly_budget?.toString() || "",
      target_cpa: target?.target_cpa?.toString() || "",
      target_cac: target?.target_cac?.toString() || "",
      target_roas: target?.target_roas?.toString() || "",
      estimated_margin: target?.estimated_margin?.toString() || "",
      break_even_cpa: target?.break_even_cpa?.toString() || "",
    });
  }, [open, target]);

  const numberOrNull = (value: string) => {
    if (!value.trim()) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : NaN;
  };

  const handleSave = async () => {
    const parsed = {
      monthly_budget: numberOrNull(form.monthly_budget),
      target_cpa: numberOrNull(form.target_cpa),
      target_cac: numberOrNull(form.target_cac),
      target_roas: numberOrNull(form.target_roas),
      estimated_margin: numberOrNull(form.estimated_margin),
      break_even_cpa: numberOrNull(form.break_even_cpa),
    };

    if (Object.values(parsed).some((value) => Number.isNaN(value))) {
      toast.error("Use apenas números válidos");
      return;
    }
    if (Object.values(parsed).some((value) => value != null && value < 0)) {
      toast.error("Valores não podem ser negativos");
      return;
    }
    if (parsed.target_roas != null && parsed.target_roas <= 0) {
      toast.error("ROAS alvo deve ser maior que zero");
      return;
    }
    if (parsed.estimated_margin != null && parsed.estimated_margin > 100) {
      toast.error("Margem deve ser percentual de 0 a 100");
      return;
    }

    setSaving(true);
    const ok = await save(parsed);
    setSaving(false);
    if (ok) {
      onSaved?.();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Metas financeiras de marketing</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            ["monthly_budget", "Verba mensal"],
            ["target_cpa", "CPA alvo"],
            ["target_cac", "CAC alvo"],
            ["target_roas", "ROAS alvo"],
            ["estimated_margin", "Margem estimada (%)"],
            ["break_even_cpa", "Break-even CPA"],
          ].map(([key, label]) => (
            <label key={key} className="space-y-1 text-xs text-muted-foreground">
              {label}
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form[key as keyof typeof form]}
                onChange={(event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))}
                className="bg-background"
              />
            </label>
          ))}
        </div>
        <div className="rounded-lg border border-border bg-background/40 p-3 text-xs text-muted-foreground">
          O Orion usa essas metas para evitar recomendar escala de verba sem margem, break-even e alvo financeiro.
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving} className="orion-gradient text-primary-foreground">
            {saving ? "Salvando..." : "Salvar metas"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
