import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Link2, Unlink, Sparkles, Shield, RefreshCw, Loader2, Settings } from "lucide-react";
import { CredentialsDialog } from "@/components/integrations/CredentialsDialog";
import { PageHelpBanner } from "@/components/help/PageHelpBanner";
import { PAGE_HELP } from "@/lib/pageHelp";

interface Integration {
  id: string;
  platform: string;
  account_name: string | null;
  account_id: string | null;
  status: string;
  updated_at: string;
}

const PLATFORMS = [
  {
    id: "meta_ads",
    name: "Meta Ads",
    icon: "📘",
    description: "Facebook & Instagram Ads — campanhas, métricas e criativos",
    features: ["Sincronização de campanhas", "Métricas em tempo real", "Gestão de públicos", "Criativos e A/B tests"],
  },
  {
    id: "google_ads",
    name: "Google Ads",
    icon: "🔍",
    description: "Search, Display, YouTube & Shopping — performance completa",
    features: ["Campanhas de Search e Display", "Métricas de conversão", "Palavras-chave", "Lances automáticos"],
  },
  {
    id: "google_analytics",
    name: "Google Analytics",
    icon: "📊",
    description: "Dados de tráfego, comportamento e conversões do site",
    features: ["Tráfego por canal", "Funil de conversão", "Comportamento no site", "Atribuição"],
  },
  {
    id: "tiktok_ads",
    name: "TikTok Ads",
    icon: "🎵",
    description: "Campanhas de vídeo curto — alcance e engajamento",
    features: ["Campanhas de vídeo", "Métricas de engajamento", "Públicos", "Criativos"],
  },
];

