import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import FileUpload from "@/components/file-upload";
import TicketItem from "@/components/ticket-item";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Brain, Zap, Plus, Loader2 } from "lucide-react";
import LoadingMascot, { ThinkingMascot, ProcessingMascot } from "@/components/ui/loading-mascot";

export default function Triage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [manualTicket, setManualTicket] = useState({
    title: "",
    description: "",
    priority: "medium",
    category: ""
  });
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ["/api/tickets"],
  });

  const createTicketMutation = useMutation({
    mutationFn: async (ticketData: any) => {
      const formData = new FormData();
      if (selectedFile) {
        formData.append('file', selectedFile);
        formData.append('title', selectedFile.name);
        formData.append('description', `File upload: ${selectedFile.name}`);
        formData.append('originalContent', await selectedFile.text());
      } else {
        formData.append('title', ticketData.title);
        formData.append('description', ticketData.description);
        formData.append('priority', ticketData.priority);
        formData.append('category', ticketData.category);
        formData.append('originalContent', ticketData.description);
      }
      
      return apiRequest("POST", "/api/tickets", Object.fromEntries(formData));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      toast({
        title: "Success",
        description: "Ticket created successfully",
      });
      setSelectedFile(null);
      setManualTicket({
        title: "",
        description: "",
        priority: "medium",
        category: ""
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const analyzeTicketMutation = useMutation({
    mutationFn: async (ticketId: number) => {
      return apiRequest("POST", `/api/tickets/${ticketId}/analyze`, {});
    },
    onSuccess: (response) => {
      const data = response.json();
      setAnalysis(data.analysis);
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      toast({
        title: "Analysis Complete",
        description: "AI has analyzed the ticket",
      });
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleCreateTicket = () => {
    if (!selectedFile && (!manualTicket.title || !manualTicket.description)) {
      toast({
        title: "Incomplete Information",
        description: "Please provide ticket details or upload a file",
        variant: "destructive",
      });
      return;
    }

    createTicketMutation.mutate(manualTicket);
  };

  const handleAnalyzeTicket = (ticket: any) => {
    setSelectedTicket(ticket);
    setAnalysis(null);
    analyzeTicketMutation.mutate(ticket.id);
  };

  return (
    <div className="space-y-8">
      {/* Create New Ticket */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-corporate-secondary">
              Upload Ticket File
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FileUpload
              onFileSelect={setSelectedFile}
              onFileRemove={() => setSelectedFile(null)}
              selectedFile={selectedFile}
              accept=".txt,.pdf,.doc,.docx,.md,.eml"
            />
            <Button 
              className="w-full bg-corporate-primary hover:bg-blue-600"
              onClick={handleCreateTicket}
              disabled={!selectedFile || createTicketMutation.isPending}
            >
              {createTicketMutation.isPending ? (
                <ProcessingMascot size="sm" message="Creating..." />
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Ticket from File
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-corporate-secondary">
              Manual Ticket Entry
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Ticket title"
              value={manualTicket.title}
              onChange={(e) => setManualTicket(prev => ({ ...prev, title: e.target.value }))}
            />
            <Textarea
              placeholder="Describe the issue..."
              value={manualTicket.description}
              onChange={(e) => setManualTicket(prev => ({ ...prev, description: e.target.value }))}
              rows={4}
            />
            <div className="grid grid-cols-2 gap-4">
              <Select 
                value={manualTicket.priority} 
                onValueChange={(value) => setManualTicket(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Category"
                value={manualTicket.category}
                onChange={(e) => setManualTicket(prev => ({ ...prev, category: e.target.value }))}
              />
            </div>
            <Button 
              className="w-full bg-corporate-accent hover:bg-green-600"
              onClick={handleCreateTicket}
              disabled={!manualTicket.title || !manualTicket.description || createTicketMutation.isPending}
            >
              {createTicketMutation.isPending ? (
                <ProcessingMascot size="sm" message="Creating..." />
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Manual Ticket
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Ticket Analysis */}
      {selectedTicket && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-corporate-secondary">
              Ticket Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-corporate-secondary mb-2">{selectedTicket.title}</h4>
              <p className="text-sm text-gray-600">{selectedTicket.description}</p>
            </div>

            {analyzeTicketMutation.isPending ? (
              <div className="flex items-center justify-center py-8">
                <ThinkingMascot size="lg" message="Analyzing ticket with AI..." />
              </div>
            ) : analysis ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h5 className="font-medium text-sm text-corporate-secondary mb-1">Priority</h5>
                    <Badge className={
                      analysis.priority === "high" ? "bg-red-100 text-red-800" :
                      analysis.priority === "medium" ? "bg-yellow-100 text-yellow-800" :
                      "bg-green-100 text-green-800"
                    }>
                      {analysis.priority}
                    </Badge>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h5 className="font-medium text-sm text-corporate-secondary mb-1">Category</h5>
                    <p className="text-sm text-gray-700">{analysis.category}</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h5 className="font-medium text-sm text-corporate-secondary mb-1">Urgency</h5>
                    <p className="text-sm text-gray-700">{analysis.urgency}/10</p>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h5 className="font-medium text-sm text-corporate-secondary mb-2">AI Summary</h5>
                  <p className="text-sm text-gray-700">{analysis.summary}</p>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h5 className="font-medium text-sm text-corporate-secondary mb-2">Suggested Actions</h5>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {analysis.suggestedActions.map((action: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Estimated Resolution: {analysis.estimatedResolutionTime}</span>
                  <span>Sentiment: {analysis.sentiment}</span>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* All Tickets */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-corporate-secondary">
            All Support Tickets
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ticketsLoading ? (
            <div className="flex justify-center py-12">
              <LoadingMascot size="lg" message="Loading support tickets..." showSparkles={true} />
            </div>
          ) : tickets?.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No tickets found. Create your first ticket above.</p>
          ) : (
            <div className="space-y-4">
              {tickets?.map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <TicketItem ticket={ticket} />
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAnalyzeTicket(ticket)}
                      disabled={analyzeTicketMutation.isPending}
                    >
                      <Brain className="h-4 w-4 mr-2" />
                      Analyze
                    </Button>
                    {ticket.aiSummary && (
                      <Badge variant="secondary">
                        <Zap className="h-3 w-3 mr-1" />
                        AI Analyzed
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
