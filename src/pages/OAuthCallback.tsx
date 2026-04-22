import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Conectando sua conta...");

  useEffect(() => {
    const exchangeToken = async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const auth_code = searchParams.get("auth_code"); // TikTok uses auth_code

      if (!state) {
        setStatus("error");
        setMessage("Parâmetros inválidos. Tente novamente.");
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          throw new Error("Faça login novamente para concluir a conexão.");
        }

        const { data, error } = await supabase.functions.invoke("oauth-callback", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: {
            code: code || auth_code,
            state,
            redirectUri: `${window.location.origin}/oauth/callback`,
          },
        });

        if (error) throw error;

        if (data?.success) {
          setStatus("success");
          setMessage(`${data.accountName || data.platform} conectado com sucesso!`);
          toast.success(`✅ ${data.accountName || data.platform} conectado!`);

          // Trigger initial sync
          supabase.functions.invoke("sync-metrics", {
            body: {},
          }).catch(() => {});

          setTimeout(() => navigate("/integrations"), 2000);
        } else {
          throw new Error(data?.error || "Erro desconhecido");
        }
      } catch (err: any) {
        console.error("OAuth callback error:", err);
        setStatus("error");
        setMessage(err.message || "Erro ao conectar. Tente novamente.");
        toast.error("Erro ao conectar conta");
        setTimeout(() => navigate("/integrations"), 3000);
      }
    };

    exchangeToken();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        {status === "loading" && (
          <div className="w-12 h-12 rounded-xl orion-gradient animate-pulse-glow mx-auto" />
        )}
        {status === "success" && (
          <div className="w-12 h-12 rounded-xl bg-orion-success/20 flex items-center justify-center mx-auto text-2xl">
            ✅
          </div>
        )}
        {status === "error" && (
          <div className="w-12 h-12 rounded-xl bg-destructive/20 flex items-center justify-center mx-auto text-2xl">
            ❌
          </div>
        )}
        <p className="text-foreground text-lg font-medium">{message}</p>
        <p className="text-muted-foreground text-sm">Redirecionando...</p>
      </div>
    </div>
  );
};

export default OAuthCallback;
