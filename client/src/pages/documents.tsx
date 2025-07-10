import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import FileUpload from "@/components/file-upload";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Upload, 
  FileText, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Plus,
  Download,
  Calendar,
  Tag,
  Brain,
  Loader2
} from "lucide-react";
import LoadingMascot, { ProcessingMascot } from "@/components/ui/loading-mascot";

export default function Documents() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [manualDocument, setManualDocument] = useState({
    title: "",
    content: "",
    category: "general",
    tags: ""
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: documents, isLoading: documentsLoading } = useQuery({
    queryKey: ["/api/documents"],
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: async (data: { file?: File; manual?: any }) => {
      if (data.file) {
        const formData = new FormData();
        formData.append('file', data.file);
        formData.append('category', 'general');
        formData.append('tags', JSON.stringify([]));
        
        const response = await fetch('/api/documents', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error('Failed to upload document');
        }
        
        return response.json();
      } else if (data.manual) {
        const tags = data.manual.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean);
        return apiRequest("POST", "/api/documents", {
          ...data.manual,
          filename: `${data.manual.title}.txt`,
          fileType: "text/plain",
          tags
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      setIsUploadDialogOpen(false);
      setSelectedFile(null);
      setManualDocument({
        title: "",
        content: "",
        category: "general",
        tags: ""
      });
      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: number) => {
      return apiRequest("DELETE", `/api/documents/${documentId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleFileUpload = () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    uploadDocumentMutation.mutate({ file: selectedFile });
  };

  const handleManualUpload = () => {
    if (!manualDocument.title || !manualDocument.content) {
      toast({
        title: "Incomplete document",
        description: "Please provide both title and content",
        variant: "destructive",
      });
      return;
    }

    uploadDocumentMutation.mutate({ manual: manualDocument });
  };

  const handleDeleteDocument = (documentId: number) => {
    if (confirm("Are you sure you want to delete this document?")) {
      deleteDocumentMutation.mutate(documentId);
    }
  };

  const handleViewDocument = (document: any) => {
    setSelectedDocument(document);
    setIsViewDialogOpen(true);
  };

  const filteredDocuments = documents?.filter((doc: any) => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.tags?.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = categoryFilter === "all" || doc.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const categories = documents ? [...new Set(documents.map((doc: any) => doc.category))] : [];

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-8">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-corporate-primary hover:bg-blue-600">
              <Plus className="h-4 w-4 mr-2" />
              Add Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* File Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Upload File</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FileUpload
                    onFileSelect={setSelectedFile}
                    onFileRemove={() => setSelectedFile(null)}
                    selectedFile={selectedFile}
                    accept=".txt,.pdf,.doc,.docx,.md"
                  />
                  <Button 
                    onClick={handleFileUpload}
                    disabled={!selectedFile || uploadDocumentMutation.isPending}
                    className="w-full"
                  >
                    {uploadDocumentMutation.isPending ? (
                      <ProcessingMascot size="sm" message="Uploading..." />
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload File
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <div className="text-center text-gray-500">
                <span>or</span>
              </div>

              {/* Manual Entry */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Manual Entry</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    placeholder="Document title"
                    value={manualDocument.title}
                    onChange={(e) => setManualDocument(prev => ({ ...prev, title: e.target.value }))}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Select 
                      value={manualDocument.category} 
                      onValueChange={(value) => setManualDocument(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="documentation">Documentation</SelectItem>
                        <SelectItem value="policy">Policy</SelectItem>
                        <SelectItem value="guide">Guide</SelectItem>
                        <SelectItem value="faq">FAQ</SelectItem>
                        <SelectItem value="troubleshooting">Troubleshooting</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Tags (comma-separated)"
                      value={manualDocument.tags}
                      onChange={(e) => setManualDocument(prev => ({ ...prev, tags: e.target.value }))}
                    />
                  </div>
                  <Textarea
                    placeholder="Document content..."
                    value={manualDocument.content}
                    onChange={(e) => setManualDocument(prev => ({ ...prev, content: e.target.value }))}
                    rows={8}
                  />
                  <Button 
                    onClick={handleManualUpload}
                    disabled={!manualDocument.title || !manualDocument.content || uploadDocumentMutation.isPending}
                    className="w-full bg-corporate-accent hover:bg-green-600"
                  >
                    {uploadDocumentMutation.isPending ? (
                      <ProcessingMascot size="sm" message="Adding..." />
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Document
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 gap-6">
        {documentsLoading ? (
          <div className="flex justify-center py-16">
            <LoadingMascot size="lg" message="Loading knowledge base..." showSparkles={true} />
          </div>
        ) : filteredDocuments?.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery || categoryFilter !== "all" 
                  ? "No documents match your search criteria" 
                  : "Upload your first document to get started"}
              </p>
              <Button 
                onClick={() => setIsUploadDialogOpen(true)}
                className="bg-corporate-primary hover:bg-blue-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Document
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredDocuments?.map((document: any) => (
            <Card key={document.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="h-6 w-6 text-corporate-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-medium text-corporate-secondary truncate">
                          {document.title}
                        </h3>
                        <Badge variant="outline">{document.category}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {document.aiSummary || document.content.substring(0, 200)}...
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(document.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <FileText className="h-3 w-3 mr-1" />
                          {document.fileType}
                        </div>
                        {document.aiSummary && (
                          <div className="flex items-center text-corporate-primary">
                            <Brain className="h-3 w-3 mr-1" />
                            AI Analyzed
                          </div>
                        )}
                      </div>
                      {document.tags && document.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {document.tags.map((tag: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              <Tag className="h-2 w-2 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDocument(document)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDocument(document.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Document View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>{selectedDocument?.title}</span>
            </DialogTitle>
          </DialogHeader>
          {selectedDocument && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-1">Category</h4>
                  <p className="text-sm text-gray-600">{selectedDocument.category}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-1">Created</h4>
                  <p className="text-sm text-gray-600">
                    {new Date(selectedDocument.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-1">File Type</h4>
                  <p className="text-sm text-gray-600">{selectedDocument.fileType}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-1">Filename</h4>
                  <p className="text-sm text-gray-600">{selectedDocument.filename}</p>
                </div>
              </div>

              {selectedDocument.aiSummary && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-sm text-corporate-secondary mb-2 flex items-center">
                    <Brain className="h-4 w-4 mr-2 text-corporate-primary" />
                    AI Summary
                  </h4>
                  <p className="text-sm text-gray-700">{selectedDocument.aiSummary}</p>
                </div>
              )}

              {selectedDocument.tags && selectedDocument.tags.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedDocument.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-2">Content</h4>
                <div className="p-4 bg-white border rounded-lg max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                    {selectedDocument.content}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
