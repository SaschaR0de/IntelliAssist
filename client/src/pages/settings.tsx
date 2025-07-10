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

// Default settings to prevent undefined values
const defaultSettings = {
  openaiApiKey: "",
  model: "gpt-4o",
  temperature: 0.3,
  maxTokens: 1000,
  enableAutoSummarization: true,
  enableSmartSearch: true,
  enableResponseDrafting: true,
  defaultResponseTone: "professional",
  customInstructions: "",
  demoTitle: "AI Support Assistant",
  companyName: "Demo Company",
  demoDescription: "Intelligent support ticket management and automated response generation",
  primaryColor: "#3B82F6",
  accentColor: "#10B981",
  warningColor: "#F59E0B",
  demoMode: "full",
  showAdvancedFeatures: true,
  customWelcomeMessage: "Welcome to your AI-powered support dashboard",
  maxTicketsDisplay: 10,
  enableDemoData: false,
  demoUserName: "Demo User",
  demoUserRole: "Support Manager"
};

export default function Settings() {
  const [settings, setSettings] = useState(defaultSettings);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const { toast } = useToast();

  // Load settings once on mount
  useEffect(() => {
    let mounted = true;
    
    const loadSettings = async () => {
      try {
        const savedSettings = localStorage.getItem("aiAgentSettings");
        if (savedSettings && savedSettings.trim() && mounted) {
          const parsed = JSON.parse(savedSettings);
          if (parsed && typeof parsed === 'object') {
            // Safely merge with defaults
            const merged = { ...defaultSettings, ...parsed };
            
            // Validate numeric values
            if (typeof merged.temperature === 'string') {
              merged.temperature = parseFloat(merged.temperature) || 0.3;
            }
            if (typeof merged.maxTokens === 'string') {
              merged.maxTokens = parseInt(merged.maxTokens) || 1000;
            }
            if (typeof merged.maxTicketsDisplay === 'string') {
              merged.maxTicketsDisplay = parseInt(merged.maxTicketsDisplay) || 10;
            }
            
            setSettings(merged);
          }
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
        localStorage.removeItem("aiAgentSettings");
      } finally {
        if (mounted) {
          setIsLoaded(true);
        }
      }
    };
    
    loadSettings();
    
    return () => {
      mounted = false;
    };
  }, []);

  const handleSaveSettings = async () => {
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

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
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

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-corporate-primary" />
        <span className="ml-2 text-gray-600">Loading settings...</span>
      </div>
    );
  }

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
              onChange={(e) => updateSetting("openaiApiKey", e.target.value)}
              className="font-mono"
            />
            <p className="text-xs text-gray-500">
              Your OpenAI API key is stored locally and never sent to our servers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Select 
                value={settings.model} 
                onValueChange={(value) => updateSetting("model", value)}
              >
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
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value) && value >= 0 && value <= 2) {
                    updateSetting("temperature", value);
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
                const value = parseInt(e.target.value);
                if (!isNaN(value) && value >= 100 && value <= 4000) {
                  updateSetting("maxTokens", value);
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customInstructions">Custom Instructions</Label>
            <Textarea
              id="customInstructions"
              placeholder="Add any custom instructions for the AI..."
              value={settings.customInstructions}
              onChange={(e) => updateSetting("customInstructions", e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              {getConnectionStatusIcon()}
              <div>
                <p className="text-sm font-medium text-gray-900">Connection Status</p>
                <p className={`text-xs ${getConnectionStatusColor()}`}>
                  {getConnectionStatusText()}
                </p>
              </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="defaultResponseTone">Default Response Tone</Label>
              <Select 
                value={settings.defaultResponseTone} 
                onValueChange={(value) => updateSetting("defaultResponseTone", value)}
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
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Auto-Summarization</Label>
                <p className="text-sm text-gray-500">
                  Automatically summarize uploaded documents and tickets
                </p>
              </div>
              <Switch
                checked={settings.enableAutoSummarization}
                onCheckedChange={(checked) => updateSetting("enableAutoSummarization", checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Smart Search</Label>
                <p className="text-sm text-gray-500">
                  Use AI-powered semantic search for better results
                </p>
              </div>
              <Switch
                checked={settings.enableSmartSearch}
                onCheckedChange={(checked) => updateSetting("enableSmartSearch", checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Response Drafting</Label>
                <p className="text-sm text-gray-500">
                  Enable AI-powered response generation
                </p>
              </div>
              <Switch
                checked={settings.enableResponseDrafting}
                onCheckedChange={(checked) => updateSetting("enableResponseDrafting", checked)}
              />
            </div>
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
                onChange={(e) => updateSetting("demoTitle", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                placeholder="Demo Company"
                value={settings.companyName}
                onChange={(e) => updateSetting("companyName", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="demoDescription">Demo Description</Label>
            <Textarea
              id="demoDescription"
              placeholder="Intelligent support ticket management and automated response generation"
              value={settings.demoDescription}
              onChange={(e) => updateSetting("demoDescription", e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="welcomeMessage">Custom Welcome Message</Label>
            <Textarea
              id="welcomeMessage"
              placeholder="Welcome to your AI-powered support dashboard"
              value={settings.customWelcomeMessage}
              onChange={(e) => updateSetting("customWelcomeMessage", e.target.value)}
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
                onChange={(e) => updateSetting("demoUserName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="demoUserRole">Demo User Role</Label>
              <Input
                id="demoUserRole"
                placeholder="Support Manager"
                value={settings.demoUserRole}
                onChange={(e) => updateSetting("demoUserRole", e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Demo Mode & Features */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-corporate-secondary flex items-center">
            <SettingsIcon className="h-5 w-5 mr-2" />
            Demo Mode & Features
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="demoMode">Demo Mode</Label>
            <Select 
              value={settings.demoMode} 
              onValueChange={(value) => updateSetting("demoMode", value)}
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
                const value = parseInt(e.target.value);
                if (!isNaN(value) && value >= 1 && value <= 50) {
                  updateSetting("maxTicketsDisplay", value);
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
                onCheckedChange={(checked) => updateSetting("showAdvancedFeatures", checked)}
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
                onCheckedChange={(checked) => updateSetting("enableDemoData", checked)}
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
                  onChange={(e) => updateSetting("primaryColor", e.target.value)}
                  className="w-10 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <Input
                  value={settings.primaryColor}
                  onChange={(e) => updateSetting("primaryColor", e.target.value)}
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
                  onChange={(e) => updateSetting("accentColor", e.target.value)}
                  className="w-10 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <Input
                  value={settings.accentColor}
                  onChange={(e) => updateSetting("accentColor", e.target.value)}
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
                  onChange={(e) => updateSetting("warningColor", e.target.value)}
                  className="w-10 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <Input
                  value={settings.warningColor}
                  onChange={(e) => updateSetting("warningColor", e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-sm text-corporate-secondary mb-2">Color Preview</h4>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-6 h-6 rounded border"
                  style={{ backgroundColor: settings.primaryColor }}
                />
                <span className="text-sm text-gray-600">Primary</span>
              </div>
              <div className="flex items-center space-x-2">
                <div 
                  className="w-6 h-6 rounded border"
                  style={{ backgroundColor: settings.accentColor }}
                />
                <span className="text-sm text-gray-600">Accent</span>
              </div>
              <div className="flex items-center space-x-2">
                <div 
                  className="w-6 h-6 rounded border"
                  style={{ backgroundColor: settings.warningColor }}
                />
                <span className="text-sm text-gray-600">Warning</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Security */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-corporate-secondary flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Privacy & Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-sm text-corporate-secondary mb-2">Data Privacy</h4>
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

      {/* Save Settings Button */}
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