import { Navigate } from "react-router-dom";

/**
 * Dashboard legado — redirecionado para Central Orion.
 * A Central (/central) é agora a tela principal do sistema.
 */
export default function Dashboard() {
  return <Navigate to="/central" replace />;
}
