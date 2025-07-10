import OpenAI from "openai";
import { initClient, monitor } from "../../lib/api-sdk/src/";

// Debug logging utility
const debugLog = (operation: string, data: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [OpenAI-${operation}]`, JSON.stringify(data, null, 2));
};

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey:
    process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "",
});

// Log initialization
debugLog("INIT", {
  hasApiKey: !!openai.apiKey,
  apiKeyPrefix: openai.apiKey ? openai.apiKey.slice(0, 10) + "..." : "none",
  model: "gpt-4o",
  sdkVersion: "4.0"
});

initClient("0db92d0c-a8e5-47a4-befb-bbb48d2f6c86");

const monitoredTicketAnalysis = monitor<[string], TicketAnalysis>({
  name: "ticket_analysis",
  capture: ({ args, result }) => ({
    input: args[0],
    output: result,
  }),
  onError: (error, args) => ({
    input: { content: args[0] },
    output: { error: error.message },
  }),
});

const monitoredSummarizeDocument = monitor<[string, string], DocumentSummary>({
  name: "summarize_document",
  capture: ({ args, result }) => ({
    input: { content: args[0], filename: args[1] },
    output: result,
  }),
  onError: (error, args) => ({
    input: { content: args[0], filename: args[1] },
    output: { error: error.message },
  }),
});

const monitoredDraftResponse = monitor<
  [string, string, string?],
  ResponseDraft
>({
  name: "draft_response",
  capture: ({ args, result }) => ({
    input: { ticketContent: args[0], context: args[1], template: args[2] },
    output: result,
  }),
  onError: (error, args) => ({
    input: { ticketContent: args[0], context: args[1], template: args[2] },
    output: { error: error.message },
  }),
});

const monitoredSearchKnowledge = monitor<[string, any[]], SearchResult[]>({
  name: "search_knowledge",
  capture: ({ args, result }) => ({
    input: { query: args[0], documentsCount: args[1].length },
    output: result,
  }),
  onError: (error, args) => ({
    input: { query: args[0], documentsCount: args[1].length },
    output: { error: error.message },
  }),
});

export interface TicketAnalysis {
  summary: string;
  priority: "low" | "medium" | "high";
  category: string;
  urgency: number;
  sentiment: "positive" | "neutral" | "negative";
  suggestedActions: string[];
  estimatedResolutionTime: string;
}

export interface DocumentSummary {
  summary: string;
  keyPoints: string[];
  category: string;
  tags: string[];
  searchableTerms: string[];
}

export interface ResponseDraft {
  content: string;
  tone: "professional" | "friendly" | "formal";
  confidence: number;
  suggestions: string[];
}

export interface SearchResult {
  content: string;
  relevance: number;
  source: string;
  context: string;
}

export class OpenAIService {
  async analyzeTicket(content: string): Promise<TicketAnalysis> {
    const startTime = Date.now();
    debugLog("ANALYZE_TICKET_START", {
      contentLength: content.length,
      contentPreview: content.substring(0, 100) + "...",
      timestamp: new Date().toISOString()
    });

    const monitoredFunction = monitoredTicketAnalysis(
      async (content: string): Promise<TicketAnalysis> => {
        if (!openai.apiKey) {
          debugLog("ANALYZE_TICKET_ERROR", { error: "OpenAI API key not configured" });
          throw new Error("OpenAI API key not configured");
        }

        try {
          const requestPayload = {
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: `You are an expert customer support AI that analyzes support tickets. 
              Analyze the ticket content and provide a comprehensive analysis in JSON format with:
              - summary: A clear, concise summary of the issue
              - priority: "low", "medium", or "high" based on urgency and impact
              - category: The main category of the issue (e.g., "technical", "account", "billing", "feature_request")
              - urgency: A number from 1-10 indicating how urgent this issue is
              - sentiment: "positive", "neutral", or "negative" based on customer tone
              - suggestedActions: Array of specific actions to resolve the issue
              - estimatedResolutionTime: Estimated time to resolve (e.g., "2-4 hours", "1-2 days")
              
              Respond only with valid JSON.`,
              },
              {
                role: "user",
                content: `Analyze this support ticket: ${content}`,
              },
            ],
            response_format: { type: "json_object" },
            temperature: 0.3,
          };

          debugLog("ANALYZE_TICKET_REQUEST", {
            model: requestPayload.model,
            temperature: requestPayload.temperature,
            messagesCount: requestPayload.messages.length,
            systemPromptLength: requestPayload.messages[0].content.length,
            userContentLength: requestPayload.messages[1].content.length
          });

          const response = await openai.chat.completions.create(requestPayload);

          debugLog("ANALYZE_TICKET_RESPONSE", {
            id: response.id,
            model: response.model,
            usage: response.usage,
            finishReason: response.choices[0].finish_reason,
            responseLength: response.choices[0].message.content?.length || 0,
            duration: Date.now() - startTime
          });

          const analysis = JSON.parse(
            response.choices[0].message.content || "{}",
          );
          
          const result = {
            summary: analysis.summary || "Unable to analyze ticket",
            priority: analysis.priority || "medium",
            category: analysis.category || "general",
            urgency: analysis.urgency || 5,
            sentiment: analysis.sentiment || "neutral",
            suggestedActions: analysis.suggestedActions || [],
            estimatedResolutionTime:
              analysis.estimatedResolutionTime || "1-2 days",
          };

          debugLog("ANALYZE_TICKET_SUCCESS", {
            result,
            totalDuration: Date.now() - startTime
          });

          return result;
        } catch (error) {
          debugLog("ANALYZE_TICKET_ERROR", {
            error: error.message,
            stack: error.stack,
            duration: Date.now() - startTime
          });
          throw new Error(`Failed to analyze ticket: ${error.message}`);
        }
      },
    );

    return monitoredFunction(content);
  }

  async summarizeDocument(
    content: string,
    filename: string,
  ): Promise<DocumentSummary> {
    const monitoredFunction = monitoredSummarizeDocument(
      async (content: string, filename: string): Promise<DocumentSummary> => {
        if (!openai.apiKey) {
          throw new Error("OpenAI API key not configured");
        }

        try {
          // Determine document type and create appropriate analysis
          const isImageFile = filename
            .toLowerCase()
            .match(/\.(jpg|jpeg|png|gif|bmp|webp)$/);
          const isPdfFile = filename.toLowerCase().match(/\.pdf$/);
          const isDocFile = filename.toLowerCase().match(/\.(doc|docx|rtf)$/);

          let systemPrompt = `You are a document analysis AI. Analyze the document content and provide a comprehensive summary in JSON format with:
          - summary: A clear, concise summary of the document
          - keyPoints: Array of main points or topics covered
          - category: The main category (e.g., "documentation", "policy", "guide", "faq", "image", "pdf", "spreadsheet")
          - tags: Array of relevant tags for search and categorization
          - searchableTerms: Array of important terms that would help users find this document
          
          Respond only with valid JSON.`;

          let userContent = `Analyze this document (filename: ${filename}): ${content.substring(
            0,
            4000,
          )}`;

          if (isImageFile) {
            systemPrompt = `You are analyzing an image file. Based on the metadata provided, create a comprehensive analysis in JSON format with:
            - summary: Description of what this image contains or represents
            - keyPoints: Array of key visual elements or information
            - category: "image" or more specific like "screenshot", "diagram", "photo"
            - tags: Relevant tags for search and categorization
            - searchableTerms: Terms that would help users find this image`;

            userContent = `Analyze this image file (filename: ${filename}): ${content}`;
          } else if (isPdfFile || isDocFile) {
            systemPrompt = `You are analyzing a ${
              isPdfFile ? "PDF" : "document"
            } file. Based on the metadata and any available content, create a comprehensive analysis in JSON format with:
            - summary: Description of the document's purpose and content
            - keyPoints: Array of main topics or sections likely covered
            - category: Document type like "manual", "report", "policy", "guide"
            - tags: Relevant tags for search and categorization
            - searchableTerms: Terms that would help users find this document`;

            userContent = `Analyze this ${
              isPdfFile ? "PDF" : "document"
            } file (filename: ${filename}): ${content}`;
          }

          const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: systemPrompt,
              },
              {
                role: "user",
                content: userContent,
              },
            ],
            response_format: { type: "json_object" },
            temperature: 0.3,
          });

          const summary = JSON.parse(
            response.choices[0].message.content || "{}",
          );
          return {
            summary: summary.summary || "Unable to analyze document",
            keyPoints: summary.keyPoints || [],
            category: summary.category || "general",
            tags: summary.tags || [],
            searchableTerms: summary.searchableTerms || [],
          };
        } catch (error) {
          throw new Error(`Failed to analyze document: ${error.message}`);
        }
      },
    );

    return monitoredFunction(content, filename);
  }

  async draftResponse(
    ticketContent: string,
    context: string,
    template?: string,
  ): Promise<ResponseDraft> {
    const monitoredFunction = monitoredDraftResponse(
      async (
        ticketContent: string,
        context: string,
        template?: string,
      ): Promise<ResponseDraft> => {
        if (!openai.apiKey) {
          throw new Error("OpenAI API key not configured");
        }

        try {
          const systemPrompt = template
            ? `You are a customer support AI. Draft a professional response based on the template provided. 
               Customize the template to address the specific issue while maintaining a professional tone.
               Template: ${template}`
            : `You are a customer support AI. Draft a professional, helpful response to the customer's issue.
               Use a friendly but professional tone. Be specific and actionable.`;

          const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: `${systemPrompt}
                
                Respond with JSON containing:
                - content: The drafted response
                - tone: "professional", "friendly", or "formal"
                - confidence: Number from 0-1 indicating confidence in the response
                - suggestions: Array of additional suggestions for improvement
                
                Respond only with valid JSON.`,
              },
              {
                role: "user",
                content: `Draft a response for this ticket: ${ticketContent}
                
                Additional context: ${context}`,
              },
            ],
            response_format: { type: "json_object" },
            temperature: 0.4,
          });

          const draft = JSON.parse(response.choices[0].message.content || "{}");
          return {
            content: draft.content || "Unable to draft response",
            tone: draft.tone || "professional",
            confidence: draft.confidence || 0.7,
            suggestions: draft.suggestions || [],
          };
        } catch (error) {
          throw new Error(`Failed to draft response: ${error.message}`);
        }
      },
    );

    return monitoredFunction(ticketContent, context, template);
  }

  async searchKnowledge(
    query: string,
    documents: any[],
  ): Promise<SearchResult[]> {
    const startTime = Date.now();
    debugLog("SEARCH_KNOWLEDGE_START", {
      query,
      documentsCount: documents.length,
      timestamp: new Date().toISOString()
    });

    const monitoredFunction = monitoredSearchKnowledge(
      async (query: string, documents: any[]): Promise<SearchResult[]> => {
        if (!openai.apiKey) {
          debugLog("SEARCH_KNOWLEDGE_ERROR", { error: "OpenAI API key not configured" });
          throw new Error("OpenAI API key not configured");
        }

        try {
          // Enhanced filtering with better scoring
          const relevantDocs = documents
            .filter((doc) => {
              const queryLower = query.toLowerCase();
              const titleMatch = doc.title.toLowerCase().includes(queryLower);
              const contentMatch = doc.content
                .toLowerCase()
                .includes(queryLower);
              const tagMatch = doc.tags?.some((tag: string) =>
                tag.toLowerCase().includes(queryLower),
              );
              const summaryMatch = doc.aiSummary
                ?.toLowerCase()
                .includes(queryLower);

              return titleMatch || contentMatch || tagMatch || summaryMatch;
            })
            .map((doc) => ({
              ...doc,
              // Add relevance score based on where the match occurs
              searchScore:
                (doc.title.toLowerCase().includes(query.toLowerCase())
                  ? 3
                  : 0) +
                (doc.aiSummary?.toLowerCase().includes(query.toLowerCase())
                  ? 2
                  : 0) +
                (doc.content.toLowerCase().includes(query.toLowerCase())
                  ? 1
                  : 0) +
                (doc.tags?.some((tag: string) =>
                  tag.toLowerCase().includes(query.toLowerCase()),
                )
                  ? 1
                  : 0),
            }))
            .sort((a, b) => b.searchScore - a.searchScore);

          debugLog("SEARCH_KNOWLEDGE_FILTERING", {
            totalDocs: documents.length,
            relevantDocs: relevantDocs.length,
            topScores: relevantDocs.slice(0, 3).map(doc => ({
              title: doc.title,
              score: doc.searchScore
            })),
            filteringTime: Date.now() - startTime
          });

          if (relevantDocs.length === 0) {
            debugLog("SEARCH_KNOWLEDGE_NO_RESULTS", { 
              query, 
              totalDocs: documents.length,
              duration: Date.now() - startTime 
            });
            return [];
          }

          const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: `You are an expert knowledge search AI. Given a user query and relevant documents, 
                provide the most helpful and accurate information that answers the query.
                
                Focus on:
                - Extracting the most relevant information from documents
                - Providing specific details and examples when available
                - Summarizing key concepts clearly
                - Highlighting practical information users can act on
                
                Return JSON with an array of search results, each containing:
                - content: The relevant information that answers the query (be specific and detailed)
                - relevance: Number from 0-1 indicating how relevant this content is
                - source: The document title or source
                - context: Brief context about where this information comes from and why it's useful
                
                Respond only with valid JSON containing a "results" array.`,
              },
              {
                role: "user",
                content: `Query: "${query}"
                
                Available documents (sorted by relevance):
                ${relevantDocs
                  .map(
                    (doc, index) => `
Document ${index + 1}:
Title: ${doc.title}
AI Summary: ${doc.aiSummary || "No summary available"}
Content Preview: ${doc.content.substring(0, 800)}...
Tags: ${doc.tags?.join(", ") || "No tags"}
`,
                  )
                  .join("\n")}`,
              },
            ],
            response_format: { type: "json_object" },
            temperature: 0.3,
          });

          const searchResults = JSON.parse(
            response.choices[0].message.content || "{}",
          );
          return searchResults.results || [];
        } catch (error) {
          throw new Error(`Failed to search knowledge: ${error.message}`);
        }
      },
    );

    return monitoredFunction(query, documents);
  }
}

export const openaiService = new OpenAIService();
