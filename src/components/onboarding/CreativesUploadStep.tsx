import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Image as ImageIcon, Upload, Trash2, FileVideo } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface CreativesUploadStepProps {
  onNext: () => void;
  onBack: () => void;
  companyDnaId?: string | null;
}

interface UploadedCreative {
  id: string;
  file_path: string;
  file_name: string;
  file_type: string;
  performance_label: string | null;
  copy_text: string | null;
}

export const CreativesUploadStep = ({ onNext, onBack, companyDnaId }: CreativesUploadStepProps) => {
  const { user } = useAuth();
  const [items, setItems] = useState<UploadedCreative[]>([]);
  const [uploading, setUploading] = useState(false);
  const [perfLabel, setPerfLabel] = useState<"winner" | "loser" | "current">("current");
  const [copyText, setCopyText] = useState("");

  const refresh = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("creative_uploads")
      .select("id, file_path, file_name, file_type, performance_label, copy_text")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (!error && data) setItems(data);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("creative-uploads").upload(path, file);
    if (upErr) { toast.error("Falha no upload"); console.error(upErr); setUploading(false); return; }

    const { error: dbErr } = await supabase.from("creative_uploads").insert({
      user_id: user.id,
      company_dna_id: companyDnaId ?? null,
      file_path: path,
      file_name: file.name,
      file_type: file.type,
      performance_label: perfLabel,
      copy_text: copyText || null,
    });
    if (dbErr) { toast.error("Erro ao registrar criativo"); console.error(dbErr); }
    else { toast.success("Criativo enviado"); setCopyText(""); await refresh(); }
    setUploading(false);
    e.target.value = "";
  };

  const remove = async (id: string, path: string) => {
    await supabase.storage.from("creative-uploads").remove([path]);
    await supabase.from("creative_uploads").delete().eq("id", id);
    await refresh();
  };

  return (
    <div className="max-w-2xl w-full mx-auto animate-fade-in">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="w-10 h-10 rounded-xl orion-gradient flex items-center justify-center text-primary-foreground">
            <ImageIcon className="w-5 h-5" />
          </span>
          <div>
            <p className="text-xs text-muted-foreground font-mono">CRIATIVOS ATUAIS</p>
            <h2 className="text-display text-foreground">Mostre o que está no ar hoje</h2>
          </div>
        </div>
        <p className="text-muted-foreground">
          Envie anúncios atuais — campeões, fracassados ou em uso. O Orion analisa para detectar fadiga e padrões.
        </p>
      </div>

      <div className="bg-orion-surface-2 border border-border rounded-xl p-5 space-y-4 mb-6">
        <div>
          <label className="block text-sm text-foreground mb-2 font-medium">Classificação deste criativo</label>
          <div className="flex gap-2">
            {([
              { v: "winner", l: "🏆 Campeão" },
              { v: "current", l: "▶ Em uso" },
              { v: "loser", l: "✗ Fracassou" },
            ] as const).map((o) => (
              <button
                key={o.v}
                type="button"
                onClick={() => setPerfLabel(o.v)}
                className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${
                  perfLabel === o.v
                    ? "bg-primary/15 border-primary/40 text-primary"
                    : "bg-card border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {o.l}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-foreground mb-2 font-medium">Copy/legenda (opcional)</label>
          <Textarea
            value={copyText}
            onChange={(e) => setCopyText(e.target.value)}
            placeholder="Cole a copy/headline usada nesse criativo..."
            rows={2}
            className="bg-card border-border focus:border-primary resize-none"
          />
        </div>

        <div>
          <label className="block text-sm text-foreground mb-2 font-medium">Arquivo (imagem ou vídeo)</label>
          <div className="flex items-center gap-3">
            <Input
              type="file"
              accept="image/*,video/*"
              onChange={onFile}
              disabled={uploading}
              className="bg-card border-border file:bg-primary file:text-primary-foreground file:border-0 file:rounded-md file:px-3 file:py-1 file:mr-3 file:text-xs"
            />
            {uploading && <Upload className="w-4 h-4 animate-pulse text-primary" />}
          </div>
        </div>
      </div>

      {items.length > 0 && (
        <div className="space-y-2 mb-8">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{items.length} criativo(s) enviado(s)</p>
          {items.map((it) => (
            <div key={it.id} className="flex items-center gap-3 bg-card border border-border rounded-lg p-3">
              <div className="w-10 h-10 rounded-md bg-orion-surface-2 flex items-center justify-center shrink-0">
                {it.file_type.startsWith("video") ? <FileVideo className="w-4 h-4 text-muted-foreground" /> : <ImageIcon className="w-4 h-4 text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{it.file_name}</p>
                <p className="text-xs text-muted-foreground">
                  {it.performance_label === "winner" && "🏆 Campeão"}
                  {it.performance_label === "current" && "▶ Em uso"}
                  {it.performance_label === "loser" && "✗ Fracassou"}
                </p>
              </div>
              <button onClick={() => remove(it.id, it.file_path)} className="text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-6 border-t border-border">
        <Button variant="ghost" onClick={onBack} className="text-muted-foreground">← Voltar</Button>
        <Button onClick={onNext} className="orion-gradient text-primary-foreground px-6 orion-glow hover:opacity-90">
          {items.length === 0 ? "Pular por enquanto →" : "Próximo bloco →"}
        </Button>
      </div>
    </div>
  );
};
