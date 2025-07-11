import { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import LoadingMascot from '@/components/ui/loading-mascot';
import { MessageCircle, Send, Bot, User, X, Minimize2, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';

interface ChatMessage {
  id: number;
  content: string;
  isUser: boolean;
  timestamp: Date;
  confidence?: number;
  sources?: string[];
}

interface ChatbotProps {
  className?: string;
  isEmbedded?: boolean;
}

export default function Chatbot({ className, isEmbedded = false }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      content: "Hello! I'm your AI support assistant. I can help you with questions about your documentation, tickets, and provide instant support. How can I help you today?",
      isUser: false,
      timestamp: new Date(),
      confidence: 0.95
    }
  ]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const chatMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      const response = await apiRequest({
        url: '/api/chat',
        method: 'POST',
        body: { message: userMessage }
      });
      return response;
    },
    onSuccess: (data) => {
      const botMessage: ChatMessage = {
        id: Date.now(),
        content: data.response,
        isUser: false,
        timestamp: new Date(),
        confidence: data.confidence,
        sources: data.sources
      };
      setMessages(prev => [...prev, botMessage]);
      
      // Invalidate relevant queries if the bot performed actions
      if (data.actionTaken) {
        queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
        queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      }
    },
    onError: (error) => {
      const errorMessage: ChatMessage = {
        id: Date.now(),
        content: "I'm sorry, I encountered an error. Please try again or contact support if the issue persists.",
        isUser: false,
        timestamp: new Date(),
        confidence: 0
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  });

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      content: message,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    chatMutation.mutate(message);
    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isEmbedded) {
    return (
      <Card className={cn("h-full flex flex-col", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-600" />
            AI Support Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-3 max-w-[80%]",
                    msg.isUser ? "ml-auto" : "mr-auto"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                    msg.isUser ? "bg-blue-600 text-white order-2" : "bg-gray-100 text-gray-600"
                  )}>
                    {msg.isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={cn(
                    "flex flex-col gap-1",
                    msg.isUser ? "order-1" : ""
                  )}>
                    <div className={cn(
                      "p-3 rounded-lg",
                      msg.isUser 
                        ? "bg-blue-600 text-white" 
                        : "bg-gray-100 text-gray-900"
                    )}>
                      {msg.content}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{msg.timestamp.toLocaleTimeString()}</span>
                      {msg.confidence && (
                        <Badge variant="secondary" className="text-xs">
                          {Math.round(msg.confidence * 100)}% confident
                        </Badge>
                      )}
                    </div>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="text-xs text-gray-500">
                        Sources: {msg.sources.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {chatMutation.isPending && (
                <div className="flex gap-3 max-w-[80%] mr-auto">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <LoadingMascot variant="thinking" size="sm" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                disabled={chatMutation.isPending}
                className="flex-1"
              />
              <Button 
                onClick={handleSendMessage}
                disabled={chatMutation.isPending || !message.trim()}
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-shadow z-50"
          size="icon"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className={cn(
          "fixed bottom-4 right-4 w-96 shadow-xl z-50 transition-all duration-300",
          isMinimized ? "h-16" : "h-[500px]",
          className
        )}>
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-blue-600" />
              AI Support Assistant
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-8 w-8"
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          
          {!isMinimized && (
            <CardContent className="flex-1 flex flex-col p-0">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex gap-3 max-w-[80%]",
                        msg.isUser ? "ml-auto" : "mr-auto"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                        msg.isUser ? "bg-blue-600 text-white order-2" : "bg-gray-100 text-gray-600"
                      )}>
                        {msg.isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>
                      <div className={cn(
                        "flex flex-col gap-1",
                        msg.isUser ? "order-1" : ""
                      )}>
                        <div className={cn(
                          "p-3 rounded-lg",
                          msg.isUser 
                            ? "bg-blue-600 text-white" 
                            : "bg-gray-100 text-gray-900"
                        )}>
                          {msg.content}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{msg.timestamp.toLocaleTimeString()}</span>
                          {msg.confidence && (
                            <Badge variant="secondary" className="text-xs">
                              {Math.round(msg.confidence * 100)}% confident
                            </Badge>
                          )}
                        </div>
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="text-xs text-gray-500">
                            Sources: {msg.sources.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {chatMutation.isPending && (
                    <div className="flex gap-3 max-w-[80%] mr-auto">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="bg-gray-100 p-3 rounded-lg">
                        <LoadingMascot variant="thinking" size="sm" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me anything..."
                    disabled={chatMutation.isPending}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleSendMessage}
                    disabled={chatMutation.isPending || !message.trim()}
                    size="icon"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </>
  );
}