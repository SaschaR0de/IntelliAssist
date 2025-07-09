import { useLocation } from "wouter";
import { Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDemoSettings } from "@/hooks/use-demo-settings";

const pageConfig = {
  "/": { title: "Dashboard", description: "AI-powered corporate support assistant" },
  "/triage": { title: "Auto-Triage", description: "Automatically analyze and categorize support tickets" },
  "/knowledge": { title: "Knowledge Search", description: "Search across docs, wikis, and ticket history" },
  "/responses": { title: "Draft Responses", description: "Generate customer-facing responses" },
  "/documents": { title: "Documents", description: "Manage knowledge base documents" },
  "/settings": { title: "Settings", description: "Configure AI agent settings" },
};

export default function Header() {
  const [location] = useLocation();
  const config = pageConfig[location] || pageConfig["/"];
  const { settings, isLoading: settingsLoading } = useDemoSettings();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-corporate-secondary">{config.title}</h2>
          <p className="text-sm text-gray-500">{config.description}</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-4 w-4 text-gray-400" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-corporate-error text-white text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </Button>
          <div className="flex items-center space-x-2">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: settingsLoading ? "#e5e7eb" : settings.accentColor }}
            >
              <User className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-medium text-corporate-secondary">
              {settingsLoading ? "Demo User" : settings.demoUserName}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
