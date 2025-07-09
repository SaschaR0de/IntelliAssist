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
    openaiApiKey: "",
    model: "gpt-4o",
    temperature: 0.3,
    maxTokens: 1000,
    enableAutoSummarization: true,
    enableSmartSearch: true,
    enableResponseDrafting: true,
    defaultResponseTone: "professional",
    customInstructions: ""
  });
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem("aiAgentSettings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error("Failed to parse saved settings:", error);
      }
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
                onChange={(e) => setSettings(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
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
              onChange={(e) => setSettings(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
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
