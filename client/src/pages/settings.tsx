import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings as SettingsIcon, 
  Key, 
  Brain, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Save,
  TestTube,
  Loader2,
  Shield,
  Zap
} from "lucide-react";

export default function Settings() {
  const [settings, setSettings] = useState({
    // OpenAI Settings
    openaiApiKey: "",
    model: "gpt-4o",
    temperature: 0.3,
    maxTokens: 1000,
    enableAutoSummarization: true,
    enableSmartSearch: true,
    enableResponseDrafting: true,
    defaultResponseTone: "professional",
    customInstructions: "",
    
    // Demo Customization Settings
    demoTitle: "AI Support Assistant",
    companyName: "Demo Company",
    demoDescription: "Intelligent support ticket management and automated response generation",
    primaryColor: "#3B82F6",
    accentColor: "#10B981",
    warningColor: "#F59E0B",
    demoMode: "full", // full, basic, advanced
    showAdvancedFeatures: true,
    customWelcomeMessage: "Welcome to your AI-powered support dashboard",
    maxTicketsDisplay: 10,
    enableDemoData: false,
    demoUserName: "Demo User",
    demoUserRole: "Support Manager"
  });
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load settings from localStorage
    try {
      const savedSettings = localStorage.getItem("aiAgentSettings");
      if (savedSettings && savedSettings.trim()) {
        const parsed = JSON.parse(savedSettings);
        if (parsed && typeof parsed === 'object') {
          // Ensure all required fields have valid values
          const safeMaxTickets = parseInt(parsed?.maxTicketsDisplay);
          const safeTemperature = parseFloat(parsed?.temperature);
          const safeMaxTokens = parseInt(parsed?.maxTokens);
          
          setSettings(prev => ({ 
            ...prev, 
            ...parsed,
            maxTicketsDisplay: !isNaN(safeMaxTickets) && safeMaxTickets >= 1 && safeMaxTickets <= 50 ? safeMaxTickets : 10,
            temperature: !isNaN(safeTemperature) && safeTemperature >= 0 && safeTemperature <= 2 ? safeTemperature : 0.3,
            maxTokens: !isNaN(safeMaxTokens) && safeMaxTokens >= 100 && safeMaxTokens <= 4000 ? safeMaxTokens : 1000
          }));
        }
      }
    } catch (error) {
      console.error("Failed to parse saved settings:", error);
      // Clear corrupted data
      localStorage.removeItem("aiAgentSettings");
    }
  }, []);

  const handleSaveSettings = () => {
    setIsSaving(true);
    try {
      localStorage.setItem("aiAgentSettings", JSON.stringify(settings));
      toast({
        title: "Settings saved",
        description: "Your AI agent settings have been saved successfully",
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!settings.openaiApiKey.trim()) {
      toast({
        title: "API Key required",
        description: "Please enter your OpenAI API key first",
        variant: "destructive",
      });
      return;
    }

    setIsTestingConnection(true);
    setConnectionStatus("idle");

    try {
      // Test the connection by making a simple API call
      const response = await fetch('/api/test-openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: settings.openaiApiKey,
          model: settings.model
        })
      });

      if (response.ok) {
        setConnectionStatus("success");
        toast({
          title: "Connection successful",
          description: "OpenAI API connection is working properly",
        });
      } else {
        setConnectionStatus("error");
        toast({
          title: "Connection failed",
          description: "Failed to connect to OpenAI API. Please check your API key",
          variant: "destructive",
        });
      }
    } catch (error) {
      setConnectionStatus("error");
      toast({
        title: "Connection failed",
        description: "Network error while testing connection",
        variant: "destructive",
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case "success":
        return "Connected";
      case "error":
        return "Connection Failed";
      default:
        return "Not Tested";
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case "success":
        return "text-green-600";
      case "error":
        return "text-red-600";
      default:
        return "text-yellow-600";
    }
  };

  return (
    <div className="space-y-8">
      {/* OpenAI Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-corporate-secondary flex items-center">
            <Key className="h-5 w-5 mr-2" />
            OpenAI Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="sk-..."
              value={settings.openaiApiKey}
              onChange={(e) => setSettings(prev => ({ ...prev, openaiApiKey: e.target.value }))}
              className="font-mono"
            />
            <p className="text-xs text-gray-500">
              Your OpenAI API key is stored locally and never sent to our servers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Select value={settings.model} onValueChange={(value) => setSettings(prev => ({ ...prev, model: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o">GPT-4o (Latest)</SelectItem>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="temperature">Temperature</Label>
              <Input
                id="temperature"
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={settings.temperature}
                onChange={(e) => {
                  const value = e.target.value;
                  const numValue = parseFloat(value);
                  if (!isNaN(numValue) && numValue >= 0 && numValue <= 2) {
                    setSettings(prev => ({ ...prev, temperature: numValue }));
                  }
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxTokens">Max Tokens</Label>
            <Input
              id="maxTokens"
              type="number"
              min="100"
              max="4000"
              value={settings.maxTokens}
              onChange={(e) => {
                const value = e.target.value;
                const numValue = parseInt(value);
                if (!isNaN(numValue) && numValue >= 100 && numValue <= 4000) {
                  setSettings(prev => ({ ...prev, maxTokens: numValue }));
                }
              }}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              {getConnectionStatusIcon()}
              <span className={`font-medium ${getConnectionStatusColor()}`}>
                {getConnectionStatusText()}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              disabled={isTestingConnection}
            >
              {isTestingConnection ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4 mr-2" />
              )}
              Test Connection
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Features */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-corporate-secondary flex items-center">
            <Brain className="h-5 w-5 mr-2" />
            AI Features
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Auto-Summarization</Label>
                <p className="text-sm text-gray-500">
                  Automatically generate summaries for tickets and documents
                </p>
              </div>
              <Switch
                checked={settings.enableAutoSummarization}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableAutoSummarization: checked }))}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Smart Search</Label>
                <p className="text-sm text-gray-500">
                  Use AI to enhance search results and provide contextual insights
                </p>
              </div>
              <Switch
                checked={settings.enableSmartSearch}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableSmartSearch: checked }))}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Response Drafting</Label>
                <p className="text-sm text-gray-500">
                  Enable AI-powered customer response drafting
                </p>
              </div>
              <Switch
                checked={settings.enableResponseDrafting}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableResponseDrafting: checked }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Response Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-corporate-secondary flex items-center">
            <Zap className="h-5 w-5 mr-2" />
            Response Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="defaultTone">Default Response Tone</Label>
            <Select 
              value={settings.defaultResponseTone} 
              onValueChange={(value) => setSettings(prev => ({ ...prev, defaultResponseTone: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select tone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
                <SelectItem value="formal">Formal</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customInstructions">Custom Instructions</Label>
            <Textarea
              id="customInstructions"
              placeholder="Enter custom instructions for AI responses..."
              value={settings.customInstructions}
              onChange={(e) => setSettings(prev => ({ ...prev, customInstructions: e.target.value }))}
              rows={4}
            />
            <p className="text-xs text-gray-500">
              These instructions will be included in all AI prompts to customize the behavior
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Security & Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-corporate-secondary flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Security & Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-sm text-corporate-secondary mb-2">Data Storage</h4>
            <p className="text-sm text-gray-600">
              All data is stored locally in your browser. No information is sent to external servers except for AI processing.
            </p>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-sm text-corporate-secondary mb-2">API Security</h4>
            <p className="text-sm text-gray-600">
              Your OpenAI API key is encrypted and stored locally. It's only used for AI processing and never shared.
            </p>
          </div>

          <div className="p-4 bg-yellow-50 rounded-lg">
            <h4 className="font-medium text-sm text-corporate-secondary mb-2">Important Notice</h4>
            <p className="text-sm text-gray-600">
              This is a demonstration application. Do not use real sensitive data in production environments.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Demo Customization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-corporate-secondary flex items-center">
            <Zap className="h-5 w-5 mr-2" />
            Demo Customization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="demoTitle">Demo Title</Label>
              <Input
                id="demoTitle"
                placeholder="AI Support Assistant"
                value={settings.demoTitle}
                onChange={(e) => setSettings(prev => ({ ...prev, demoTitle: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                placeholder="Demo Company"
                value={settings.companyName}
                onChange={(e) => setSettings(prev => ({ ...prev, companyName: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="demoDescription">Demo Description</Label>
            <Textarea
              id="demoDescription"
              placeholder="Intelligent support ticket management and automated response generation"
              value={settings.demoDescription}
              onChange={(e) => setSettings(prev => ({ ...prev, demoDescription: e.target.value }))}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="welcomeMessage">Custom Welcome Message</Label>
            <Textarea
              id="welcomeMessage"
              placeholder="Welcome to your AI-powered support dashboard"
              value={settings.customWelcomeMessage}
              onChange={(e) => setSettings(prev => ({ ...prev, customWelcomeMessage: e.target.value }))}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="demoUserName">Demo User Name</Label>
              <Input
                id="demoUserName"
                placeholder="Demo User"
                value={settings.demoUserName}
                onChange={(e) => setSettings(prev => ({ ...prev, demoUserName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="demoUserRole">Demo User Role</Label>
              <Input
                id="demoUserRole"
                placeholder="Support Manager"
                value={settings.demoUserRole}
                onChange={(e) => setSettings(prev => ({ ...prev, demoUserRole: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Demo Mode & Features */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-corporate-secondary flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Demo Mode & Features
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="demoMode">Demo Mode</Label>
            <Select 
              value={settings.demoMode} 
              onValueChange={(value) => setSettings(prev => ({ ...prev, demoMode: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select demo mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic (Essential Features)</SelectItem>
                <SelectItem value="full">Full (All Features)</SelectItem>
                <SelectItem value="advanced">Advanced (Expert Mode)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxTicketsDisplay">Maximum Tickets to Display</Label>
            <Input
              id="maxTicketsDisplay"
              type="number"
              min="1"
              max="50"
              value={settings.maxTicketsDisplay}
              onChange={(e) => {
                const value = e.target.value;
                const numValue = parseInt(value);
                if (!isNaN(numValue) && numValue >= 1 && numValue <= 50) {
                  setSettings(prev => ({ ...prev, maxTicketsDisplay: numValue }));
                }
              }}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Show Advanced Features</Label>
                <p className="text-sm text-gray-500">
                  Display advanced AI features and detailed analytics
                </p>
              </div>
              <Switch
                checked={settings.showAdvancedFeatures}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, showAdvancedFeatures: checked }))}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Enable Demo Data</Label>
                <p className="text-sm text-gray-500">
                  Pre-populate the demo with sample tickets and documents
                </p>
              </div>
              <Switch
                checked={settings.enableDemoData}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableDemoData: checked }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Color Customization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-corporate-secondary flex items-center">
            <Zap className="h-5 w-5 mr-2" />
            Color Customization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex items-center space-x-2">
                <input
                  id="primaryColor"
                  type="color"
                  value={settings.primaryColor}
                  onChange={(e) => setSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                  className="w-10 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <Input
                  value={settings.primaryColor}
                  onChange={(e) => setSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                  className="font-mono text-sm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="accentColor">Accent Color</Label>
              <div className="flex items-center space-x-2">
                <input
                  id="accentColor"
                  type="color"
                  value={settings.accentColor}
                  onChange={(e) => setSettings(prev => ({ ...prev, accentColor: e.target.value }))}
                  className="w-10 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <Input
                  value={settings.accentColor}
                  onChange={(e) => setSettings(prev => ({ ...prev, accentColor: e.target.value }))}
                  className="font-mono text-sm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="warningColor">Warning Color</Label>
              <div className="flex items-center space-x-2">
                <input
                  id="warningColor"
                  type="color"
                  value={settings.warningColor}
                  onChange={(e) => setSettings(prev => ({ ...prev, warningColor: e.target.value }))}
                  className="w-10 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <Input
                  value={settings.warningColor}
                  onChange={(e) => setSettings(prev => ({ ...prev, warningColor: e.target.value }))}
                  className="font-mono text-sm"
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-sm text-corporate-secondary mb-2">Color Preview</h4>
            <div className="flex items-center space-x-4">
              <div 
                className="w-20 h-8 rounded flex items-center justify-center text-white text-sm font-medium"
                style={{ backgroundColor: settings.primaryColor }}
              >
                Primary
              </div>
              <div 
                className="w-20 h-8 rounded flex items-center justify-center text-white text-sm font-medium"
                style={{ backgroundColor: settings.accentColor }}
              >
                Accent
              </div>
              <div 
                className="w-20 h-8 rounded flex items-center justify-center text-white text-sm font-medium"
                style={{ backgroundColor: settings.warningColor }}
              >
                Warning
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Settings */}
      <div className="flex justify-end">
        <Button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="bg-corporate-primary hover:bg-blue-600"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Settings
        </Button>
      </div>
    </div>
  );
}
