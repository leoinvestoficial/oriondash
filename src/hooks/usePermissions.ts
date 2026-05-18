import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface MemberInfo {
  id: string;
  role_id: string;
  role_label: string;
  name: string | null;
  email: string | null;
  department: string | null;
  seniority: string | null;
  company_dna_id: string | null;
  custom_permissions: Record<string, boolean>;
}

export interface Permission {
  permission_id: string;
  scope: string;
  company_dna_id: string;
}

export interface UsePermissionsReturn {
  permissions: Permission[];
  memberInfo: MemberInfo | null;
  can: (permissionId: string) => boolean;
  canInScope: (
    permissionId: string,
    scope: "company" | "team" | "department" | "assigned" | "own"
  ) => boolean;
  loading: boolean;
  refetch: () => void;
}

// All permission IDs — used as the fallback for owners without an org row yet
const ALL_PERMISSIONS: string[] = [
  "dashboard.view",
  "cerebro.view",
  "cerebro.interact",
  "diagnostico.view",
  "decisoes.view",
  "decisoes.apply",
  "strategy.view",
  "strategy.edit",
  "intelligence.view",
  "funnels.view",
  "funnels.create",
  "funnels.edit",
  "funnels.approve",
  "campaigns.view",
  "campaigns.create",
  "campaigns.edit",
  "campaigns.approve",
  "calendar.view",
  "calendar.create",
  "calendar.edit",
  "approvals.view",
  "approvals.approve",
  "studio.view",
  "studio.create",
  "personas.view",
  "brand_identity.view",
  "brand_identity.edit",
  "clients.view",
  "clients.edit",
  "tasks.view",
  "tasks.assign",
  "tasks.complete",
  "team.view",
  "team.manage",
  "integrations.view",
  "integrations.manage",
  "metrics.view",
  "metrics.financial.view",
  "governance.view",
  "governance.manage",
  "settings.view",
  "onboarding.view",
];

const OWNER_FALLBACK_PERMISSIONS: Permission[] = ALL_PERMISSIONS.map((id) => ({
  permission_id: id,
  scope: "company",
  company_dna_id: "",
}));

export const usePermissions = (): UsePermissionsReturn => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [memberInfo, setMemberInfo] = useState<MemberInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!user) {
      setPermissions([]);
      setMemberInfo(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);

      // Fetch effective permissions via RPC
      const { data: permsData } = await supabase.rpc(
        "get_effective_permissions",
        { _user_id: user.id }
      );

      // Fetch member info joined with role label
      const { data: memberData } = await supabase
        .from("organization_members")
        .select(
          "id, role_id, name, email, department, seniority, company_dna_id, custom_permissions, role_definitions(label)"
        )
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (cancelled) return;

      if (!permsData || permsData.length === 0) {
        // No org row yet — treat as owner (pre-onboarding)
        setPermissions(OWNER_FALLBACK_PERMISSIONS);
        setMemberInfo(null);
      } else {
        setPermissions(
          (permsData as { permission_id: string; scope: string; company_dna_id: string }[]).map(
            (p) => ({
              permission_id: p.permission_id,
              scope: p.scope,
              company_dna_id: p.company_dna_id,
            })
          )
        );

        if (memberData) {
          const roleDefinitions = memberData.role_definitions as
            | { label: string }
            | null;
          const rawCustom =
            (memberData.custom_permissions as Record<string, boolean> | null) ??
            {};
          setMemberInfo({
            id: memberData.id,
            role_id: memberData.role_id,
            role_label: roleDefinitions?.label ?? memberData.role_id,
            name: memberData.name ?? null,
            email: memberData.email ?? null,
            department: memberData.department ?? null,
            seniority: memberData.seniority ?? null,
            company_dna_id: memberData.company_dna_id ?? null,
            custom_permissions: rawCustom,
          });
        }
      }

      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [user, tick]);

  const can = useCallback(
    (permissionId: string): boolean =>
      permissions.some((p) => p.permission_id === permissionId),
    [permissions]
  );

  const canInScope = useCallback(
    (
      permissionId: string,
      scope: "company" | "team" | "department" | "assigned" | "own"
    ): boolean =>
      permissions.some(
        (p) => p.permission_id === permissionId && p.scope === scope
      ),
    [permissions]
  );

  return { permissions, memberInfo, can, canInScope, loading, refetch };
};
