import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Search, Brain, Clock, Database, FileText, ExternalLink } from "lucide-react";

export default function Knowledge() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  const { data: documents, isLoading: documentsLoading } = useQuery({
    queryKey: ["/api/documents"],
  });

  const { data: searchHistory } = useQuery({
    queryKey: ["/api/search-history"],
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "No search query",
        description: "Please enter a search query",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setSearchResults(data);
      toast({
        title: "Search completed",
        description: `Found ${data.documents?.length || 0} documents and ${data.tickets?.length || 0} tickets`,
      });
    } catch (error) {
      toast({
        title: "Search failed",
        description: "Unable to perform search",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const popularSearches = [
    "API Documentation",
    "Troubleshooting Guide",
    "Account Setup",
    "Billing Issues",
    "Feature Requests",
    "Security Guidelines"
  ];

  return (
    <div className="space-y-8">
      {/* Search Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-corporate-secondary">
            AI-Powered Knowledge Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search across docs, wikis, and tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10"
              />
            </div>
            <Button 
              className="bg-corporate-primary hover:bg-blue-600"
              onClick={handleSearch}
              disabled={isSearching}
            >
              <Brain className="h-4 w-4 mr-2" />
              {isSearching ? "Searching..." : "AI Search"}
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {popularSearches.map((search, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="cursor-pointer hover:bg-gray-200"
                onClick={() => setSearchQuery(search)}
              >
                {search}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults && (
        <div className="space-y-6">
          {/* AI Results */}
          {searchResults.aiResults && searchResults.aiResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-corporate-secondary flex items-center">
                  <Brain className="h-5 w-5 mr-2 text-corporate-primary" />
                  AI-Generated Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {searchResults.aiResults.map((result: any, index: number) => (
                    <div key={index} className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-corporate-secondary">{result.source}</h4>
                        <Badge variant="secondary">
                          {Math.round(result.relevance * 100)}% match
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{result.content}</p>
                      <p className="text-xs text-gray-500">{result.context}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documents */}
          {searchResults.documents && searchResults.documents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-corporate-secondary flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-corporate-accent" />
                  Documents ({searchResults.documents.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {searchResults.documents.map((doc: any) => (
                    <div key={doc.id} className="p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-corporate-secondary">{doc.title}</h4>
                        <Badge variant="outline">{doc.category}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {doc.aiSummary || doc.content.substring(0, 200)}...
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{doc.filename}</span>
                        <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                      </div>
                      {doc.tags && doc.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {doc.tags.map((tag: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tickets */}
          {searchResults.tickets && searchResults.tickets.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-corporate-secondary flex items-center">
                  <Database className="h-5 w-5 mr-2 text-corporate-warning" />
                  Related Tickets ({searchResults.tickets.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {searchResults.tickets.map((ticket: any) => (
                    <div key={ticket.id} className="p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-corporate-secondary">{ticket.title}</h4>
                        <Badge 
                          className={
                            ticket.priority === "high" ? "bg-red-100 text-red-800" :
                            ticket.priority === "medium" ? "bg-yellow-100 text-yellow-800" :
                            "bg-green-100 text-green-800"
                          }
                        >
                          {ticket.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {ticket.aiSummary || ticket.description.substring(0, 200)}...
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Status: {ticket.status}</span>
                        <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Knowledge Base Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-corporate-secondary">
              Knowledge Base Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {documentsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse bg-gray-100 h-16 rounded-lg" />
                ))}
              </div>
            ) : documents?.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No documents in knowledge base yet.
              </p>
            ) : (
              <div className="space-y-4">
                {documents?.slice(0, 5).map((doc: any) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium text-corporate-secondary">{doc.title}</h4>
                      <p className="text-xs text-gray-500">{doc.category}</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </div>
                ))}
                {documents && documents.length > 5 && (
                  <Button variant="outline" size="sm" className="w-full">
                    View All Documents
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-corporate-secondary">
              Recent Searches
            </CardTitle>
          </CardHeader>
          <CardContent>
            {searchHistory?.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No search history yet.
              </p>
            ) : (
              <div className="space-y-3">
                {searchHistory?.slice(0, 5).map((search: any) => (
                  <div key={search.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium text-corporate-secondary">{search.query}</h4>
                      <p className="text-xs text-gray-500 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(search.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSearchQuery(search.query)}
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
