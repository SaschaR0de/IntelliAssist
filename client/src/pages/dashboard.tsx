import { useQuery } from "@tanstack/react-query";
import StatsCard from "@/components/stats-card";
import TicketItem from "@/components/ticket-item";
import FileUpload from "@/components/file-upload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { 
  TicketIcon, 
  Database, 
  Clock, 
  Zap, 
  Upload,
  Search,
  Brain,
  Plus,
  ChevronRight,
  User
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useDemoSettings } from "@/hooks/use-demo-settings";
import LoadingMascot, { ThinkingMascot, ProcessingMascot } from "@/components/ui/loading-mascot";

export default function Dashboard() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const { settings, isLoading: settingsLoading } = useDemoSettings();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats"],
  });

  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ["/api/tickets"],
  });

  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ["/api/response-templates"],
  });

  const handleFileUpload = (file: File) => {
    setSelectedFile(file);
    toast({
      title: "File selected",
      description: `${file.name} is ready for analysis`,
    });
  };

  const handleAutoAnalyze = () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to analyze",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Analysis started",
      description: "AI is analyzing your ticket...",
    });
  };

  const handleAISearch = () => {
    if (!searchQuery.trim()) {
      toast({
        title: "No search query",
        description: "Please enter a search query",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "AI search started",
      description: `Searching for: ${searchQuery}`,
    });
  };

  const recentTickets = tickets?.slice(0, 3) || [];

  return (
    <div className="space-y-8">
      {/* Personalized Header */}
      {!settingsLoading && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-corporate-secondary" style={{ color: settings.primaryColor }}>
                {settings.demoTitle}
              </h1>
              <p className="text-gray-600 mt-1">{settings.demoDescription}</p>
              <p className="text-sm text-gray-500 mt-2">{settings.customWelcomeMessage}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>{settings.demoUserName}</span>
              </div>
              <p className="text-xs text-gray-500">{settings.demoUserRole}</p>
              <p className="text-xs text-gray-500">{settings.companyName}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Tickets Processed"
          value={stats?.ticketsProcessed || 0}
          icon={<TicketIcon className="h-6 w-6 text-corporate-primary" />}
          trend={{ direction: "up", value: "12% increase" }}
          bgColor="bg-blue-100"
        />
        <StatsCard
          title="Knowledge Base"
          value={stats?.documentsIndexed || 0}
          icon={<Database className="h-6 w-6 text-corporate-accent" />}
          trend={{ direction: "up", value: "8 new docs" }}
          bgColor="bg-green-100"
        />
        <StatsCard
          title="Response Time"
          value={stats?.avgResponseTime || "0s"}
          icon={<Clock className="h-6 w-6 text-corporate-warning" />}
          trend={{ direction: "down", value: "0.5s faster" }}
          bgColor="bg-yellow-100"
        />
        <StatsCard
          title="Auto-Resolved"
          value={stats?.autoResolved || "0%"}
          icon={<Zap className="h-6 w-6 text-purple-600" />}
          trend={{ direction: "up", value: "5% increase" }}
          bgColor="bg-purple-100"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Auto-Triage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-corporate-secondary">
              Quick Auto-Triage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FileUpload
              onFileSelect={handleFileUpload}
              onFileRemove={() => setSelectedFile(null)}
              selectedFile={selectedFile}
              accept=".txt,.pdf,.doc,.docx,.md"
            />
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={handleAutoAnalyze}
              >
                <Zap className="h-4 w-4 mr-2" />
                Auto-Analyze
              </Button>
              <Button 
                className="flex-1 bg-corporate-accent hover:bg-green-600"
                onClick={handleAutoAnalyze}
              >
                <Brain className="h-4 w-4 mr-2" />
                AI Summary
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Knowledge Search */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-corporate-secondary">
              Knowledge Search
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search across docs, wikis, and tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">API Documentation</Badge>
              <Badge variant="secondary">Troubleshooting</Badge>
              <Badge variant="secondary">FAQs</Badge>
            </div>
            <Button 
              className="w-full bg-corporate-primary hover:bg-blue-600"
              onClick={handleAISearch}
            >
              <Brain className="h-4 w-4 mr-2" />
              AI-Powered Search
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Tickets */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold text-corporate-secondary">
              Recent Tickets
            </CardTitle>
            <Link href="/triage">
              <Button variant="ghost" size="sm" className="text-corporate-primary hover:text-blue-600">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {ticketsLoading ? (
              <div className="flex justify-center py-8">
                <LoadingMascot 
                  size="md" 
                  message="Loading tickets..." 
                  showSparkles={true}
                />
              </div>
            ) : recentTickets.length === 0 ? (
              <p className="text-gray-500 text-sm">No recent tickets</p>
            ) : (
              recentTickets
                .slice(0, settingsLoading ? 10 : settings.maxTicketsDisplay)
                .map((ticket) => (
                  <TicketItem key={ticket.id} ticket={ticket} />
                ))
            )}
          </CardContent>
        </Card>

        {/* Response Templates */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold text-corporate-secondary">
              Response Templates
            </CardTitle>
            <Link href="/responses">
              <Button variant="ghost" size="sm" className="text-corporate-primary hover:text-blue-600">
                Manage
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {templatesLoading ? (
              <div className="flex justify-center py-8">
                <ThinkingMascot 
                  size="md" 
                  message="Loading templates..." 
                />
              </div>
            ) : templates?.length === 0 ? (
              <p className="text-gray-500 text-sm">No templates available</p>
            ) : (
              templates?.slice(0, 3).map((template) => (
                <Link key={template.id} href="/responses">
                  <div
                    className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-corporate-secondary">
                        {template.title}
                      </h4>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {template.category} template
                    </p>
                  </div>
                </Link>
              ))
            )}
            {templates && templates.length > 0 && (
              <Link href="/responses">
                <Button 
                  className="w-full bg-corporate-accent hover:bg-green-600"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Template
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
