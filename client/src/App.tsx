import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import Triage from "@/pages/triage";
import Knowledge from "@/pages/knowledge";
import Responses from "@/pages/responses";
import Documents from "@/pages/documents";
import Settings from "@/pages/settings-stable";
import MainLayout from "@/components/layout/main-layout";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/triage" component={Triage} />
        <Route path="/knowledge" component={Knowledge} />
        <Route path="/responses" component={Responses} />
        <Route path="/documents" component={Documents} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