const Integrations = () => {
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [credentialsDialog, setCredentialsDialog] = useState<{ open: boolean; platform: string; name: string }>({ open: false, platform: "", name: "" });
  const [savedCredentials, setSavedCredentials] = useState<Set<string>>(new Set());

  const fetchIntegrations = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("ad_integrations")
      .select("*")
      .eq("user_id", user.id);
    if (data) setIntegrations(data);
    setLoading(false);
  };

  const fetchCredentials = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("oauth_credentials" as any)
      .select("platform")
      .eq("user_id", user.id);
    if (data) {
      setSavedCredentials(new Set((data as any[]).map((d: any) => d.platform)));
    }
  };

  useEffect(() => {
    fetchIntegrations();
    fetchCredentials();
  }, [user]);

  const getIntegration = (platform: string) => integrations.find(i => i.platform === platform);

  const handleConnect = async (platform: string) => {
    if (platform === "google_analytics") {
      toast.info("Google Analytics será disponibilizado em breve!", { duration: 3000 });
      return;
    }

    // Check if credentials are saved first
    if (!savedCredentials.has(platform)) {
      const p = PLATFORMS.find(pl => pl.id === platform);
      setCredentialsDialog({ open: true, platform, name: p?.name || platform });
      return;
    }

    setConnecting(platform);
    try {
      const redirectUri = `${window.location.origin}/oauth/callback`;
      
      const { data, error } = await supabase.functions.invoke("oauth-initiate", {
        body: { platform, redirectUri },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else if (data?.error) {
        toast.error(data.error);
      }
    } catch (err: any) {
      console.error("Connect error:", err);
      toast.error(err.message || "Erro ao iniciar conexão");
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (id: string) => {
    const { error } = await supabase
      .from("ad_integrations")
      .update({ status: "disconnected", access_token: null, refresh_token: null })
      .eq("id", id);
    if (error) toast.error("Erro ao desconectar");
    else { toast.success("Desconectado"); fetchIntegrations(); }
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-metrics", { body: {} });
      if (error) throw error;
      toast.success("Métricas sincronizadas!");
    } catch (err: any) {
      toast.error("Erro ao sincronizar: " + (err.message || ""));
    } finally {
      setSyncing(false);
    }
  };

  const handleCredentialsSaved = () => {
    fetchCredentials();
    // Auto-trigger connect after saving credentials
    setTimeout(() => {
      handleConnect(credentialsDialog.platform);
    }, 500);
  };

  const hasConnected = integrations.some(i => i.status === "connected");

  if (loading) {
    return <AppLayout><div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 rounded-lg orion-gradient animate-pulse-glow" /></div></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-display text-foreground">Integrações</h1>
            <p className="text-sm text-muted-foreground">
              Conecte suas plataformas de Ads para o Orion analisar métricas reais e otimizar campanhas
            </p>
          </div>
          {hasConnected && (
            <Button variant="outline" size="sm" onClick={handleSyncAll} disabled={syncing} className="gap-2">
              {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Sincronizar métricas
            </Button>
          )}
        </div>

        <PageHelpBanner content={PAGE_HELP.integrations} />

        <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-orion-violet-light shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-foreground font-medium mb-1">Como funciona</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              1. Configure as credenciais do seu app OAuth (App ID e Secret de cada plataforma).<br />
              2. Clique em Conectar — você será redirecionado para autorizar o acesso.<br />
              3. O Orion sincroniza campanhas e métricas automaticamente.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {PLATFORMS.map((platform) => {
            const integration = getIntegration(platform.id);
            const isConnected = integration?.status === "connected";
            const isExpired = integration?.status === "expired";
            const isConnecting = connecting === platform.id;
            const hasCredentials = savedCredentials.has(platform.id);

            return (
              <div key={platform.id} className={cn(
                "bg-card border rounded-xl p-5 space-y-4 transition-colors",
                isConnected ? "border-orion-success/30" : isExpired ? "border-orion-warning/30" : "border-border"
              )}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{platform.icon}</span>
                    <div>
                      <h3 className="text-sm text-foreground font-medium">{platform.name}</h3>
                      {isConnected && integration?.account_name && (
                        <p className="text-[10px] text-orion-success">✓ {integration.account_name}</p>
                      )}
                      {isExpired && (
                        <p className="text-[10px] text-orion-warning">⚠ Token expirado — reconecte</p>
                      )}
                      {!isConnected && !isExpired && hasCredentials && (
                        <p className="text-[10px] text-primary">✓ Credenciais configuradas</p>
                      )}
                    </div>
                  </div>
                  {isConnected ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-orion-success/15 text-orion-success">Conectado</span>
                  ) : isExpired ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-orion-warning/15 text-orion-warning">Expirado</span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Desconectado</span>
                  )}
                </div>

                <p className="text-xs text-muted-foreground">{platform.description}</p>

                <ul className="space-y-1.5">
                  {platform.features.map((f, i) => (
                    <li key={i} className="text-xs text-muted-foreground flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                      {f}
                    </li>
                  ))}
                </ul>

                {integration?.status === "connected" && integration.updated_at && (
                  <p className="text-[10px] text-muted-foreground">
                    Última sync: {new Date(integration.updated_at).toLocaleString("pt-BR")}
                  </p>
                )}

                <div className="pt-2 space-y-2">
                  {platform.id !== "google_analytics" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCredentialsDialog({ open: true, platform: platform.id, name: platform.name })}
                      className="text-muted-foreground gap-2 w-full text-xs h-8"
                    >
                      <Settings className="w-3 h-3" />
                      {hasCredentials ? "Editar credenciais" : "Configurar credenciais"}
                    </Button>
                  )}

                  {isConnected ? (
                    <Button variant="outline" size="sm" onClick={() => handleDisconnect(integration!.id)}
                      className="border-border text-muted-foreground gap-2 w-full">
                      <Unlink className="w-3.5 h-3.5" /> Desconectar
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => handleConnect(platform.id)}
                      disabled={isConnecting}
                      className="orion-gradient text-primary-foreground gap-2 w-full">
                      {isConnecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
                      {isExpired ? "Reconectar" : "Conectar"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Shield className="w-3.5 h-3.5" />
          <span>OAuth seguro — cada cliente conecta sua própria conta com suas próprias credenciais. Tokens criptografados.</span>
        </div>
      </div>

      <CredentialsDialog
        open={credentialsDialog.open}
        onOpenChange={(open) => setCredentialsDialog(prev => ({ ...prev, open }))}
        platform={credentialsDialog.platform}
        platformName={credentialsDialog.name}
        userId={user?.id || ""}
        onSaved={handleCredentialsSaved}
      />
    </AppLayout>
  );
};

export default Integrations;
