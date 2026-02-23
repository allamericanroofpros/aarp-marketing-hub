import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FilterProvider } from "@/contexts/FilterContext";
import AppLayout from "@/components/layout/AppLayout";
import Home from "./pages/Home";
import Performance from "./pages/Performance";
import Pipeline from "./pages/Pipeline";
import ContentStudio from "./pages/ContentStudio";
import WebAgendas from "./pages/WebAgendas";
import AssistantPage from "./pages/AssistantPage";
import SourcesAttribution from "./pages/SourcesAttribution";
import ConnectorsPage from "./pages/ConnectorsPage";
import ScorecardPage from "./pages/ScorecardPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <FilterProvider>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/performance" element={<Performance />} />
              <Route path="/pipeline" element={<Pipeline />} />
              <Route path="/content" element={<ContentStudio />} />
              <Route path="/agendas" element={<WebAgendas />} />
              <Route path="/assistant" element={<AssistantPage />} />
              <Route path="/sources" element={<SourcesAttribution />} />
              <Route path="/connectors" element={<ConnectorsPage />} />
              <Route path="/scorecards" element={<ScorecardPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </FilterProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
