import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Edit, Trash2, Brain, Copy, Check, Loader2 } from "lucide-react";
import LoadingMascot, { ThinkingMascot, ProcessingMascot } from "@/components/ui/loading-mascot";

export default function Responses() {
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [customContext, setCustomContext] = useState("");
  const [draftResponse, setDraftResponse] = useState<any>(null);
  const [newTemplate, setNewTemplate] = useState({
    title: "",
    content: "",
    category: "",
    tags: ""
  });
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ["/api/tickets"],
  });

  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ["/api/response-templates"],
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (templateData: any) => {
      const tags = templateData.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean);
      return apiRequest("POST", "/api/response-templates", {
        ...templateData,
        tags
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/response-templates"] });
      setIsTemplateDialogOpen(false);
      setNewTemplate({
        title: "",
        content: "",
        category: "",
        tags: ""
      });
      toast({
        title: "Success",
        description: "Response template created successfully",
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

  const draftResponseMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/draft-response", data);
    },
    onSuccess: (data) => {
      setDraftResponse(data);
      toast({
        title: "Response drafted",
        description: "AI has generated a response draft",
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

  const handleDraftResponse = () => {
    if (!selectedTicket) {
      toast({
        title: "No ticket selected",
        description: "Please select a ticket to draft a response for",
        variant: "destructive",
      });
      return;
    }

    draftResponseMutation.mutate({
      ticketId: selectedTicket.id,
      templateId: selectedTemplate && selectedTemplate !== "none" ? selectedTemplate : undefined,
      customContext: customContext || undefined
    });
  };

  const handleCreateTemplate = () => {
    if (!newTemplate.title || !newTemplate.content || !newTemplate.category) {
      toast({
        title: "Incomplete template",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createTemplateMutation.mutate(newTemplate);
  };

  const handleCopyResponse = async () => {
    if (!draftResponse?.content) return;

    try {
      await navigator.clipboard.writeText(draftResponse.content);
      setCopiedResponse(true);
      toast({
        title: "Copied",
        description: "Response copied to clipboard",
      });
      setTimeout(() => setCopiedResponse(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Unable to copy response to clipboard",
        variant: "destructive",
      });
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600";
    if (confidence >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-8">
      {/* Response Drafting Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-corporate-secondary">
            Draft Customer Response
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Ticket
              </label>
              <Select value={selectedTicket?.id?.toString() || ""} onValueChange={(value) => {
                const ticket = tickets?.find(t => t.id.toString() === value);
                setSelectedTicket(ticket);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a ticket..." />
                </SelectTrigger>
                <SelectContent>
                  {tickets?.map((ticket) => (
                    <SelectItem key={ticket.id} value={ticket.id.toString()}>
                      {ticket.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Response Template (Optional)
              </label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No template</SelectItem>
                  {templates?.map((template) => (
                    <SelectItem key={template.id} value={template.id.toString()}>
                      {template.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Context (Optional)
            </label>
            <Textarea
              placeholder="Provide any additional context or instructions for the AI..."
              value={customContext}
              onChange={(e) => setCustomContext(e.target.value)}
              rows={3}
            />
          </div>

          <Button 
            className="w-full bg-corporate-primary hover:bg-blue-600"
            onClick={handleDraftResponse}
            disabled={!selectedTicket || draftResponseMutation.isPending}
          >
            {draftResponseMutation.isPending ? (
              <ThinkingMascot size="sm" message="Generating response..." />
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Draft AI Response
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Selected Ticket Info */}
      {selectedTicket && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-corporate-secondary">
              Ticket Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-corporate-secondary">{selectedTicket.title}</h4>
                <Badge className={
                  selectedTicket.priority === "high" ? "bg-red-100 text-red-800" :
                  selectedTicket.priority === "medium" ? "bg-yellow-100 text-yellow-800" :
                  "bg-green-100 text-green-800"
                }>
                  {selectedTicket.priority}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">{selectedTicket.description}</p>
              {selectedTicket.aiSummary && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h5 className="font-medium text-sm text-corporate-secondary mb-1">AI Summary</h5>
                  <p className="text-sm text-gray-700">{selectedTicket.aiSummary}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Draft Response */}
      {draftResponse && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-corporate-secondary flex items-center justify-between">
              Generated Response
              <div className="flex items-center space-x-2">
                <span className={`text-sm ${getConfidenceColor(draftResponse.confidence)}`}>
                  {Math.round((draftResponse.confidence || 0) * 100)}% confidence
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyResponse}
                >
                  {copiedResponse ? (
                    <Check className="h-4 w-4 mr-2 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4 mr-2" />
                  )}
                  {copiedResponse ? "Copied!" : "Copy"}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                {draftResponse.content}
              </pre>
            </div>
            
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Tone: {draftResponse.tone}</span>
              <span>Style: AI-Generated</span>
            </div>

            {draftResponse.suggestions && draftResponse.suggestions.length > 0 && (
              <div className="p-3 bg-yellow-50 rounded-lg">
                <h5 className="font-medium text-sm text-corporate-secondary mb-2">Suggestions for improvement:</h5>
                <ul className="text-sm text-gray-700 space-y-1">
                  {draftResponse.suggestions.map((suggestion: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2">•</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Response Templates Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-corporate-secondary">
            Response Templates
          </CardTitle>
          <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-corporate-accent hover:bg-green-600">
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Response Template</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Template title"
                  value={newTemplate.title}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, title: e.target.value }))}
                />
                <Input
                  placeholder="Category (e.g., account, technical, billing)"
                  value={newTemplate.category}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, category: e.target.value }))}
                />
                <Input
                  placeholder="Tags (comma-separated)"
                  value={newTemplate.tags}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, tags: e.target.value }))}
                />
                <Textarea
                  placeholder="Template content..."
                  value={newTemplate.content}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, content: e.target.value }))}
                  rows={8}
                />
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsTemplateDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateTemplate}
                    disabled={createTemplateMutation.isPending}
                    className="flex-1 bg-corporate-primary hover:bg-blue-600"
                  >
                    {createTemplateMutation.isPending ? (
                      <ProcessingMascot size="sm" message="Creating..." />
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Template
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {templatesLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse bg-gray-100 h-20 rounded-lg" />
              ))}
            </div>
          ) : templates?.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No response templates yet. Create your first template above.
            </p>
          ) : (
            <div className="space-y-4">
              {templates?.map((template) => (
                <div key={template.id} className="p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-corporate-secondary">{template.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{template.category}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">
                    {template.content.substring(0, 200)}...
                  </p>
                  {template.tags && template.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {template.tags.map((tag: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
