import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  ShieldCheck,
  Plus,
  ChevronRight,
  ChevronDown,
  X,
  Save,
  Loader2,
  User as UserIcon,
  Mail,
  Building2,
  Layers,
  BadgeCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SystemRole {
  id: string;
  label: string;
  description: string | null;
}

interface OrgMember {
  id: string;
  user_id: string | null;
  role_id: string;
  name: string | null;
  email: string | null;
  department: string | null;
  seniority: string | null;
  reports_to: string | null;
  status: string;
  custom_permissions: Record<string, boolean>;
  company_dna_id: string;
}

interface PermissionCatalogItem {
  id: string;
  label: string;
  category: string;
}

interface RolePermissionRow {
  role_id: string;
  permission_id: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SENIORITY_OPTIONS = ["Junior", "Pleno", "Sênior", "Lead"];

const ROLE_COLORS: Record<string, string> = {
  owner: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  admin: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  gestor: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  gestor_trafego: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  designer: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  copywriter: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  financeiro: "bg-green-500/20 text-green-400 border-green-500/30",
  social_media: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  employee: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

function getRoleColor(roleId: string): string {
  return ROLE_COLORS[roleId] ?? ROLE_COLORS.employee;
}

// ─── CSV / Bulk Import ────────────────────────────────────────────────────────

interface ParsedImportRow {
  name: string;
  email: string;
  role_id: string;
  department: string;
  seniority: string;
  reports_to_email: string;
  error?: string;
}

const VALID_ROLES = new Set([
  "admin", "gestor", "gestor_trafego", "designer",
  "copywriter", "financeiro", "social_media", "employee",
]);

// Normalizes common role aliases to canonical IDs
function normalizeRole(raw: string): string {
  const lower = raw.toLowerCase().trim().replace(/\s+/g, "_");
  const aliases: Record<string, string> = {
    owner: "owner",
    admin: "admin",
    gestor: "gestor",
    manager: "gestor",
    gerente: "gestor",
    gestor_de_trafego: "gestor_trafego",
    traffic: "gestor_trafego",
    trafego: "gestor_trafego",
    designer: "designer",
    design: "designer",
    copywriter: "copywriter",
    copy: "copywriter",
    financeiro: "financeiro",
    financeiro_contabil: "financeiro",
    finance: "financeiro",
    social_media: "social_media",
    social: "social_media",
    redes_sociais: "social_media",
    employee: "employee",
    funcionario: "employee",
    colaborador: "employee",
  };
  return aliases[lower] ?? lower;
}

// Parses CSV or tab-separated or newline-per-person text
// Expected columns (flexible order via header): name, email, role, department, seniority, reports_to
// Also supports no-header format: "name,email,role" per line
function parseBulkImportText(text: string): ParsedImportRow[] {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  // Detect separator
  const sep = lines[0].includes("\t") ? "\t" : ",";

  // Check if first line is a header
  const firstLower = lines[0].toLowerCase();
  const hasHeader =
    firstLower.includes("name") || firstLower.includes("email") || firstLower.includes("nome");

  const dataLines = hasHeader ? lines.slice(1) : lines;
  const headerLine = hasHeader ? lines[0].split(sep).map((h) => h.trim().toLowerCase()) : null;

  const colIndex = (names: string[]) => {
    if (!headerLine) return -1;
    for (const n of names) {
      const idx = headerLine.findIndex((h) => h.includes(n));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const nameIdx = hasHeader ? colIndex(["name", "nome"]) : 0;
  const emailIdx = hasHeader ? colIndex(["email", "e-mail"]) : 1;
  const roleIdx = hasHeader ? colIndex(["role", "cargo", "perfil"]) : 2;
  const deptIdx = hasHeader ? colIndex(["dept", "department", "departamento"]) : 3;
  const seniorityIdx = hasHeader ? colIndex(["seniority", "senioridade", "nivel", "nível"]) : 4;
  const reportsIdx = hasHeader ? colIndex(["reports_to", "gestor", "manager", "reports"]) : 5;

  return dataLines.map((line) => {
    const cols = line.split(sep).map((c) => c.trim().replace(/^["']|["']$/g, ""));
    const get = (idx: number) => (idx >= 0 && idx < cols.length ? cols[idx] : "");

    const email = get(emailIdx);
    const rawRole = get(roleIdx) || "employee";
    const role_id = normalizeRole(rawRole);

    const row: ParsedImportRow = {
      name: get(nameIdx),
      email,
      role_id,
      department: get(deptIdx),
      seniority: get(seniorityIdx),
      reports_to_email: get(reportsIdx),
    };

    if (!email || !email.includes("@")) {
      row.error = "E-mail inválido";
    } else if (!VALID_ROLES.has(role_id)) {
      row.error = `Cargo inválido: "${rawRole}"`;
    }

    return row;
  });
}

function getInitials(name: string | null, email: string | null): string {
  const source = name || email || "?";
  return source
    .split(/[\s@.]+/)
    .filter(Boolean)
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─── MemberNode (recursive organogram) ────────────────────────────────────────

interface MemberNodeProps {
  member: OrgMember;
  allMembers: OrgMember[];
  roles: SystemRole[];
  depth: number;
  onSelect: (m: OrgMember) => void;
}

const MemberNode = ({
  member,
  allMembers,
  roles,
  depth,
  onSelect,
}: MemberNodeProps) => {
  const [expanded, setExpanded] = useState(true);
  const children = allMembers.filter((m) => m.reports_to === member.id);
  const role = roles.find((r) => r.id === member.role_id);

  return (
    <div className={cn("relative", depth > 0 && "ml-6")}>
      {depth > 0 && (
        <span className="absolute left-[-16px] top-[22px] w-4 h-px bg-border" />
      )}
      <div
        className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors cursor-pointer mb-1"
        onClick={() => onSelect(member)}
      >
        {children.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((v) => !v);
            }}
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        )}
        {children.length === 0 && <span className="w-4 shrink-0" />}

        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary shrink-0">
          {getInitials(member.name, member.email)}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {member.name || member.email || "Sem nome"}
          </p>
          {member.email && member.name && (
            <p className="text-[11px] text-muted-foreground truncate">
              {member.email}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {member.department && (
            <span className="text-[10px] text-muted-foreground hidden sm:block">
              {member.department}
            </span>
          )}
          <span
            className={cn(
              "text-[10px] px-2 py-0.5 rounded-full border font-medium",
              getRoleColor(member.role_id)
            )}
          >
            {role?.label ?? member.role_id}
          </span>
          <span
            className={cn(
              "text-[10px] px-1.5 py-0.5 rounded border",
              member.status === "active"
                ? "bg-green-500/10 text-green-400 border-green-500/20"
                : "bg-red-500/10 text-red-400 border-red-500/20"
            )}
          >
            {member.status === "active" ? "Ativo" : "Inativo"}
          </span>
        </div>
      </div>

      {expanded && children.length > 0 && (
        <div className="relative border-l border-border ml-3">
          {children.map((child) => (
            <MemberNode
              key={child.id}
              member={child}
              allMembers={allMembers}
              roles={roles}
              depth={depth + 1}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const Governance = () => {
  const { user } = useAuth();
  const { can, memberInfo } = usePermissions();
  const canManage = can("governance.manage");

  const companyDnaId = memberInfo?.company_dna_id ?? null;

  // Data state
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [systemRoles, setSystemRoles] = useState<SystemRole[]>([]);
  const [permissionCatalog, setPermissionCatalog] = useState<
    PermissionCatalogItem[]
  >([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermissionRow[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  // UI state
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [selectedMember, setSelectedMember] = useState<OrgMember | null>(null);
  const [savingCustom, setSavingCustom] = useState(false);

  // Bulk import state
  const [importText, setImportText] = useState("");
  const [importPreview, setImportPreview] = useState<ParsedImportRow[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [importingBulk, setImportingBulk] = useState(false);

  // Add form state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState("employee");
  const [formDept, setFormDept] = useState("");
  const [formSeniority, setFormSeniority] = useState("");
  const [formReportsTo, setFormReportsTo] = useState("");
  const [formCustomPerms, setFormCustomPerms] = useState<
    Record<string, boolean>
  >({});
  const [submitting, setSubmitting] = useState(false);

  // Custom perms edit state (for selected member panel)
  const [editCustomPerms, setEditCustomPerms] = useState<
    Record<string, boolean>
  >({});

  // ── Fetch helpers ────────────────────────────────────────────────────────

  const fetchAll = useCallback(async () => {
    if (!companyDnaId) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const [membersRes, rolesRes, permsRes, rpRes] = await Promise.all([
      supabase
        .from("organization_members")
        .select("*")
        .eq("company_dna_id", companyDnaId)
        .order("created_at", { ascending: true }),
      supabase
        .from("role_definitions")
        .select("id, label, description")
        .order("id"),
      supabase
        .from("permissions")
        .select("id, label, category")
        .order("category"),
      supabase
        .from("role_permissions")
        .select("role_id, permission_id"),
    ]);

    if (membersRes.data) {
      setMembers(
        membersRes.data.map((m) => ({
          ...m,
          custom_permissions:
            (m.custom_permissions as Record<string, boolean> | null) ?? {},
        }))
      );
    }
    if (rolesRes.data) setSystemRoles(rolesRes.data as SystemRole[]);
    if (permsRes.data)
      setPermissionCatalog(permsRes.data as PermissionCatalogItem[]);
    if (rpRes.data) setRolePermissions(rpRes.data as RolePermissionRow[]);

    setLoading(false);
  }, [companyDnaId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (selectedMember) {
      setEditCustomPerms({ ...selectedMember.custom_permissions });
    }
  }, [selectedMember]);

  // ── Add member ───────────────────────────────────────────────────────────

  const handleAddMember = async () => {
    if (!companyDnaId || !user) return;
    if (!formEmail) {
      toast.error("E-mail é obrigatório");
      return;
    }
    setSubmitting(true);
    const { data: inserted, error } = await supabase
      .from("organization_members")
      .insert({
        company_dna_id: companyDnaId,
        user_id: null,
        role_id: formRole,
        name: formName || null,
        email: formEmail,
        department: formDept || null,
        seniority: formSeniority || null,
        reports_to: formReportsTo || null,
        invited_by: user.id,
        status: "active",
        custom_permissions: formCustomPerms,
      })
      .select()
      .single();

    if (error) {
      toast.error("Erro ao adicionar membro: " + error.message);
      setSubmitting(false);
      return;
    }

    // Fire invite (best-effort — edge function may not exist yet)
    try {
      await supabase.functions.invoke("send-invite", {
        body: {
          email: formEmail,
          name: formName,
          role: formRole,
          company_dna_id: companyDnaId,
          member_id: inserted?.id,
        },
      });
    } catch {
      // Ignore — function not deployed yet
    }

    toast.success("Membro adicionado com sucesso!");
    setShowAddForm(false);
    setFormName("");
    setFormEmail("");
    setFormRole("employee");
    setFormDept("");
    setFormSeniority("");
    setFormReportsTo("");
    setFormCustomPerms({});
    setSubmitting(false);
    await fetchAll();
  };

  // ── Bulk import ──────────────────────────────────────────────────────────

  const handleParseImport = () => {
    setImportError(null);
    const rows = parseBulkImportText(importText);
    if (rows.length === 0) {
      setImportError("Nenhum dado encontrado. Verifique o formato.");
      return;
    }
    setImportPreview(rows);
  };

  const handleConfirmImport = async () => {
    if (!companyDnaId || !user || importPreview.length === 0) return;
    const validRows = importPreview.filter((r) => !r.error);
    if (validRows.length === 0) {
      setImportError("Nenhum membro válido para importar.");
      return;
    }
    setImportingBulk(true);

    // Build a map of email → member id for reports_to resolution (include existing members)
    const emailToId: Record<string, string> = {};
    members.forEach((m) => { if (m.email) emailToId[m.email.toLowerCase()] = m.id; });

    // Insert members sequentially to resolve reports_to dependencies
    let successCount = 0;
    let errorCount = 0;

    for (const row of validRows) {
      const reportsToEmail = row.reports_to_email?.toLowerCase();
      const reportsToId = reportsToEmail ? emailToId[reportsToEmail] ?? null : null;

      const { data: inserted, error } = await supabase
        .from("organization_members")
        .insert({
          company_dna_id: companyDnaId,
          user_id: null,
          role_id: row.role_id,
          name: row.name || null,
          email: row.email,
          department: row.department || null,
          seniority: row.seniority || null,
          reports_to: reportsToId,
          invited_by: user.id,
          status: "active",
          custom_permissions: {},
        })
        .select("id, email")
        .single();

      if (error) {
        errorCount++;
      } else {
        successCount++;
        // Register in map for subsequent rows' reports_to resolution
        if (inserted?.email) emailToId[inserted.email.toLowerCase()] = inserted.id;

        // Best-effort invite email
        try {
          await supabase.functions.invoke("send-invite", {
            body: { email: row.email, name: row.name, role: row.role_id, company_dna_id: companyDnaId, member_id: inserted?.id },
          });
        } catch { /* ignore */ }
      }
    }

    setImportingBulk(false);
    setShowImport(false);
    setImportText("");
    setImportPreview([]);
    toast.success(`${successCount} membro(s) importado(s)${errorCount > 0 ? `, ${errorCount} com erro` : ""}!`);
    await fetchAll();
  };

  // ── Save custom permissions ───────────────────────────────────────────────

  const handleSaveCustomPerms = async () => {
    if (!selectedMember) return;
    setSavingCustom(true);
    const { error } = await supabase
      .from("organization_members")
      .update({ custom_permissions: editCustomPerms })
      .eq("id", selectedMember.id);

    if (error) {
      toast.error("Erro ao salvar permissões");
    } else {
      toast.success("Permissões atualizadas");
      setMembers((prev) =>
        prev.map((m) =>
          m.id === selectedMember.id
            ? { ...m, custom_permissions: editCustomPerms }
            : m
        )
      );
      setSelectedMember((prev) =>
        prev ? { ...prev, custom_permissions: editCustomPerms } : null
      );
    }
    setSavingCustom(false);
  };

  // ── Derived data ─────────────────────────────────────────────────────────

  const rootMembers = members.filter((m) => !m.reports_to);

  const categories = Array.from(
    new Set(permissionCatalog.map((p) => p.category))
  ).sort();

  // Roles to show in matrix (exclude owner — all permissions)
  const matrixRoles = systemRoles.filter((r) => r.id !== "owner");

  // Count permissions per system role
  const rolePermCount = (roleId: string) =>
    rolePermissions.filter((rp) => rp.role_id === roleId).length;

  // Check if role has any permission in a category
  const roleHasCategoryPerm = (roleId: string, category: string) => {
    const catPerms = permissionCatalog
      .filter((p) => p.category === category)
      .map((p) => p.id);
    return rolePermissions.some(
      (rp) => rp.role_id === roleId && catPerms.includes(rp.permission_id)
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!companyDnaId) {
    return (
      <AppLayout>
        <div className="p-8 text-center text-muted-foreground">
          <ShieldCheck className="w-10 h-10 mx-auto mb-4 opacity-40" />
          <p className="text-sm">
            Complete o onboarding para acessar a governança.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-8">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-semibold text-foreground">
                Governança
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Gerencie a hierarquia, cargos e permissões da sua empresa
            </p>
          </div>
          {canManage && (
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setShowImport((v) => !v); setShowAddForm(false); }}
                className="shrink-0 gap-1"
              >
                {showImport ? <X className="w-3.5 h-3.5" /> : <Layers className="w-3.5 h-3.5" />}
                {showImport ? "Cancelar" : "Importar lista"}
              </Button>
              <Button
                size="sm"
                onClick={() => { setShowAddForm((v) => !v); setShowImport(false); }}
                className="shrink-0"
              >
                {showAddForm ? (
                  <><X className="w-4 h-4 mr-1" />Cancelar</>
                ) : (
                  <><Plus className="w-4 h-4 mr-1" />Adicionar membro</>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* ── Bulk import panel ───────────────────────────────────────────── */}
        {showImport && canManage && (
          <div className="border border-border rounded-xl p-5 bg-card space-y-4">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              Importar hierarquia em lote
            </h2>
            <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Formato aceito (CSV ou colagem):</p>
              <p>Coluna obrigatória: <code className="text-primary">email</code></p>
              <p>Colunas opcionais: <code>nome, cargo, departamento, senioridade, gestor</code></p>
              <p>Cargos válidos: <code>admin, gestor, gestor_trafego, designer, copywriter, financeiro, social_media, employee</code></p>
              <p className="pt-1">Exemplo:</p>
              <pre className="bg-muted rounded p-2 text-[10px] leading-relaxed">
{`nome,email,cargo,departamento,senioridade,gestor
Ana Silva,ana@empresa.com,gestor,Marketing,Sênior,
Bruno Costa,bruno@empresa.com,designer,Criação,Pleno,ana@empresa.com`}
              </pre>
            </div>

            <textarea
              className="w-full h-40 text-xs font-mono bg-muted/30 border border-border rounded-lg p-3 text-foreground placeholder:text-muted-foreground resize-y focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Cole aqui sua planilha, CSV ou lista de membros..."
              value={importText}
              onChange={(e) => { setImportText(e.target.value); setImportPreview([]); setImportError(null); }}
            />

            {importError && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <BadgeCheck className="w-3.5 h-3.5 shrink-0" />
                {importError}
              </p>
            )}

            {importPreview.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-foreground">
                  Prévia — {importPreview.filter((r) => !r.error).length} válidos, {importPreview.filter((r) => r.error).length} com erro
                </p>
                <div className="max-h-56 overflow-y-auto rounded-lg border border-border divide-y divide-border">
                  {importPreview.map((row, i) => (
                    <div key={i} className={cn("px-3 py-2 text-xs flex items-start gap-3", row.error ? "bg-destructive/5" : "bg-card")}>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-foreground">{row.name || row.email}</span>
                        {row.name && <span className="text-muted-foreground ml-1">({row.email})</span>}
                        <span className={cn("ml-2 px-1.5 py-0.5 rounded-full text-[10px] border font-medium", getRoleColor(row.role_id))}>
                          {row.role_id}
                        </span>
                        {row.department && <span className="text-muted-foreground ml-1">· {row.department}</span>}
                        {row.reports_to_email && <span className="text-muted-foreground ml-1">→ {row.reports_to_email}</span>}
                      </div>
                      {row.error && <span className="text-destructive shrink-0">{row.error}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              {importPreview.length === 0 ? (
                <Button size="sm" onClick={handleParseImport} disabled={!importText.trim()}>
                  Pré-visualizar
                </Button>
              ) : (
                <>
                  <Button
                    size="sm"
                    onClick={handleConfirmImport}
                    disabled={importingBulk || importPreview.filter((r) => !r.error).length === 0}
                    className="orion-gradient text-primary-foreground"
                  >
                    {importingBulk ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                    Confirmar importação ({importPreview.filter((r) => !r.error).length})
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setImportPreview([]); setImportError(null); }}>
                    Editar
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Add member form ─────────────────────────────────────────────── */}
        {showAddForm && canManage && (
          <div className="border border-border rounded-xl p-5 bg-card space-y-4">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-primary" />
              Novo membro
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Nome
                </label>
                <Input
                  placeholder="Nome completo"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  E-mail *
                </label>
                <Input
                  type="email"
                  placeholder="email@empresa.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Cargo
                </label>
                <Select value={formRole} onValueChange={setFormRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {systemRoles
                      .filter((r) => r.id !== "owner")
                      .map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Departamento
                </label>
                <Input
                  placeholder="Ex: Marketing, Vendas"
                  value={formDept}
                  onChange={(e) => setFormDept(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Senioridade
                </label>
                <Select
                  value={formSeniority}
                  onValueChange={setFormSeniority}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {SENIORITY_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Gestor direto
                </label>
                <Select
                  value={formReportsTo}
                  onValueChange={setFormReportsTo}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Nenhum (raiz)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum (raiz)</SelectItem>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name || m.email || m.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Custom permissions checkboxes */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Permissões personalizadas (adicionais ao cargo)
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {permissionCatalog.map((p) => (
                  <label
                    key={p.id}
                    className="flex items-center gap-2 text-xs text-foreground cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={!!formCustomPerms[p.id]}
                      onChange={(e) =>
                        setFormCustomPerms((prev) => ({
                          ...prev,
                          [p.id]: e.target.checked,
                        }))
                      }
                      className="accent-primary"
                    />
                    {p.label}
                  </label>
                ))}
              </div>
            </div>

            <Button
              onClick={handleAddMember}
              disabled={submitting}
              size="sm"
              className="mt-2"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <Mail className="w-4 h-4 mr-1" />
              )}
              Adicionar e convidar
            </Button>
          </div>
        )}

        {/* ── Organogram + Edit panel ─────────────────────────────────────── */}
        <div className="flex gap-6">
          {/* Organogram */}
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              Organograma ({members.length} membros)
            </h2>
            {members.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
                Nenhum membro cadastrado ainda.
              </div>
            ) : (
              <div className="space-y-1">
                {rootMembers.map((m) => (
                  <MemberNode
                    key={m.id}
                    member={m}
                    allMembers={members}
                    roles={systemRoles}
                    depth={0}
                    onSelect={setSelectedMember}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Edit panel */}
          {selectedMember && (
            <div className="w-80 shrink-0 border border-border rounded-xl bg-card p-4 space-y-4 h-fit">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">
                  {selectedMember.name || selectedMember.email || "Membro"}
                </h3>
                <button
                  onClick={() => setSelectedMember(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1 text-xs text-muted-foreground">
                <p>
                  <span className="font-medium text-foreground">Cargo: </span>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full border text-[10px] font-medium",
                      getRoleColor(selectedMember.role_id)
                    )}
                  >
                    {systemRoles.find((r) => r.id === selectedMember.role_id)
                      ?.label ?? selectedMember.role_id}
                  </span>
                </p>
                {selectedMember.department && (
                  <p>
                    <span className="font-medium text-foreground">
                      Departamento:{" "}
                    </span>
                    {selectedMember.department}
                  </p>
                )}
                {selectedMember.seniority && (
                  <p>
                    <span className="font-medium text-foreground">
                      Senioridade:{" "}
                    </span>
                    {selectedMember.seniority}
                  </p>
                )}
              </div>

              <div>
                <p className="text-xs font-medium text-foreground mb-2">
                  Permissões do cargo
                </p>
                <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                  {rolePermissions
                    .filter((rp) => rp.role_id === selectedMember.role_id)
                    .map((rp) => {
                      const perm = permissionCatalog.find(
                        (p) => p.id === rp.permission_id
                      );
                      return (
                        <div
                          key={rp.permission_id}
                          className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
                        >
                          <BadgeCheck className="w-3 h-3 text-primary shrink-0" />
                          {perm?.label ?? rp.permission_id}
                        </div>
                      );
                    })}
                </div>
              </div>

              {canManage && (
                <div>
                  <p className="text-xs font-medium text-foreground mb-2">
                    Permissões personalizadas
                  </p>
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {permissionCatalog.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between gap-2"
                      >
                        <span className="text-[11px] text-muted-foreground flex-1">
                          {p.label}
                        </span>
                        <Switch
                          checked={!!editCustomPerms[p.id]}
                          onCheckedChange={(checked) =>
                            setEditCustomPerms((prev) => ({
                              ...prev,
                              [p.id]: checked,
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                  <Button
                    size="sm"
                    className="w-full mt-3"
                    onClick={handleSaveCustomPerms}
                    disabled={savingCustom}
                  >
                    {savingCustom ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    ) : (
                      <Save className="w-4 h-4 mr-1" />
                    )}
                    Salvar permissões
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Role descriptions ───────────────────────────────────────────── */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary" />
            Cargos do sistema
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {systemRoles
              .filter((r) => r.id !== "owner")
              .map((role) => (
                <div
                  key={role.id}
                  className="border border-border rounded-lg p-3 bg-card"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full border font-medium",
                        getRoleColor(role.id)
                      )}
                    >
                      {role.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {rolePermCount(role.id)} permissões
                    </span>
                  </div>
                  {role.description && (
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {role.description}
                    </p>
                  )}
                </div>
              ))}
          </div>
        </div>

        {/* ── Permission matrix ───────────────────────────────────────────── */}
        {permissionCatalog.length > 0 && matrixRoles.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Matriz de permissões
            </h2>
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground min-w-[120px]">
                      Categoria
                    </th>
                    {matrixRoles.map((r) => (
                      <th
                        key={r.id}
                        className="px-2 py-2 font-medium text-center"
                      >
                        <span
                          className={cn(
                            "px-1.5 py-0.5 rounded text-[10px] border",
                            getRoleColor(r.id)
                          )}
                        >
                          {r.label}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat, idx) => (
                    <tr
                      key={cat}
                      className={cn(
                        "border-b border-border/50",
                        idx % 2 === 0 ? "bg-transparent" : "bg-muted/10"
                      )}
                    >
                      <td className="px-3 py-1.5 text-muted-foreground capitalize">
                        {cat.replace(/_/g, " ")}
                      </td>
                      {matrixRoles.map((r) => (
                        <td key={r.id} className="px-2 py-1.5 text-center">
                          {roleHasCategoryPerm(r.id, cat) ? (
                            <span className="text-green-400 font-bold">✓</span>
                          ) : (
                            <span className="text-muted-foreground/30">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Governance;
