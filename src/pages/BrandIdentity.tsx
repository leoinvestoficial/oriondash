import { useEffect, useState, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Upload, Sparkles, Trash2, Image as ImageIcon, Check, Save } from "lucide-react";

interface UploadedRef {
  kind: "loved" | "competitor_admired" | "logo";
  path: string;        // ex: brand-references/<user>/<file>
  uploaded_at: string;
}

interface BrandVisualProfile {
  id: string;
  user_id: string;
  palette: Record<string, unknown>;
  fonts: Record<string, unknown>;
  mood_keywords: string[];
  visual_style_descriptors: Record<string, unknown>;
  references_uploaded: UploadedRef[];
  vetoed_styles: string[];
  analyzed_at: string | null;
}

const BUCKET = "brand-references";

const emptyDraft = {
  primary: "",
  secondary: "",
  accent: "",
  neutrals: "",
  fontsJson: "{}",
  moodKeywords: "",
  descriptorsJson: "{}",
};

const asPrettyJson = (value: unknown) => JSON.stringify(value || {}, null, 2);

const splitList = (value: string) =>
  value
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);

const BrandIdentity = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<BrandVisualProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [vetoInput, setVetoInput] = useState("");
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState(emptyDraft);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("brand_visual_profile")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) {
      console.error(error);
      toast.error("Falha ao carregar perfil visual");
    }
    setProfile((data as unknown as BrandVisualProfile) ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  useEffect(() => {
    const palette = (profile?.palette ?? {}) as { primary?: string; secondary?: string; accent?: string; neutrals?: string[] };
    setDraft({
      primary: palette.primary ?? "",
      secondary: palette.secondary ?? "",
      accent: palette.accent ?? "",
      neutrals: (palette.neutrals ?? []).join(", "),
      fontsJson: asPrettyJson(profile?.fonts ?? {}),
      moodKeywords: (profile?.mood_keywords ?? []).join(", "),
      descriptorsJson: asPrettyJson(profile?.visual_style_descriptors ?? {}),
    });
  }, [profile]);

  // Gerar signed URLs pra preview das peças carregadas (1h validade)
  useEffect(() => {
    const refs = profile?.references_uploaded ?? [];
    if (refs.length === 0) return;
    let cancelled = false;
    (async () => {
      const next: Record<string, string> = {};
      for (const ref of refs) {
        const [bucket, ...rest] = ref.path.split("/");
        if (bucket !== BUCKET) continue;
        const filePath = rest.join("/");
        const { data } = await supabase.storage.from(bucket).createSignedUrl(filePath, 3600);
        if (data?.signedUrl) next[ref.path] = data.signedUrl;
      }
      if (!cancelled) setSignedUrls(next);
    })();
    return () => { cancelled = true; };
  }, [profile]);

  const handleUpload = async (files: FileList | null, kind: UploadedRef["kind"]) => {
    if (!files || files.length === 0 || !user) return;
    setUploading(true);
    const uploaded: UploadedRef[] = [];
    try {
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop() || "png";
        const filename = `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const filePath = `${user.id}/${filename}`;
        const { error } = await supabase.storage.from(BUCKET).upload(filePath, file, {
          upsert: false,
          contentType: file.type,
        });
        if (error) {
          console.error(error);
          toast.error(`Falha no upload de ${file.name}`);
          continue;
        }
        uploaded.push({
          kind,
          path: `${BUCKET}/${filePath}`,
          uploaded_at: new Date().toISOString(),
        });
      }

      // Persist references_uploaded merge
      const existing = profile?.references_uploaded ?? [];
      const newRefs = [...existing, ...uploaded];
      const { error: upsertError } = await supabase
        .from("brand_visual_profile")
        .upsert({
          user_id: user.id,
          references_uploaded: newRefs,
        }, { onConflict: "user_id" });

      if (upsertError) {
        console.error(upsertError);
        toast.error("Falha ao salvar referência");
      } else {
        toast.success(`${uploaded.length} peça(s) carregada(s)`);
        fetchProfile();
      }
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async (ref: UploadedRef) => {
    if (!user || !profile) return;
    const [bucket, ...rest] = ref.path.split("/");
    const filePath = rest.join("/");
    await supabase.storage.from(bucket).remove([filePath]);
    const newRefs = profile.references_uploaded.filter((r) => r.path !== ref.path);
    await supabase
      .from("brand_visual_profile")
      .update({ references_uploaded: newRefs })
      .eq("user_id", user.id);
    fetchProfile();
  };

  const handleAnalyze = async () => {
    if (!profile || !user) return;
    setAnalyzing(true);
    try {
      const lovedPaths = profile.references_uploaded.filter((r) => r.kind === "loved").map((r) => r.path);
      const competitorPaths = profile.references_uploaded.filter((r) => r.kind === "competitor_admired").map((r) => r.path);
      const logoEntry = profile.references_uploaded.find((r) => r.kind === "logo");
      const logoPath = logoEntry?.path;

      if (lovedPaths.length === 0 && competitorPaths.length === 0 && !logoPath) {
        toast.error("Suba pelo menos 1 peça antes de analisar");
        return;
      }

      const { data, error } = await supabase.functions.invoke("analyze-brand-visuals", {
        body: { loved_paths: lovedPaths, competitor_paths: competitorPaths, logo_path: logoPath },
      });

      if (error) {
        console.error(error);
        toast.error("Falha ao analisar — tente novamente");
        return;
      }

      const result = data as { profile?: BrandVisualProfile; parse_error?: string | null };
      if (result.parse_error) {
        toast.warning("Análise concluída, mas extração estruturada falhou — vou tentar de novo");
      } else {
        toast.success("Identidade visual extraída pelo Orion");
      }
      fetchProfile();
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAddVeto = async () => {
    if (!user || !vetoInput.trim()) return;
    const newVetos = [...(profile?.vetoed_styles ?? []), vetoInput.trim()];
    await supabase
      .from("brand_visual_profile")
      .upsert({ user_id: user.id, vetoed_styles: newVetos }, { onConflict: "user_id" });
    setVetoInput("");
    fetchProfile();
  };

  const handleRemoveVeto = async (idx: number) => {
    if (!user || !profile) return;
    const newVetos = profile.vetoed_styles.filter((_, i) => i !== idx);
    await supabase
      .from("brand_visual_profile")
      .update({ vetoed_styles: newVetos })
      .eq("user_id", user.id);
    fetchProfile();
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    let fonts: Record<string, unknown>;
    let descriptors: Record<string, unknown>;
    try {
      fonts = JSON.parse(draft.fontsJson || "{}");
      descriptors = JSON.parse(draft.descriptorsJson || "{}");
    } catch {
      toast.error("Revise os campos JSON antes de salvar");
      return;
    }

    setSavingProfile(true);
    const palette = {
      primary: draft.primary.trim() || undefined,
      secondary: draft.secondary.trim() || undefined,
      accent: draft.accent.trim() || undefined,
      neutrals: splitList(draft.neutrals),
    };

    const { error } = await supabase
      .from("brand_visual_profile")
      .upsert({
        user_id: user.id,
        palette,
        fonts,
        mood_keywords: splitList(draft.moodKeywords),
        visual_style_descriptors: descriptors,
      }, { onConflict: "user_id" });
    setSavingProfile(false);

    if (error) {
      console.error(error);
      toast.error("Falha ao salvar perfil visual");
      return;
    }

    toast.success("Perfil visual salvo");
    fetchProfile();
  };

  const renderRefGrid = (kind: UploadedRef["kind"], emptyMsg: string) => {
    const refs = (profile?.references_uploaded ?? []).filter((r) => r.kind === kind);
    if (refs.length === 0) {
      return <p className="text-sm text-muted-foreground py-4">{emptyMsg}</p>;
    }
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {refs.map((ref) => (
          <div key={ref.path} className="relative group aspect-square rounded-lg overflow-hidden bg-muted border border-border">
            {signedUrls[ref.path] ? (
              <img src={signedUrls[ref.path]} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <ImageIcon className="w-6 h-6" />
              </div>
            )}
            <button
              onClick={() => handleRemove(ref)}
              className="absolute top-1 right-1 p-1 rounded bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Remover"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  const descriptors = (profile?.visual_style_descriptors ?? {}) as Record<string, unknown>;
  const palette = (profile?.palette ?? {}) as { primary?: string; secondary?: string; accent?: string; neutrals?: string[] };
  const summary = (descriptors.summary as string) || "";
  const styleKeywords = (descriptors.style_keywords as string[]) || profile?.mood_keywords || [];
  const styleReferences = (descriptors.style_references as string[]) || [];
  const commonElements = (descriptors.common_elements as string[]) || [];

  return (
    <AppLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Identidade Visual
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Suba peças que a marca ama, peças de concorrentes admirados e o logo. Em seguida, deixe o Orion extrair
            paleta, mood e estilo. Esse perfil entra como input fixo em toda imagem gerada pelo Studio.
          </p>
        </div>

        {/* Loved */}
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-semibold">Peças que a marca ama</h2>
              <p className="text-xs text-muted-foreground">Anúncios, posts ou peças que você considera a cara da marca.</p>
            </div>
            <label>
              <Button asChild variant="outline" disabled={uploading}>
                <span className="cursor-pointer flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Adicionar
                </span>
              </Button>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handleUpload(e.target.files, "loved")}
              />
            </label>
          </div>
          {renderRefGrid("loved", "Sem peças ainda. Recomendado: 3 a 10.")}
        </section>

        {/* Competitor admired */}
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-semibold">Concorrentes admirados</h2>
              <p className="text-xs text-muted-foreground">Peças de marcas concorrentes que você considera referência.</p>
            </div>
            <label>
              <Button asChild variant="outline" disabled={uploading}>
                <span className="cursor-pointer flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Adicionar
                </span>
              </Button>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handleUpload(e.target.files, "competitor_admired")}
              />
            </label>
          </div>
          {renderRefGrid("competitor_admired", "Sem peças ainda. Recomendado: 3 a 10.")}
        </section>

        {/* Logo */}
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-semibold">Logo</h2>
              <p className="text-xs text-muted-foreground">PNG transparente preferencialmente.</p>
            </div>
            <label>
              <Button asChild variant="outline" disabled={uploading}>
                <span className="cursor-pointer flex items-center gap-2">
                  <Upload className="w-4 h-4" /> Trocar
                </span>
              </Button>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleUpload(e.target.files, "logo")}
              />
            </label>
          </div>
          {renderRefGrid("logo", "Sem logo ainda.")}
        </section>

        {/* Vetos */}
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-base font-semibold mb-2">Estilos vetados</h2>
          <p className="text-xs text-muted-foreground mb-3">Padrões que a marca recusa. Ex: "fundo branco genérico", "stock photo", "mãos segurando produto".</p>
          <div className="flex gap-2 mb-3">
            <Input
              value={vetoInput}
              onChange={(e) => setVetoInput(e.target.value)}
              placeholder="Adicionar veto..."
              onKeyDown={(e) => { if (e.key === "Enter") handleAddVeto(); }}
            />
            <Button onClick={handleAddVeto} disabled={!vetoInput.trim()}>Adicionar</Button>
          </div>
          {(profile?.vetoed_styles ?? []).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {(profile?.vetoed_styles ?? []).map((v, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-destructive/10 text-destructive border border-destructive/30">
                  {v}
                  <button onClick={() => handleRemoveVeto(i)} className="hover:text-destructive/80" aria-label="Remover">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </section>

        {/* Analyze CTA */}
        <section className="rounded-xl border border-primary/30 bg-primary/5 p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-base font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Análise pelo Orion
              </h2>
              <p className="text-xs text-muted-foreground mt-1 max-w-xl">
                Vou olhar suas peças e extrair paleta, composição, iluminação, elementos comuns e estilo de referência —
                tudo isso entra automaticamente como contexto na geração de imagens.
              </p>
              {profile?.analyzed_at && (
                <p className="text-[11px] text-muted-foreground mt-2">
                  Última análise: {new Date(profile.analyzed_at).toLocaleString("pt-BR")}
                </p>
              )}
            </div>
            <Button onClick={handleAnalyze} disabled={analyzing} className="orion-gradient text-primary-foreground">
              {analyzing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
              {analyzing ? "Analisando..." : "Analisar agora"}
            </Button>
          </div>
        </section>

        {/* Manual review */}
        <section className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-base font-semibold">Revisão manual do perfil</h2>
              <p className="text-xs text-muted-foreground mt-1 max-w-xl">
                Ajuste a paleta, o mood e os descriptors antes de usar isso no Studio. A IA sugere; a marca dá a palavra final.
              </p>
            </div>
            <Button onClick={handleSaveProfile} disabled={savingProfile} className="gap-2">
              {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar perfil
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Cor primária</label>
              <Input
                value={draft.primary}
                onChange={(e) => setDraft((prev) => ({ ...prev, primary: e.target.value }))}
                placeholder="#1F3864"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Cor secundária</label>
              <Input
                value={draft.secondary}
                onChange={(e) => setDraft((prev) => ({ ...prev, secondary: e.target.value }))}
                placeholder="#2E75B6"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Cor de destaque</label>
              <Input
                value={draft.accent}
                onChange={(e) => setDraft((prev) => ({ ...prev, accent: e.target.value }))}
                placeholder="#F2A65A"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Neutros</label>
            <Input
              value={draft.neutrals}
              onChange={(e) => setDraft((prev) => ({ ...prev, neutrals: e.target.value }))}
              placeholder="#FFFFFF, #0B0F19"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Mood keywords</label>
            <Input
              value={draft.moodKeywords}
              onChange={(e) => setDraft((prev) => ({ ...prev, moodKeywords: e.target.value }))}
              placeholder="sofisticado, acolhedor, contemporâneo"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Fontes (JSON)</label>
              <Textarea
                value={draft.fontsJson}
                onChange={(e) => setDraft((prev) => ({ ...prev, fontsJson: e.target.value }))}
                className="min-h-[140px] font-mono text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Descriptors visuais (JSON)</label>
              <Textarea
                value={draft.descriptorsJson}
                onChange={(e) => setDraft((prev) => ({ ...prev, descriptorsJson: e.target.value }))}
                className="min-h-[140px] font-mono text-xs"
              />
            </div>
          </div>
        </section>

        {/* Result */}
        {profile?.analyzed_at && (
          <section className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-success" />
              Perfil visual extraído
            </h2>

            {summary && <p className="text-sm text-muted-foreground italic">{summary}</p>}

            {/* Palette */}
            {(palette.primary || palette.secondary || palette.accent) && (
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Paleta</h3>
                <div className="flex gap-2 flex-wrap">
                  {palette.primary && <ColorChip color={palette.primary} label="Primary" />}
                  {palette.secondary && <ColorChip color={palette.secondary} label="Secondary" />}
                  {palette.accent && <ColorChip color={palette.accent} label="Accent" />}
                  {(palette.neutrals ?? []).map((n: string, i: number) => (
                    <ColorChip key={i} color={n} label={`Neutral ${i + 1}`} />
                  ))}
                </div>
              </div>
            )}

            {/* Style keywords */}
            {styleKeywords.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Mood</h3>
                <div className="flex gap-2 flex-wrap">
                  {styleKeywords.map((k: string, i: number) => (
                    <span key={i} className="px-2.5 py-1 rounded-full text-xs bg-primary/10 text-primary border border-primary/20">
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Style references */}
            {styleReferences.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Referências de estilo</h3>
                <ul className="text-sm space-y-1">
                  {styleReferences.map((r: string, i: number) => (
                    <li key={i} className="text-muted-foreground">• {r}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Common elements */}
            {commonElements.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Elementos comuns</h3>
                <div className="flex gap-2 flex-wrap">
                  {commonElements.map((e: string, i: number) => (
                    <span key={i} className="px-2.5 py-1 rounded-full text-xs bg-muted text-foreground border border-border">
                      {e}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </AppLayout>
  );
};

const ColorChip = ({ color, label }: { color: string; label: string }) => (
  <div className="flex flex-col items-center gap-1">
    <div
      className="w-12 h-12 rounded-lg border border-border shadow-sm"
      style={{ background: color }}
      title={`${label}: ${color}`}
    />
    <span className="text-[10px] text-muted-foreground font-mono">{color}</span>
  </div>
);

export default BrandIdentity;
