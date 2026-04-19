import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole = "owner" | "admin" | "employee";

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [companyDnaId, setCompanyDnaId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setCompanyDnaId(null);
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("user_roles")
        .select("role, company_dna_id")
        .eq("user_id", user.id)
        .order("role", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (data) {
        setRole(data.role as AppRole);
        setCompanyDnaId(data.company_dna_id);
      } else {
        setRole(null);
        setCompanyDnaId(null);
      }
      setLoading(false);
    })();
  }, [user]);

  return {
    role,
    companyDnaId,
    loading,
    isOwner: role === "owner",
    isAdmin: role === "admin",
    isEmployee: role === "employee",
  };
};
