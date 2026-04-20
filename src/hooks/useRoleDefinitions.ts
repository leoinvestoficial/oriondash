import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";

export interface RoleDefinition {
  id: string;
  company_dna_id: string;
  title: string;
  description: string | null;
  responsibilities: string | null;
  tools: string | null;
  headcount: number;
  seniority: string | null;
  area: string | null;
  created_at: string;
  updated_at: string;
}

export interface RoleDefinitionInput {
  title: string;
  description?: string;
  responsibilities?: string;
  tools?: string;
  headcount?: number;
  seniority?: string;
  area?: string;
}

export const SUGGESTED_MARKETING_ROLES: RoleDefinitionInput[] = [
  { title: "Head de Marketing", description: "Lidera a estratégia e o time", seniority: "senior" },
  { title: "Gestor de Tráfego Pago", description: "Operação de Meta, Google e TikTok Ads", seniority: "pleno" },
  { title: "Designer / Editor de Vídeo", description: "Criação de peças e edição de UGC", seniority: "pleno" },
  { title: "Copywriter", description: "Texto de anúncios, e-mails e landing pages", seniority: "pleno" },
  { title: "Social Media", description: "Conteúdo orgânico, calendário e comunidade", seniority: "junior" },
  { title: "Analista de Dados / BI", description: "Dashboards, atribuição e funil", seniority: "pleno" },
  { title: "SEO / Conteúdo", description: "Blog, autoridade orgânica e técnica", seniority: "pleno" },
  { title: "CRM / E-mail", description: "Automação, retenção e LTV", seniority: "pleno" },
];

export const useRoleDefinitions = () => {
  const { user } = useAuth();
  const { companyDnaId, isOwner } = useUserRole();
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoles = useCallback(async () => {
    if (!companyDnaId) { setLoading(false); return; }
    const { data, error } = await supabase
      .from("role_definitions")
      .select("*")
      .eq("company_dna_id", companyDnaId)
      .order("created_at", { ascending: true });
    if (error) console.error(error);
    setRoles((data as RoleDefinition[]) || []);
    setLoading(false);
  }, [companyDnaId]);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  const create = async (input: RoleDefinitionInput) => {
    if (!user || !companyDnaId) return;
    const { error } = await supabase.from("role_definitions").insert({
      company_dna_id: companyDnaId,
      created_by: user.id,
      title: input.title,
      description: input.description || null,
      responsibilities: input.responsibilities || null,
      tools: input.tools || null,
      headcount: input.headcount ?? 1,
      seniority: input.seniority || null,
      area: input.area || "marketing",
    });
    if (error) { toast.error("Erro ao criar cargo"); return; }
    toast.success("Cargo adicionado");
    await fetchRoles();
  };

  const update = async (id: string, patch: Partial<RoleDefinitionInput>) => {
    const { error } = await supabase.from("role_definitions").update(patch).eq("id", id);
    if (error) { toast.error("Erro ao atualizar"); return; }
    await fetchRoles();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("role_definitions").delete().eq("id", id);
    if (error) { toast.error("Erro ao remover"); return; }
    toast.success("Cargo removido");
    await fetchRoles();
  };

  const seedSuggested = async () => {
    if (!user || !companyDnaId) return;
    const inserts = SUGGESTED_MARKETING_ROLES.map((r) => ({
      company_dna_id: companyDnaId,
      created_by: user.id,
      title: r.title,
      description: r.description || null,
      seniority: r.seniority || null,
      headcount: 1,
      area: "marketing",
    }));
    const { error } = await supabase.from("role_definitions").insert(inserts);
    if (error) { toast.error("Erro ao popular cargos"); return; }
    toast.success("Cargos sugeridos adicionados");
    await fetchRoles();
  };

  return { roles, loading, isOwner, create, update, remove, seedSuggested, refetch: fetchRoles };
};
