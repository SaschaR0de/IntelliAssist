import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Filter, 
  Search, 
  Edit, 
  FileText, 
  Settings, 
  Bot 
} from "lucide-react";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/triage", label: "Auto-Triage", icon: Filter },
  { path: "/knowledge", label: "Knowledge Search", icon: Search },
  { path: "/responses", label: "Draft Responses", icon: Edit },
  { path: "/documents", label: "Documents", icon: FileText },
  { path: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-corporate-primary rounded-lg flex items-center justify-center">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-corporate-secondary">AI Agent</h1>
            <p className="text-sm text-gray-500">Corporate Demo</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors",
                location === item.path
                  ? "bg-blue-50 text-corporate-primary"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <IconComponent className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* API Status */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-2 text-sm">
          <div className="w-2 h-2 bg-corporate-accent rounded-full"></div>
          <span className="text-gray-600">OpenAI Connected</span>
        </div>
      </div>
    </div>
  );
}
