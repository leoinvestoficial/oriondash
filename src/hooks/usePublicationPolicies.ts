import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCompanyDNA } from "@/hooks/useCompanyDNA";
import { toast } from "sonner";
import type { PublicationAutonomyLevel, PublicationChannel, PublicationType } from "@/lib/publicationProviders";
import { parseTimeWindows, formatTimeWindows, type PublicationTimeWindow } from "@/lib/publicationRules";

export interface PublicationPolicyRecord {
  id: string;
  company_id: string | null;
  channel: PublicationChannel;
  publication_type: PublicationType;
  autonomy_level_allowed: PublicationAutonomyLevel;
  requires_approval: boolean;
  approval_role_required: string | null;
  max_daily_posts: number | null;
  max_daily_budget: number | null;
  allowed_time_windows: PublicationTimeWindow[];
  blocked_words: string[];
  required_brand_checks: string[];
  created_by: string;
}

export interface PublicationPolicyForm {
  channel: PublicationChannel;
  publication_type: PublicationType;
  autonomy_level_allowed: PublicationAutonomyLevel;
  requires_approval: boolean;
  approval_role_required: string;
  max_daily_posts: string;
  max_daily_budget: string;
  allowed_time_windows: string;
  blocked_words: string;
  required_brand_checks: string;
}

export const DEFAULT_PUBLICATION_POLICY_FORM: PublicationPolicyForm = {
  channel: "instagram",
  publication_type: "organic_post",
  autonomy_level_allowed: "assisted_execution",
  requires_approval: true,
  approval_role_required: "owner",
  max_daily_posts: "2",
  max_daily_budget: "",
  allowed_time_windows: "09:00-18:00",
  blocked_words: "",
  required_brand_checks: "brand_voice, blocked_words",
};

export const policyToForm = (policy: PublicationPolicyRecord): PublicationPolicyForm => ({
  channel: policy.channel,
  publication_type: policy.publication_type,
  autonomy_level_allowed: policy.autonomy_level_allowed,
  requires_approval: policy.requires_approval,
  approval_role_required: policy.approval_role_required || "",
  max_daily_posts: policy.max_daily_posts != null ? String(policy.max_daily_posts) : "",
  max_daily_budget: policy.max_daily_budget != null ? String(policy.max_daily_budget) : "",
  allowed_time_windows: formatTimeWindows(policy.allowed_time_windows),
  blocked_words: policy.blocked_words.join(", "),
  required_brand_checks: policy.required_brand_checks.join(", "),
});

export const usePublicationPolicies = () => {
  const { user } = useAuth();
  const { dna } = useCompanyDNA();
  const [policies, setPolicies] = useState<PublicationPolicyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(true);

  const fetchPolicies = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("publication_policies")
      .select("*")
      .eq("created_by", user.id)
      .order("channel", { ascending: true });

    if (error) {
      setAvailable(false);
      setPolicies([]);
    } else {
      setAvailable(true);
      setPolicies(((data || []) as PublicationPolicyRecord[]).map((policy) => ({
        ...policy,
        allowed_time_windows: (policy.allowed_time_windows || []) as PublicationTimeWindow[],
        blocked_words: policy.blocked_words || [],
        required_brand_checks: policy.required_brand_checks || [],
      })));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchPolicies(); }, [fetchPolicies]);

  const savePolicy = useCallback(async (form: PublicationPolicyForm, policyId?: string | null) => {
    if (!user) return null;
    const isPaid = form.publication_type === "paid_ad" || form.channel === "meta_ads" || form.channel === "google_ads";
    const payload = {
      company_id: dna?.id ?? null,
      channel: form.channel,
      publication_type: form.publication_type,
      autonomy_level_allowed: form.autonomy_level_allowed,
      requires_approval: isPaid ? true : form.requires_approval,
      approval_role_required: form.approval_role_required || null,
      max_daily_posts: form.max_daily_posts ? Number(form.max_daily_posts) : null,
      max_daily_budget: form.max_daily_budget ? Number(form.max_daily_budget) : null,
      allowed_time_windows: parseTimeWindows(form.allowed_time_windows),
      blocked_words: form.blocked_words.split(",").map((item) => item.trim()).filter(Boolean),
      required_brand_checks: form.required_brand_checks.split(",").map((item) => item.trim()).filter(Boolean),
      created_by: user.id,
    };

    const query = policyId
      ? (supabase as any).from("publication_policies").update(payload).eq("id", policyId).select().single()
      : (supabase as any).from("publication_policies").insert(payload).select().single();
    const { data, error } = await query;
    if (error) {
      toast.error("Erro ao salvar política de publicação");
      return null;
    }
    toast.success("Política de publicação salva");
    await fetchPolicies();
    return data as PublicationPolicyRecord;
  }, [dna?.id, fetchPolicies, user]);

  return { policies, loading, available, savePolicy, refetch: fetchPolicies };
};
