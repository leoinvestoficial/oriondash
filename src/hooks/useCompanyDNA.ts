import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface CompanyDNARecord {
  id: string;
  user_id: string;
  company_name: string | null;
  dna_data: Record<string, Record<string, string>>;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export const useCompanyDNA = () => {
  const { user } = useAuth();
  const [dna, setDNA] = useState<CompanyDNARecord | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDNA = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    
    const { data, error } = await supabase
      .from("company_dna")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error fetching DNA:", error);
    } else {
      setDNA(data ? { ...data, dna_data: (data.dna_data as Record<string, Record<string, string>>) || {} } : null);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchDNA();
  }, [fetchDNA]);

  const saveDNA = async (
    formData: Record<string, Record<string, string>>,
    completed: boolean = false
  ) => {
    if (!user) return;

    const companyName = formData?.identity?.companyName || null;

    if (dna) {
      const { error } = await supabase
        .from("company_dna")
        .update({
          dna_data: formData,
          company_name: companyName,
          onboarding_completed: completed,
        })
        .eq("id", dna.id);

      if (error) { toast.error("Erro ao salvar DNA"); console.error(error); }
      else { toast.success("Company DNA salvo!"); await fetchDNA(); }
    } else {
      const { error } = await supabase
        .from("company_dna")
        .insert({
          user_id: user.id,
          dna_data: formData,
          company_name: companyName,
          onboarding_completed: completed,
        });

      if (error) { toast.error("Erro ao criar DNA"); console.error(error); }
      else { toast.success("Company DNA criado!"); await fetchDNA(); }
    }
  };

  return { dna, loading, saveDNA, refetch: fetchDNA };
};
