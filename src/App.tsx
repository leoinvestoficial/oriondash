import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

const CentralOrion = lazy(() => import("./pages/CentralOrion"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Approvals = lazy(() => import("./pages/Approvals"));
const Studio = lazy(() => import("./pages/Studio"));
const Chat = lazy(() => import("./pages/Chat"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Team = lazy(() => import("./pages/Team"));
const InternalStructure = lazy(() => import("./pages/InternalStructure"));
const Tasks = lazy(() => import("./pages/Tasks"));
const Integrations = lazy(() => import("./pages/Integrations"));
const OAuthCallback = lazy(() => import("./pages/OAuthCallback"));
const Campaigns = lazy(() => import("./pages/Campaigns"));
const ContentCalendar = lazy(() => import("./pages/ContentCalendar"));
const Diagnostico = lazy(() => import("./pages/Diagnostico"));
const Decisoes = lazy(() => import("./pages/Decisoes"));
const Cerebro = lazy(() => import("./pages/Cerebro"));
const Funnels = lazy(() => import("./pages/Funnels"));
const FunnelEditor = lazy(() => import("./pages/FunnelEditor"));
const Clientes = lazy(() => import("./pages/Clientes"));
const ExecutiveReport = lazy(() => import("./pages/ExecutiveReport"));
const Strategy = lazy(() => import("./pages/Strategy"));
const Intelligence = lazy(() => import("./pages/Intelligence"));
const Personas = lazy(() => import("./pages/Personas"));
const BrandIdentity = lazy(() => import("./pages/BrandIdentity"));
const Governance = lazy(() => import("./pages/Governance"));
const Settings = lazy(() => import("./pages/Settings"));
const Auth = lazy(() => import("./pages/Auth"));
const AcceptInvite = lazy(() => import("./pages/AcceptInvite"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 rounded-lg orion-gradient animate-pulse-glow" />
    </div>
  );
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/central" replace />;
  return <>{children}</>;
};

const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-8 h-8 rounded-lg orion-gradient animate-pulse-glow" />
  </div>
);

const AppRoutes = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route path="/" element={<Navigate to="/central" replace />} />
      <Route path="/auth" element={<AuthRoute><Auth /></AuthRoute>} />
      <Route path="/invite" element={<AcceptInvite />} />
      <Route path="/central" element={<ProtectedRoute><CentralOrion /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/campaigns" element={<ProtectedRoute><Campaigns /></ProtectedRoute>} />
      <Route path="/calendar" element={<ProtectedRoute><ContentCalendar /></ProtectedRoute>} />
      <Route path="/approvals" element={<ProtectedRoute><Approvals /></ProtectedRoute>} />
      <Route path="/studio" element={<ProtectedRoute><Studio /></ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
      <Route path="/diagnostico" element={<ProtectedRoute><Diagnostico /></ProtectedRoute>} />
      <Route path="/decisoes" element={<ProtectedRoute><Decisoes /></ProtectedRoute>} />
      <Route path="/cerebro" element={<ProtectedRoute><Cerebro /></ProtectedRoute>} />
      <Route path="/strategy" element={<ProtectedRoute><Strategy /></ProtectedRoute>} />
      <Route path="/intelligence" element={<ProtectedRoute><Intelligence /></ProtectedRoute>} />
      <Route path="/funnels" element={<ProtectedRoute><Funnels /></ProtectedRoute>} />
      <Route path="/funnels/:id" element={<ProtectedRoute><FunnelEditor /></ProtectedRoute>} />
      <Route path="/clientes" element={<ProtectedRoute><Clientes /></ProtectedRoute>} />
      <Route path="/executive-report" element={<ProtectedRoute><ExecutiveReport /></ProtectedRoute>} />
      <Route path="/personas" element={<ProtectedRoute><Personas /></ProtectedRoute>} />
      <Route path="/brand-identity" element={<ProtectedRoute><BrandIdentity /></ProtectedRoute>} />
      <Route path="/team" element={<ProtectedRoute><Team /></ProtectedRoute>} />
      <Route path="/internal-structure" element={<ProtectedRoute><InternalStructure /></ProtectedRoute>} />
      <Route path="/governance" element={<ProtectedRoute><Governance /></ProtectedRoute>} />
      <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
      <Route path="/integrations" element={<ProtectedRoute><Integrations /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/oauth/callback" element={<ProtectedRoute><OAuthCallback /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Suspense>
);
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
