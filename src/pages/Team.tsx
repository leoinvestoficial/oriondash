import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCompanyDNA } from "@/hooks/useCompanyDNA";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useRoleDefinitions } from "@/hooks/useRoleDefinitions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Mail, Copy, Trash2, UserPlus, Users, Crown, Shield, User as UserIcon, Lock, Briefcase } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHelpBanner } from "@/components/help/PageHelpBanner";
import { PAGE_HELP } from "@/lib/pageHelp";

interface Invite {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  status: string;
  token: string;
  expires_at: string;
  created_at: string;
  job_title_id: string | null;
}

interface Member {
  user_id: string;
  role: string;
  job_title_id: string | null;
}

const Team = () => {
  const { user } = useAuth();
  const { dna, loading: dnaLoading } = useCompanyDNA();
  const { isOwner, loading: roleLoading } = useUserRole();
  const { roles: jobRoles } = useRoleDefinitions();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [form, setForm] = useState({ email: "", full_name: "", role: "employee", job_title_id: "" });
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    if (!dna) return;
    const [invRes, memRes] = await Promise.all([
      supabase.from("company_invites").select("*").eq("company_dna_id", dna.id).order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role, job_title_id").eq("company_dna_id", dna.id),
    ]);
    if (invRes.data) setInvites(invRes.data as any);
    if (memRes.data) setMembers(memRes.data as any);
    setLoading(false);
  };

  useEffect(() => { if (dna) fetch(); }, [dna]);

  const handleInvite = async () => {
    if (!form.email || !user || !dna) {
      toast.error("E-mail é obrigatório");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("company_invites").insert({
      company_dna_id: dna.id,
      invited_by: user.id,
      email: form.email,
      full_name: form.full_name || null,
      role: form.role as any,
      job_title_id: form.job_title_id || null,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Erro ao criar convite");
      return;
    }
    toast.success("Convite criado! Copie o link e envie ao funcionário.");
    setForm({ email: "", full_name: "", role: "employee", job_title_id: "" });
    fetch();
  };

  const updateMemberJob = async (userId: string, jobId: string | null) => {
    if (!dna) return;
    const { error } = await supabase
      .from("user_roles")
      .update({ job_title_id: jobId })
      .eq("company_dna_id", dna.id)
      .eq("user_id", userId);
    if (error) { toast.error("Erro ao atribuir cargo"); return; }
    toast.success("Cargo atribuído");
    fetch();
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/invite?token=${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado!");
  };

  const revoke = async (id: string) => {
    await supabase.from("company_invites").update({ status: "revoked" }).eq("id", id);
    toast.success("Convite revogado");
    fetch();
  };

  if (dnaLoading || roleLoading || loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 rounded-lg orion-gradient animate-pulse-glow" />
        </div>
      </AppLayout>
    );
  }

  if (!isOwner) {
    return (
      <AppLayout>
        <div className="p-4 sm:p-6 max-w-2xl mx-auto">
          <PageHelpBanner content={PAGE_HELP.team} />
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-heading text-foreground mb-2">Acesso restrito</h3>
            <p className="text-sm text-muted-foreground">
              Apenas o dono do workspace pode gerenciar a equipe e enviar convites.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const roleIcon = (r: string) => r === "owner" ? <Crown className="w-3 h-3" /> : r === "admin" ? <Shield className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />;
  const jobTitleOf = (id: string | null) => jobRoles.find((r) => r.id === id)?.title || "Sem cargo";

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 space-y-6 max-w-5xl">
        <div>
          <h1 className="text-display text-foreground">Equipe</h1>
          <p className="text-sm text-muted-foreground">Convide funcionários, gerencie acessos e atribua cargos</p>
        </div>

        <PageHelpBanner content={PAGE_HELP.team} />

        {jobRoles.length === 0 && (
          <div className="bg-orion-amber/5 border border-orion-amber/30 rounded-xl p-4 flex items-start gap-3">
            <Briefcase className="w-5 h-5 text-orion-amber shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-foreground font-medium">Nenhum cargo cadastrado ainda</p>
              <p className="text-xs text-muted-foreground mb-2">Defina os cargos do seu time no Company DNA pra atribuir funções aos colaboradores.</p>
              <Link to="/onboarding"><Button size="sm" variant="outline">Ir ao Company DNA →</Button></Link>
            </div>
          </div>
        )}

        {/* Convidar */}
        <div className="bg-card border border-border rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-medium text-foreground">Convidar funcionário</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              placeholder="E-mail"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="bg-orion-surface-2 border-border"
            />
            <Input
              placeholder="Nome (opcional)"
              value={form.full_name}
              onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
              className="bg-orion-surface-2 border-border"
            />
            <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}>
              <SelectTrigger className="bg-orion-surface-2 border-border">
                <SelectValue placeholder="Permissão" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Funcionário</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={form.job_title_id || "none"}
              onValueChange={(v) => setForm((f) => ({ ...f, job_title_id: v === "none" ? "" : v }))}
            >
              <SelectTrigger className="bg-orion-surface-2 border-border">
                <SelectValue placeholder="Cargo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem cargo</SelectItem>
                {jobRoles.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleInvite} disabled={submitting} className="orion-gradient text-primary-foreground gap-2 w-full sm:w-auto">
            <Mail className="w-4 h-4" /> Criar convite
          </Button>
        </div>

        {/* Membros ativos */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" /> Membros ({members.length})
          </h3>
          <div className="grid gap-2">
            {members.map((m) => (
              <div key={m.user_id} className="bg-card border border-border rounded-lg p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary shrink-0">
                    {roleIcon(m.role)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-foreground truncate">{m.user_id === user?.id ? "Você" : m.user_id.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {m.role} • <span className="text-orion-violet-light">{jobTitleOf(m.job_title_id)}</span>
                    </p>
                  </div>
                </div>
                {m.role !== "owner" && jobRoles.length > 0 && (
                  <Select
                    value={m.job_title_id || "none"}
                    onValueChange={(v) => updateMemberJob(m.user_id, v === "none" ? null : v)}
                  >
                    <SelectTrigger className="bg-orion-surface-2 border-border w-full sm:w-48">
                      <SelectValue placeholder="Atribuir cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem cargo</SelectItem>
                      {jobRoles.map((r) => (
                        <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Convites */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3">Convites ({invites.length})</h3>
          {invites.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center text-sm text-muted-foreground">
              Nenhum convite enviado ainda
            </div>
          ) : (
            <div className="grid gap-2">
              {invites.map((inv) => (
                <div key={inv.id} className="bg-card border border-border rounded-lg p-3 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm text-foreground truncate">{inv.email}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                        inv.status === "pending" ? "bg-orion-amber/15 text-orion-amber" :
                        inv.status === "accepted" ? "bg-orion-success/15 text-orion-success" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {inv.status === "pending" ? "Pendente" : inv.status === "accepted" ? "Aceito" : "Revogado"}
                      </span>
                      <span className="text-[10px] text-muted-foreground capitalize">{inv.role}</span>
                      {inv.job_title_id && (
                        <span className="text-[10px] text-orion-violet-light">{jobTitleOf(inv.job_title_id)}</span>
                      )}
                    </div>
                    {inv.full_name && <p className="text-xs text-muted-foreground">{inv.full_name}</p>}
                  </div>
                  {inv.status === "pending" && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => copyLink(inv.token)} className="border-border gap-1 flex-1 sm:flex-none">
                        <Copy className="w-3.5 h-3.5" /> Link
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => revoke(inv.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Team;
