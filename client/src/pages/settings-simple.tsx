import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings as SettingsIcon } from "lucide-react";

export default function SettingsSimple() {
  const [demoTitle, setDemoTitle] = useState("AI Support Assistant");
  const [companyName, setCompanyName] = useState("Demo Company");

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <SettingsIcon className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Demo Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="demoTitle">Demo Title</Label>
            <Input
              id="demoTitle"
              value={demoTitle}
              onChange={(e) => setDemoTitle(e.target.value)}
              placeholder="AI Support Assistant"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Demo Company"
            />
          </div>

          <Button className="w-full">
            Save Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}