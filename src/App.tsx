import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Dashboard from "./pages/Dashboard";
import Approvals from "./pages/Approvals";
import Studio from "./pages/Studio";
import Chat from "./pages/Chat";
import Onboarding from "./pages/Onboarding";
import Team from "./pages/Team";
import Tasks from "./pages/Tasks";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

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
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/dashboard" replace />} />
    <Route path="/auth" element={<AuthRoute><Auth /></AuthRoute>} />
    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/approvals" element={<ProtectedRoute><Approvals /></ProtectedRoute>} />
    <Route path="/studio" element={<ProtectedRoute><Studio /></ProtectedRoute>} />
    <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
    <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
    <Route path="/team" element={<ProtectedRoute><Team /></ProtectedRoute>} />
    <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
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
