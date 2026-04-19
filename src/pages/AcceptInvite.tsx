import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const AcceptInvite = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [invite, setInvite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = params.get("token");

  useEffect(() => {
    if (!token) {
      setError("Token de convite ausente");
      setLoading(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("company_invites")
        .select("*, company_dna:company_dna_id(company_name)")
        .eq("token", token)
        .maybeSingle();
      if (!data) setError("Convite não encontrado ou inválido");
      else if (data.status !== "pending") setError("Este convite já foi usado ou foi revogado");
      else if (new Date(data.expires_at).getTime() < Date.now()) setError("Este convite expirou");
      else setInvite(data);
      setLoading(false);
    })();
  }, [token]);

  const accept = async () => {
    if (!user) {
      navigate(`/auth?redirect=${encodeURIComponent(`/invite?token=${token}`)}`);
      return;
    }
    setAccepting(true);
    const { data, error } = await supabase.functions.invoke("accept-invite", {
      body: { token },
    });
    if (error || data?.error) {
      toast.error(data?.error || "Erro ao aceitar convite");
      setAccepting(false);
      return;
    }
    toast.success("Você entrou na empresa!");
    setTimeout(() => navigate("/dashboard"), 600);
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="bg-card border border-border rounded-2xl p-8 max-w-md w-full text-center">
        {error ? (
          <>
            <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-destructive" />
            </div>
            <h1 className="text-heading text-foreground mb-2">Convite inválido</h1>
            <p className="text-sm text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => navigate("/")} variant="outline">Voltar</Button>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-2xl orion-gradient flex items-center justify-center mx-auto mb-4 orion-glow">
              <CheckCircle2 className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="text-heading text-foreground mb-2">Você foi convidado</h1>
            <p className="text-sm text-muted-foreground mb-1">
              para entrar em <b className="text-foreground">{invite?.company_dna?.company_name || "Empresa"}</b>
            </p>
            <p className="text-xs text-muted-foreground mb-6">como {invite?.role}</p>

            {!user && (
              <p className="text-xs text-muted-foreground mb-4 p-3 rounded-lg bg-muted/30">
                Você precisa fazer login ou criar uma conta com o e-mail <b>{invite?.email}</b> para aceitar.
              </p>
            )}

            <Button
              onClick={accept}
              disabled={accepting}
              className="orion-gradient text-primary-foreground w-full gap-2"
            >
              {accepting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {user ? "Aceitar convite" : "Login e aceitar"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default AcceptInvite;
