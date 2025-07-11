import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageCircle, Bot, TrendingUp, Clock, Users } from 'lucide-react';
import Chatbot from '@/components/chatbot';
import { useDemoSettings } from '@/hooks/use-demo-settings';

export default function Chat() {
  const { settings } = useDemoSettings();
  const [activeTab, setActiveTab] = useState('chat');

  // Mock analytics data - in a real app, this would come from your backend
  const chatAnalytics = {
    totalConversations: 127,
    avgResponseTime: '2.3s',
    satisfactionRate: 94,
    topQueries: [
      { query: 'Account issues', count: 23 },
      { query: 'API documentation', count: 18 },
      { query: 'Billing questions', count: 15 },
      { query: 'Feature requests', count: 12 },
      { query: 'Technical support', count: 9 }
    ],
    recentActivity: [
      { time: '2 min ago', user: 'User #123', query: 'How do I reset my password?' },
      { time: '5 min ago', user: 'User #124', query: 'API rate limits' },
      { time: '8 min ago', user: 'User #125', query: 'Billing cycle dates' },
      { time: '12 min ago', user: 'User #126', query: 'Feature documentation' }
    ]
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Chat Assistant</h1>
          <p className="text-muted-foreground">
            Intelligent conversational support powered by AI
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2">
          <Bot className="w-4 h-4" />
          AI-Powered
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chat">Live Chat</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Chats</CardTitle>
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8</div>
                <p className="text-xs text-muted-foreground">+2 from yesterday</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{chatAnalytics.avgResponseTime}</div>
                <p className="text-xs text-muted-foreground">-0.5s from last hour</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Satisfaction Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{chatAnalytics.satisfactionRate}%</div>
                <p className="text-xs text-muted-foreground">+3% from last week</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{chatAnalytics.totalConversations}</div>
                <p className="text-xs text-muted-foreground">+12 today</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-1">
              <Chatbot isEmbedded={true} className="h-[600px]" />
            </div>
            
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {chatAnalytics.recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{activity.user}</p>
                          <p className="text-sm text-gray-600">{activity.query}</p>
                        </div>
                        <span className="text-xs text-gray-500">{activity.time}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Queries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {chatAnalytics.topQueries.map((query, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{query.query}</span>
                      <Badge variant="secondary">{query.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Resolution Rate</span>
                    <span className="font-medium">87%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Escalation Rate</span>
                    <span className="font-medium">13%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">First Response Rate</span>
                    <span className="font-medium">92%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Knowledge Base Usage</span>
                    <span className="font-medium">78%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Chatbot Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">AI Model Settings</h3>
                  <p className="text-sm text-gray-600">
                    Using {settings.model} with temperature {settings.temperature}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Features Enabled</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Auto-summarization</span>
                      <Badge variant={settings.enableAutoSummarization ? "default" : "secondary"}>
                        {settings.enableAutoSummarization ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Smart Search</span>
                      <Badge variant={settings.enableSmartSearch ? "default" : "secondary"}>
                        {settings.enableSmartSearch ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Response Drafting</span>
                      <Badge variant={settings.enableResponseDrafting ? "default" : "secondary"}>
                        {settings.enableResponseDrafting ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Default Response Tone</h3>
                  <p className="text-sm text-gray-600 capitalize">{settings.defaultResponseTone}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}