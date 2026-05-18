// VariantImageGenerator — gera 1-4 imagens via Replicate FLUX pra uma variante criativa.
// Salva paths em creative_variants.generated_images (jsonb).
// Renderiza grid das imagens já geradas com signed URLs.

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Wand2, Image as ImageIcon, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

type ImageFormat = "1:1" | "9:16" | "16:9" | "4:5";
type ModelKey = "schnell" | "dev" | "pro";

interface GeneratedImage {
  path: string;
  created_at: string;
  prompt_preview?: string;
  status?: "draft" | "approved";
  tweak?: string;
}

interface Props {
  variantId: string;
  visualPrompt: string | null;
  generatedImages: GeneratedImage[];
  onUpdated: () => void;
}

export const VariantImageGenerator = ({ variantId, visualPrompt, generatedImages, onUpdated }: Props) => {
  const [generating, setGenerating] = useState(false);
  const [format, setFormat] = useState<ImageFormat>("1:1");
  const [model, setModel] = useState<ModelKey>("schnell");
  const [count, setCount] = useState(3);
  const [tweak, setTweak] = useState("");
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  // Resolve signed URLs pras imagens já geradas (1h validade).
  useEffect(() => {
    if (generatedImages.length === 0) {
      setSignedUrls({});
      return;
    }
    let cancelled = false;
    (async () => {
      const next: Record<string, string> = {};
      for (const img of generatedImages) {
        const [bucket, ...rest] = img.path.split("/");
        if (bucket !== "creative-assets") continue;
        const filePath = rest.join("/");
        const { data } = await supabase.storage.from(bucket).createSignedUrl(filePath, 3600);
        if (data?.signedUrl) next[img.path] = data.signedUrl;
      }
      if (!cancelled) setSignedUrls(next);
    })();
    return () => { cancelled = true; };
  }, [generatedImages]);

  const generateWithPrompt = useCallback(async (prompt: string, requestedCount: number, tweakText?: string) => {
    if (!visualPrompt || visualPrompt.trim().length < 5) {
      toast.error("Esta variante precisa de um visual_prompt antes de gerar imagens");
      return;
    }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: {
          prompt,
          format,
          model,
          count: requestedCount,
          variant_id: variantId,
        },
      });
      if (error) {
        console.error(error);
        toast.error("Falha ao gerar imagens");
        return;
      }
      const result = data as { images?: { path: string }[]; cost_usd?: number };
      if (!result.images || result.images.length === 0) {
        toast.error("Geração não retornou imagens");
        return;
      }

      // Persiste em generated_images (merge com existentes).
      const newEntries: GeneratedImage[] = result.images.map((img) => ({
        path: img.path,
        created_at: new Date().toISOString(),
        prompt_preview: prompt.slice(0, 200),
        status: "draft",
        tweak: tweakText,
      }));
      const merged = [...generatedImages, ...newEntries];

      const { error: updateError } = await supabase
        .from("creative_variants" as any)
        .update({ generated_images: merged })
        .eq("id", variantId);

      if (updateError) {
        console.error(updateError);
        toast.error("Imagens geradas, mas falhou ao salvar — recarregue");
        return;
      }

      toast.success(`${result.images.length} imagem(ns) geradas (US$ ${(result.cost_usd ?? 0).toFixed(3)})`);
      if (tweakText) setTweak("");
      onUpdated();
    } finally {
      setGenerating(false);
    }
  }, [variantId, visualPrompt, generatedImages, format, model, onUpdated]);

  const handleGenerate = useCallback(async () => {
    if (!visualPrompt) return;
    await generateWithPrompt(visualPrompt, count);
  }, [count, generateWithPrompt, visualPrompt]);

  const handleGenerateWithTweak = useCallback(async () => {
    if (!visualPrompt || !tweak.trim()) return;
    await generateWithPrompt(`${visualPrompt}. Ajuste solicitado: ${tweak.trim()}`, 1, tweak.trim());
  }, [generateWithPrompt, tweak, visualPrompt]);

  const handleApprove = async (path: string) => {
    const nextImages = generatedImages.map((img) => ({
      ...img,
      status: img.path === path ? "approved" as const : img.status ?? "draft" as const,
    }));
    const { error } = await supabase
      .from("creative_variants" as any)
      .update({ generated_images: nextImages })
      .eq("id", variantId);
    if (error) {
      toast.error("Falha ao aprovar imagem");
      return;
    }
    toast.success("Imagem aprovada");
    onUpdated();
  };

  const handleRemove = async (path: string) => {
    const [bucket, ...rest] = path.split("/");
    const filePath = rest.join("/");
    await supabase.storage.from(bucket).remove([filePath]);
    const remaining = generatedImages.filter((img) => img.path !== path);
    await supabase
      .from("creative_variants" as any)
      .update({ generated_images: remaining })
      .eq("id", variantId);
    onUpdated();
  };

  return (
    <div className="border-t border-border pt-3 mt-3 space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Imagens
        </span>
        <Select value={format} onValueChange={(v) => setFormat(v as ImageFormat)}>
          <SelectTrigger className="h-7 text-xs w-[80px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1:1">1:1 feed</SelectItem>
            <SelectItem value="9:16">9:16 stories</SelectItem>
            <SelectItem value="16:9">16:9 wide</SelectItem>
            <SelectItem value="4:5">4:5 retrato</SelectItem>
          </SelectContent>
        </Select>
        <Select value={model} onValueChange={(v) => setModel(v as ModelKey)}>
          <SelectTrigger className="h-7 text-xs w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="schnell">Rascunho</SelectItem>
            <SelectItem value="dev">Final</SelectItem>
            <SelectItem value="pro">Premium</SelectItem>
          </SelectContent>
        </Select>
        <Select value={String(count)} onValueChange={(v) => setCount(parseInt(v, 10))}>
          <SelectTrigger className="h-7 text-xs w-[70px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 img</SelectItem>
            <SelectItem value="2">2 img</SelectItem>
            <SelectItem value="3">3 img</SelectItem>
            <SelectItem value="4">4 img</SelectItem>
          </SelectContent>
        </Select>
        <Button
          size="sm"
          variant="outline"
          onClick={handleGenerate}
          disabled={generating || !visualPrompt}
          className="h-7 text-xs gap-1"
        >
          {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
          {generating ? "Gerando..." : "Gerar"}
        </Button>
      </div>

      {generatedImages.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {generatedImages.map((img) => (
            <div
              key={img.path}
              className="relative group aspect-square rounded-md overflow-hidden bg-muted border border-border"
            >
              {signedUrls[img.path] ? (
                <img src={signedUrls[img.path]} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <ImageIcon className="w-5 h-5" />
                </div>
              )}
              {img.status === "approved" && (
                <span className="absolute left-1 top-1 inline-flex items-center gap-1 rounded bg-orion-success/90 px-1.5 py-0.5 text-[10px] text-white">
                  <CheckCircle2 className="w-3 h-3" />
                  OK
                </span>
              )}
              <button
                onClick={() => handleApprove(img.path)}
                className="absolute left-1 bottom-1 px-1.5 py-0.5 rounded text-[10px] bg-orion-success/90 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Aprovar"
              >
                Aprovar
              </button>
              <button
                onClick={() => handleRemove(img.path)}
                className="absolute top-1 right-1 px-1.5 py-0.5 rounded text-[10px] bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remover"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          value={tweak}
          onChange={(event) => setTweak(event.target.value)}
          placeholder="Regenerar com tweak: fundo verde, close mais aberto..."
          className="h-8 text-xs"
        />
        <Button
          size="sm"
          variant="outline"
          onClick={handleGenerateWithTweak}
          disabled={generating || !visualPrompt || !tweak.trim()}
          className="h-8 text-xs whitespace-nowrap"
        >
          Tweak
        </Button>
      </div>

      {generatedImages.length === 0 && !generating && (
        <p className="text-[11px] text-muted-foreground italic">
          {visualPrompt
            ? "Sem imagens geradas. Use o botão acima."
            : "Adicione visual_prompt no brief pra gerar imagens."}
        </p>
      )}
    </div>
  );
};

export default VariantImageGenerator;
