import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Mail, Lock, User } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bem-vindo de volta!");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (error) throw error;
        toast.success("Conta criada! Verifique seu email para confirmar.");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl orion-gradient flex items-center justify-center orion-glow mx-auto">
            <Sparkles className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-display text-foreground">Orion</h1>
          <p className="text-sm text-muted-foreground">
            {isLogin ? "Entre na sua conta" : "Crie sua conta para começar"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground uppercase tracking-wider">Nome completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Seu nome"
                    className="pl-10 bg-orion-surface-2 border-border"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wider">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="pl-10 bg-orion-surface-2 border-border"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wider">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 bg-orion-surface-2 border-border"
                  required
                  minLength={6}
                />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full orion-gradient text-primary-foreground py-3 rounded-xl"
          >
            {loading ? "Carregando..." : isLogin ? "Entrar" : "Criar conta"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {isLogin ? "Não tem conta? " : "Já tem conta? "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary hover:underline"
          >
            {isLogin ? "Criar conta" : "Entrar"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
