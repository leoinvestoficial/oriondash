import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Link2, Unlink, Sparkles, Shield, RefreshCw, Loader2 } from "lucide-react";

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

  const fetchIntegrations = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("ad_integrations")
      .select("*")
      .eq("user_id", user.id);
    if (data) setIntegrations(data);
    setLoading(false);
  };

  useEffect(() => { fetchIntegrations(); }, [user]);

  const getIntegration = (platform: string) => integrations.find(i => i.platform === platform);

  const handleConnect = async (platform: string) => {
    if (platform === "google_analytics") {
      toast.info("Google Analytics será disponibilizado em breve!", { duration: 3000 });
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
        // Redirect to OAuth provider
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
      const { data, error } = await supabase.functions.invoke("sync-metrics", {
        body: {},
      });
      if (error) throw error;
      toast.success("Métricas sincronizadas!");
      console.log("Sync results:", data);
    } catch (err: any) {
      toast.error("Erro ao sincronizar: " + (err.message || ""));
    } finally {
      setSyncing(false);
    }
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
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncAll}
              disabled={syncing}
              className="gap-2"
            >
              {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Sincronizar métricas
            </Button>
          )}
        </div>

        {/* Info banner */}
        <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-orion-violet-light shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-foreground font-medium mb-1">Como funciona</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Ao conectar suas plataformas, o Orion sincroniza campanhas e métricas automaticamente via OAuth seguro. 
              Cada cliente conecta sua própria conta — o Orion nunca tem acesso a credenciais de outros clientes.
            </p>
          </div>
        </div>

        {/* Platforms grid */}
        <div className="grid grid-cols-2 gap-4">
          {PLATFORMS.map((platform) => {
            const integration = getIntegration(platform.id);
            const isConnected = integration?.status === "connected";
            const isExpired = integration?.status === "expired";
            const isConnecting = connecting === platform.id;

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

                <div className="pt-2">
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

        {/* Security note */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Shield className="w-3.5 h-3.5" />
          <span>OAuth seguro — cada cliente conecta sua própria conta. Tokens criptografados. O Orion só lê dados — nunca altera campanhas sem aprovação.</span>
        </div>
      </div>
    </AppLayout>
  );
};

export default Integrations;
