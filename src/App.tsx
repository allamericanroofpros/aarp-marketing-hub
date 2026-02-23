import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { FilterProvider } from "@/contexts/FilterContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/layout/AppLayout";
import LoginPage from "./pages/LoginPage";
import SetupPage from "./pages/SetupPage";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import PendingAccessPage from "./pages/PendingAccessPage";
import Home from "./pages/Home";
import Performance from "./pages/Performance";
import Pipeline from "./pages/Pipeline";
import AnalyticsPage from "./pages/AnalyticsPage";
import VideoAnalyticsPage from "./pages/VideoAnalyticsPage";
import ContentStudio from "./pages/ContentStudio";
import WebAgendas from "./pages/WebAgendas";
import AssistantPage from "./pages/AssistantPage";
import SourcesAttribution from "./pages/SourcesAttribution";
import ConnectorsPage from "./pages/ConnectorsPage";
import ScorecardPage from "./pages/ScorecardPage";
import SettingsPage from "./pages/SettingsPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AuthGate() {
  const { session, profile, profileLoading } = useAuth();

  if (!session) return <LoginPage />;
  if (profileLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <p className="text-sm text-muted-foreground">Checking access…</p>
      </div>
    );
  }
  if (!profile) return <PendingAccessPage />;

  return (
    <FilterProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/performance" element={<Performance />} />
          <Route path="/pipeline" element={<Pipeline />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/video-analytics" element={<VideoAnalyticsPage />} />
          <Route path="/content" element={<ContentStudio />} />
          <Route path="/agendas" element={<WebAgendas />} />
          <Route path="/assistant" element={<AssistantPage />} />
          <Route path="/sources" element={<SourcesAttribution />} />
          <Route path="/connectors" element={<ConnectorsPage />} />
          <Route path="/scorecards" element={<ScorecardPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/admin/users" element={<AdminOnly><AdminUsersPage /></AdminOnly>} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </FilterProvider>
  );
}

function AdminOnly({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/setup" element={<SetupPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/*" element={<AuthGate />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
