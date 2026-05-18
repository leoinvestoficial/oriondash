import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff, ExternalLink } from "lucide-react";

interface CredentialsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  platform: string;
  platformName: string;
  userId: string;
  onSaved: () => void;
}

const PLATFORM_FIELDS: Record<string, { fields: { key: string; label: string; placeholder: string; secret?: boolean }[]; helpUrl: string; helpText: string }> = {
  meta_ads: {
    fields: [
      { key: "client_id", label: "App ID", placeholder: "Ex: 123456789012345" },
      { key: "client_secret", label: "App Secret", placeholder: "Ex: abc123def456...", secret: true },
    ],
    helpUrl: "https://developers.facebook.com/apps/",
    helpText: "Crie um app em Meta for Developers → Configurações → Básico para obter o App ID e App Secret.",
  },
  google_ads: {
    fields: [
      { key: "client_id", label: "Client ID", placeholder: "Ex: 123456789.apps.googleusercontent.com" },
      { key: "client_secret", label: "Client Secret", placeholder: "Ex: GOCSPX-...", secret: true },
      { key: "developer_token", label: "Developer Token", placeholder: "Ex: aBcDeFgHiJkLmN", secret: true },
    ],
    helpUrl: "https://console.cloud.google.com/apis/credentials",
    helpText: "Crie credenciais OAuth 2.0 no Google Cloud Console e obtenha o Developer Token no Google Ads.",
  },
  tiktok_ads: {
    fields: [
      { key: "client_id", label: "App ID", placeholder: "Ex: 7123456789012345678" },
      { key: "client_secret", label: "App Secret", placeholder: "Ex: abc123...", secret: true },
    ],
    helpUrl: "https://business-api.tiktok.com/portal/apps",
    helpText: "Crie um app no TikTok for Business → My Apps para obter o App ID e Secret.",
  },
};

export const CredentialsDialog = ({ open, onOpenChange, platform, platformName, userId, onSaved }: CredentialsDialogProps) => {
  const config = PLATFORM_FIELDS[platform];
  const [values, setValues] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadExisting = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("oauth_credentials")
      .select("client_id, client_secret, extra_config")
      .eq("user_id", userId)
      .eq("platform", platform)
      .maybeSingle();

    if (data) {
      const existing: Record<string, string> = {
        client_id: (data as { client_id?: string }).client_id || "",
        client_secret: (data as { client_secret?: string }).client_secret || "",
      };
      const extra = (data as { extra_config?: Record<string, string> }).extra_config || {};
      Object.keys(extra).forEach(k => { existing[k] = extra[k]; });
      setValues(existing);
    } else {
      setValues({});
    }
    setLoading(false);
  }, [platform, userId]);

  useEffect(() => {
    if (open && platform) {
      loadExisting();
    }
  }, [loadExisting, open, platform]);

  const handleSave = async () => {
    if (!config) return;
    
    const missing = config.fields.filter(f => !values[f.key]?.trim());
    if (missing.length > 0) {
      toast.error(`Preencha: ${missing.map(f => f.label).join(", ")}`);
      return;
    }

    setSaving(true);
    try {
      const extraConfig: Record<string, string> = {};
      config.fields.forEach(f => {
        if (f.key !== "client_id" && f.key !== "client_secret") {
          extraConfig[f.key] = values[f.key].trim();
        }
      });

      const { data: existing } = await supabase
        .from("oauth_credentials")
        .select("id")
        .eq("user_id", userId)
        .eq("platform", platform)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("oauth_credentials")
          .update({
            client_id: values.client_id.trim(),
            client_secret: values.client_secret.trim(),
            extra_config: extraConfig,
            updated_at: new Date().toISOString(),
          })
          .eq("id", (existing as { id: string }).id);
      } else {
        await supabase
          .from("oauth_credentials")
          .insert({
            user_id: userId,
            platform,
            client_id: values.client_id.trim(),
            client_secret: values.client_secret.trim(),
            extra_config: extraConfig,
          });
      }

      toast.success("Credenciais salvas!");
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error((err as Error).message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  if (!config) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Configurar {platformName}</DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">
            Insira as credenciais do seu app OAuth para conectar sua conta.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="space-y-4">
            <a href={config.helpUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-primary hover:underline">
              <ExternalLink className="w-3 h-3" />
              {config.helpText}
            </a>

            {config.fields.map(field => (
              <div key={field.key} className="space-y-1.5">
                <Label className="text-xs text-foreground">{field.label}</Label>
                <div className="relative">
                  <Input
                    type={field.secret && !showSecrets[field.key] ? "password" : "text"}
                    placeholder={field.placeholder}
                    value={values[field.key] || ""}
                    onChange={e => setValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                    className="bg-background border-border text-foreground text-sm pr-10"
                  />
                  {field.secret && (
                    <button
                      type="button"
                      onClick={() => setShowSecrets(prev => ({ ...prev, [field.key]: !prev[field.key] }))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showSecrets[field.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>
            ))}

            <Button onClick={handleSave} disabled={saving} className="w-full orion-gradient text-primary-foreground gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Salvar e continuar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
