import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole =
  | "owner"
  | "admin"
  | "employee"
  | "manager"
  | "team"
  | "agency_admin"
  | "agency_operator"
  | "client_viewer";

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
        // No role entry yet — user is the account creator who hasn't finished
        // onboarding. Invited employees always have a user_roles row.
        // Default to "owner" so they see the full interface.
        setRole("owner");
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
    isAdmin: role === "admin" || role === "manager" || role === "agency_admin",
    isEmployee: role === "employee" || role === "team" || role === "agency_operator" || role === "client_viewer",
  };
};
