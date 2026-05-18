export type OrionRole =
  | "owner"
  | "manager"
  | "team"
  | "agency_admin"
  | "agency_operator"
  | "client_viewer";

export type OrionMode = "owner" | "manager" | "agency";

export const normalizeOrionRole = (role?: string | null): OrionRole => {
  switch (role) {
    case "agency_admin":
    case "agency_operator":
    case "client_viewer":
    case "manager":
    case "team":
    case "owner":
      return role;
    case "admin":
    case "gestor":
    case "gestor_trafego":
      return "manager";
    case "employee":
    case "designer":
    case "copywriter":
    case "social_media":
    case "financeiro":
      return "team";
    default:
      return "owner";
  }
};

export const modeForRole = (role: OrionRole): OrionMode => {
  if (role === "agency_admin" || role === "agency_operator" || role === "client_viewer") return "agency";
  if (role === "manager" || role === "team") return "manager";
  return "owner";
};

export const canApproveForRole = (role: OrionRole) =>
  role === "owner" || role === "manager" || role === "agency_admin" || role === "client_viewer";
