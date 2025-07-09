import { useState, useEffect } from "react";

export interface DemoSettings {
  // OpenAI Settings
  openaiApiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  enableAutoSummarization: boolean;
  enableSmartSearch: boolean;
  enableResponseDrafting: boolean;
  defaultResponseTone: string;
  customInstructions: string;
  
  // Demo Customization Settings
  demoTitle: string;
  companyName: string;
  demoDescription: string;
  primaryColor: string;
  accentColor: string;
  warningColor: string;
  demoMode: string;
  showAdvancedFeatures: boolean;
  customWelcomeMessage: string;
  maxTicketsDisplay: number;
  enableDemoData: boolean;
  demoUserName: string;
  demoUserRole: string;
}

const defaultSettings: DemoSettings = {
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
  demoMode: "full",
  showAdvancedFeatures: true,
  customWelcomeMessage: "Welcome to your AI-powered support dashboard",
  maxTicketsDisplay: 10,
  enableDemoData: false,
  demoUserName: "Demo User",
  demoUserRole: "Support Manager"
};

export function useDemoSettings() {
  const [settings, setSettings] = useState<DemoSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSettings = () => {
      try {
        const savedSettings = localStorage.getItem("aiAgentSettings");
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          setSettings(prev => ({ ...prev, ...parsed }));
        }
      } catch (error) {
        console.error("Failed to load demo settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  return { settings, isLoading };
}