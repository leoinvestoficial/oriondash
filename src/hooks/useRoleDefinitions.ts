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
  {
    title: "Head de Marketing",
    description: "Lidera a estratégia, prioridades e rotina do time",
    seniority: "senior",
    area: "leadership",
    responsibilities: "Definir prioridades, aprovar campanhas, alinhar marketing ao negócio",
    tools: "Dashboard, Meta Ads, Google Ads, Analytics, CRM",
  },
  {
    title: "Gestor de Tráfego Pago",
    description: "Opera mídia paga e otimiza campanhas",
    seniority: "pleno",
    area: "performance",
    responsibilities: "Subir campanhas, otimizar budget, analisar CPA/ROAS, testar públicos",
    tools: "Meta Ads, Google Ads, TikTok Ads, GA4",
  },
  {
    title: "Designer / Editor de Vídeo",
    description: "Criação de peças estáticas, motion e UGC",
    seniority: "pleno",
    area: "creative",
    responsibilities: "Produzir peças, adaptar formatos, editar vídeos e criativos de teste",
    tools: "Canva, Figma, Premiere, CapCut",
  },
  {
    title: "Copywriter",
    description: "Responsável por hooks, ofertas e conversão por texto",
    seniority: "pleno",
    area: "creative",
    responsibilities: "Criar anúncios, LPs, e-mails, roteiros e mensagens por persona",
    tools: "Docs, CRM, Research, Orion Studio",
  },
  {
    title: "Social Media",
    description: "Conteúdo orgânico, calendário e comunidade",
    seniority: "junior",
    area: "social",
    responsibilities: "Planejar calendário, publicar conteúdos, responder comunidade",
    tools: "Instagram, TikTok, LinkedIn, Orion Calendar",
  },
  {
    title: "Analista de Dados / BI",
    description: "Leitura de métricas, funil e atribuição",
    seniority: "pleno",
    area: "analytics",
    responsibilities: "Monitorar KPIs, encontrar gargalos, validar hipóteses",
    tools: "GA4, Looker, Sheets, Orion Dashboard",
  },
  {
    title: "SEO / Conteúdo",
    description: "Aquisição orgânica e autoridade",
    seniority: "pleno",
    area: "content",
    responsibilities: "Planejar pautas, otimizar SEO, ampliar tráfego orgânico",
    tools: "Search Console, CMS, Ahrefs, Orion Studio",
  },
  {
    title: "CRM / E-mail",
    description: "Automação, retenção e monetização de base",
    seniority: "pleno",
    area: "crm",
    responsibilities: "Criar fluxos, segmentar base, recuperar carrinho e aumentar LTV",
    tools: "Klaviyo, RD Station, HubSpot, Orion Tasks",
  },
];

export const useRoleDefinitions = () => {
  const { user } = useAuth();
  const { companyDnaId, isOwner } = useUserRole();
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoles = useCallback(async () => {
    if (!companyDnaId) { setLoading(false); return; }
    const { data, error } = await supabase
      .from("company_role_definitions" as any)
      .select("*")
      .eq("company_dna_id", companyDnaId)
      .order("created_at", { ascending: true });
    if (error) console.error("company role definitions fetch error", error);
    setRoles((data as RoleDefinition[]) || []);
    setLoading(false);
  }, [companyDnaId]);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  const create = async (input: RoleDefinitionInput) => {
    if (!user || !companyDnaId) return;
    const { error } = await supabase.from("company_role_definitions" as any).insert({
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
    const { error } = await supabase.from("company_role_definitions" as any).update(patch).eq("id", id);
    if (error) { toast.error("Erro ao atualizar"); return; }
    await fetchRoles();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("company_role_definitions" as any).delete().eq("id", id);
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
    const { error } = await supabase.from("company_role_definitions" as any).insert(inserts);
    if (error) { toast.error("Erro ao popular cargos"); return; }
    toast.success("Cargos sugeridos adicionados");
    await fetchRoles();
  };

  return { roles, loading, isOwner, create, update, remove, seedSuggested, refetch: fetchRoles };
};
