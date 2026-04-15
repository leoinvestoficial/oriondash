import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Upload, Image, Palette, X } from "lucide-react";
import { toast } from "sonner";

interface BrandAssetsStepProps {
  data: Record<string, string>;
  onUpdate: (key: string, value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const BrandAssetsStep = ({ data, onUpdate, onNext, onBack }: BrandAssetsStepProps) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState<string | null>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const faviconRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File, type: "logo" | "favicon") => {
    if (!user) return;
    setUploading(type);

    const ext = file.name.split(".").pop();
    const path = `${user.id}/${type}.${ext}`;

    const { error } = await supabase.storage
      .from("brand-assets")
      .upload(path, file, { upsert: true });

    if (error) {
      toast.error(`Erro ao fazer upload do ${type}`);
      console.error(error);
    } else {
      const { data: urlData } = supabase.storage
        .from("brand-assets")
        .getPublicUrl(path);
      onUpdate(`${type}_url`, urlData.publicUrl);
      toast.success(`${type === "logo" ? "Logo" : "Favicon"} salvo!`);
    }
    setUploading(null);
  };

  const brandColors = (data.brand_colors || "").split(",").map(c => c.trim()).filter(Boolean);

  const addColor = (color: string) => {
    const colors = [...brandColors, color];
    onUpdate("brand_colors", colors.join(","));
  };

  const removeColor = (index: number) => {
    const colors = brandColors.filter((_, i) => i !== index);
    onUpdate("brand_colors", colors.join(","));
  };

  const filledCount = [data.logo_url, data.favicon_url, data.brand_colors, data.primary_font].filter(Boolean).length;

  return (
    <div className="max-w-2xl w-full mx-auto animate-fade-in">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="w-10 h-10 rounded-xl orion-gradient flex items-center justify-center text-lg text-primary-foreground">
            <Palette className="w-5 h-5" />
          </span>
          <div>
            <p className="text-xs text-muted-foreground font-mono">IDENTIDADE VISUAL</p>
            <h2 className="text-display text-foreground">Marca & Visual</h2>
          </div>
        </div>
        <p className="text-muted-foreground">
          Envie o logo, favicon e defina as cores da sua marca para o Orion usar em criativos.
        </p>
        <div className="mt-4 h-1 bg-muted rounded-full overflow-hidden">
          <div className="h-full orion-gradient transition-all duration-500" style={{ width: `${(filledCount / 4) * 100}%` }} />
        </div>
        <p className="text-xs text-muted-foreground mt-1">{filledCount} de 4 campos preenchidos</p>
      </div>

      <div className="space-y-6">
        {/* Logo Upload */}
        <div>
          <label className="block text-sm text-foreground mb-2 font-medium">Logo da empresa</label>
          <input ref={logoRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], "logo")} />
          {data.logo_url ? (
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl bg-orion-surface-2 border border-border flex items-center justify-center overflow-hidden">
                <img src={data.logo_url} alt="Logo" className="max-w-full max-h-full object-contain" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => logoRef.current?.click()}
                  disabled={uploading === "logo"} className="border-border text-muted-foreground">
                  Trocar
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onUpdate("logo_url", "")} className="text-destructive">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <button onClick={() => logoRef.current?.click()} disabled={uploading === "logo"}
              className="w-full h-32 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors">
              {uploading === "logo" ? (
                <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span className="text-sm">Clique para enviar o logo</span>
                  <span className="text-xs">PNG, SVG ou JPG</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Favicon Upload */}
        <div>
          <label className="block text-sm text-foreground mb-2 font-medium">Favicon</label>
          <input ref={faviconRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], "favicon")} />
          {data.favicon_url ? (
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-orion-surface-2 border border-border flex items-center justify-center overflow-hidden">
                <img src={data.favicon_url} alt="Favicon" className="max-w-full max-h-full object-contain" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => faviconRef.current?.click()}
                  disabled={uploading === "favicon"} className="border-border text-muted-foreground">
                  Trocar
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onUpdate("favicon_url", "")} className="text-destructive">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <button onClick={() => faviconRef.current?.click()} disabled={uploading === "favicon"}
              className="w-full h-24 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors">
              {uploading === "favicon" ? (
                <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              ) : (
                <>
                  <Image className="w-5 h-5" />
                  <span className="text-sm">Enviar favicon (ícone da aba)</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Brand Colors */}
        <div>
          <label className="block text-sm text-foreground mb-2 font-medium">Cores da marca</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {brandColors.map((color, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-orion-surface-2 rounded-lg px-2.5 py-1.5 border border-border">
                <div className="w-5 h-5 rounded-md border border-border" style={{ backgroundColor: color }} />
                <span className="text-xs font-mono text-muted-foreground">{color}</span>
                <button onClick={() => removeColor(i)} className="text-muted-foreground hover:text-destructive">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input type="color" className="w-10 h-10 rounded-lg cursor-pointer border border-border bg-transparent"
              onChange={(e) => addColor(e.target.value)} />
            <Input placeholder="Ou digite um hex: #4F46E5" className="bg-orion-surface-2 border-border"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (/^#[0-9A-Fa-f]{3,8}$/.test(val)) {
                    addColor(val);
                    (e.target as HTMLInputElement).value = "";
                  }
                }
              }} />
          </div>
        </div>

        {/* Primary Font */}
        <div>
          <label className="block text-sm text-foreground mb-2 font-medium">Fonte principal da marca</label>
          <Input value={data.primary_font || ""} onChange={(e) => onUpdate("primary_font", e.target.value)}
            placeholder="Ex: Inter, Montserrat, Poppins..."
            className="bg-orion-surface-2 border-border focus:border-primary transition-colors" />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-10 pt-6 border-t border-border">
        <Button variant="ghost" onClick={onBack} className="text-muted-foreground">← Voltar</Button>
        <Button onClick={onNext} className="orion-gradient text-primary-foreground px-6 orion-glow hover:opacity-90 transition-opacity">
          Próximo bloco →
        </Button>
      </div>
    </div>
  );
};
