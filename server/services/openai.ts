import OpenAI from "openai";
import { initClient, monitor } from "../../lib/api-sdk/index";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey:
    process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "",
});

initClient({
  apiKey: "da9b7d98-0233-4ab8-a508-b4e79410dc12",
  domainURL: "https://staging.app.olakai.ai",
  debug: true,
  verbose: true,
});

const monitoredTicketAnalysis = monitor<[string], TicketAnalysis>({
  task: "Support",
  subTask: "Ticket Analysis",
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
  task: "QoF",
  subTask: "Summarize Document",
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
  task: "Support",
  subTask: "Draft Response",
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
  task: "Learning",
  subTask: "Search Knowledge",
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

export interface ChatResponse {
  response: string;
  confidence: number;
  sources: string[];
  actionTaken?: string;
}

export class OpenAIService {
  async analyzeTicket(content: string): Promise<TicketAnalysis> {
    const monitoredFunction = monitoredTicketAnalysis(
      async (content: string): Promise<TicketAnalysis> => {
        if (!openai.apiKey) {
          throw new Error("OpenAI API key not configured");
        }

        try {
          const response = await openai.chat.completions.create({
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

          return result;
        } catch (error) {
          throw new Error(`Failed to analyze ticket: ${error}`);
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
          throw new Error(`Failed to analyze document: ${error}`);
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
          throw new Error(`Failed to draft response: ${error}`);
        }
      },
    );

    return monitoredFunction(ticketContent, context, template);
  }

  async searchKnowledge(
    query: string,
    documents: any[],
  ): Promise<SearchResult[]> {
    const monitoredFunction = monitoredSearchKnowledge(
      async (query: string, documents: any[]): Promise<SearchResult[]> => {
        if (!openai.apiKey) {
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
          throw new Error(`Failed to search knowledge: ${error}`);
        }
      },
    );

    return monitoredFunction(query, documents);
  }

  async chatWithBot(
    userMessage: string,
    conversationHistory: { role: string; content: string }[] = [],
    documents: any[] = [],
    tickets: any[] = [],
  ): Promise<ChatResponse> {
    if (!openai.apiKey) {
      throw new Error("OpenAI API key not configured");
    }

    try {
      // Search for relevant documents and tickets
      const relevantDocs = documents
        .filter(
          (doc) =>
            doc.content.toLowerCase().includes(userMessage.toLowerCase()) ||
            doc.title.toLowerCase().includes(userMessage.toLowerCase()) ||
            doc.aiSummary?.toLowerCase().includes(userMessage.toLowerCase()),
        )
        .slice(0, 3);

      const relevantTickets = tickets
        .filter(
          (ticket) =>
            ticket.title.toLowerCase().includes(userMessage.toLowerCase()) ||
            ticket.description
              .toLowerCase()
              .includes(userMessage.toLowerCase()) ||
            ticket.aiSummary?.toLowerCase().includes(userMessage.toLowerCase()),
        )
        .slice(0, 3);

      // Build context from relevant documents and tickets
      let contextInfo = "";
      if (relevantDocs.length > 0) {
        contextInfo += "\n\nRelevant Documentation:\n";
        relevantDocs.forEach((doc) => {
          contextInfo += `- ${doc.title}: ${doc.aiSummary || doc.content.substring(0, 200)}...\n`;
        });
      }

      if (relevantTickets.length > 0) {
        contextInfo += "\n\nRelevant Tickets:\n";
        relevantTickets.forEach((ticket) => {
          contextInfo += `- ${ticket.title} (${ticket.priority}): ${ticket.aiSummary || ticket.description.substring(0, 200)}...\n`;
        });
      }

      const messages = [
        {
          role: "system",
          content: `You are an intelligent AI support assistant for a corporate help desk system. 
          
          Your capabilities include:
          - Answering questions about documentation and knowledge base
          - Helping with ticket management and support issues
          - Providing guidance on company policies and procedures
          - Offering troubleshooting assistance
          - Escalating complex issues when needed
          
          Guidelines:
          - Be helpful, professional, and empathetic
          - Provide accurate information based on available context
          - If you don't know something, say so and offer to escalate
          - Use bullet points for step-by-step instructions
          - Keep responses concise but comprehensive
          - Include relevant sources when referencing documentation
          
          Available context:${contextInfo}
          
          If you need to perform an action (like creating a ticket, searching documents, etc.), 
          mention this in your response and indicate what action would be helpful.`,
        },
        ...conversationHistory,
        {
          role: "user",
          content: userMessage,
        },
      ];

      const requestPayload = {
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      };

      // Fix: Ensure messages are typed correctly for OpenAI API
      const response = await openai.chat.completions.create({
        ...requestPayload,
        messages:
          messages as import("openai/resources/chat").ChatCompletionMessageParam[],
      });
      const botResponse =
        response.choices[0]?.message?.content ||
        "I'm sorry, I couldn't generate a response.";

      // Calculate confidence based on context relevance and response quality
      const confidence = Math.min(
        0.95,
        0.6 +
          (relevantDocs.length > 0 ? 0.2 : 0) +
          (relevantTickets.length > 0 ? 0.1 : 0) +
          (botResponse.length > 50 ? 0.05 : 0),
      );

      // Extract sources
      const sources = [
        ...relevantDocs.map((doc) => doc.title),
        ...relevantTickets.map((ticket) => ticket.title),
      ];

      // Check if bot suggests any actions
      const suggestsAction =
        botResponse.toLowerCase().includes("create") ||
        botResponse.toLowerCase().includes("escalate") ||
        botResponse.toLowerCase().includes("search") ||
        botResponse.toLowerCase().includes("update");

      const result: ChatResponse = {
        response: botResponse,
        confidence,
        sources,
        actionTaken: suggestsAction ? "action_suggested" : undefined,
      };

      return result;
    } catch (error) {
      throw new Error(`Failed to process chat message: ${error}`);
    }
  }
}

export const openaiService = new OpenAIService();
