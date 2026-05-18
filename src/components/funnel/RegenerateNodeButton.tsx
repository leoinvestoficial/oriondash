import { useState } from "react";
import { Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

interface RegenerateNodeButtonProps {
  nodeId: string;
  onRegenerated?: (node: unknown) => void;
}

export function RegenerateNodeButton({ nodeId, onRegenerated }: RegenerateNodeButtonProps) {
  const [open, setOpen] = useState(false);
  const [tweak, setTweak] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegenerate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("regenerate-funnel-node", {
        body: { node_id: nodeId, tweak: tweak.trim() || undefined },
      });
      if (error) throw error;
      toast.success("No regenerado pelo Copywriter.");
      onRegenerated?.(data?.node);
      setOpen(false);
      setTweak("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao regenerar o no");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Wand2 className="w-4 h-4" />
          Regenerar este no
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Regenerar este no</DialogTitle>
          <DialogDescription className="sr-only">Ajuste o copy deste nó do funil com auxílio de IA</DialogDescription>
        </DialogHeader>
        <Textarea
          value={tweak}
          onChange={(event) => setTweak(event.target.value)}
          placeholder="Opcional: diga o que quer mudar neste no. Ex: mais direto, focar em prova social, trocar CTA..."
          rows={4}
        />
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleRegenerate} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            Regenerar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default RegenerateNodeButton;
