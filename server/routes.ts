import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { openaiService, type SearchResult } from "./services/openai";
import { 
  insertTicketSchema, 
  insertDocumentSchema, 
  insertResponseTemplateSchema, 
  insertSearchHistorySchema 
} from "@shared/schema";
import multer from "multer";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Stats endpoint
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error?.message || "Unknown error" });
    }
  });

  // Ticket routes
  app.get("/api/tickets", async (req, res) => {
    try {
      const tickets = await storage.getAllTickets();
      res.json(tickets);
    } catch (error: any) {
      res.status(500).json({ error: error?.message || "Unknown error" });
    }
  });

  app.get("/api/tickets/:id", async (req, res) => {
    try {
      const ticket = await storage.getTicket(parseInt(req.params.id));
      if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
      }
      res.json(ticket);
    } catch (error: any) {
      res.status(500).json({ error: error?.message || "Unknown error" });
    }
  });

  app.post("/api/tickets", async (req, res) => {
    try {
      const ticketData = insertTicketSchema.parse(req.body);
      const ticket = await storage.createTicket(ticketData);
      res.json(ticket);
    } catch (error: any) {
      res.status(400).json({ error: error?.message || "Unknown error" });
    }
  });

  app.post("/api/tickets/:id/analyze", async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const ticket = await storage.getTicket(ticketId);
      
      if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
      }

      const analysis = await openaiService.analyzeTicket(ticket.originalContent || ticket.description);
      
      const updatedTicket = await storage.updateTicket(ticketId, {
        aiSummary: analysis.summary,
        aiAnalysis: analysis,
        priority: analysis.priority,
        category: analysis.category
      });

      res.json({ ticket: updatedTicket, analysis });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || "Unknown error" });
    }
  });

  app.put("/api/tickets/:id", async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const updates = req.body;
      const ticket = await storage.updateTicket(ticketId, updates);
      
      if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
      }
      
      res.json(ticket);
    } catch (error: any) {
      res.status(500).json({ error: error?.message || "Unknown error" });
    }
  });

  app.delete("/api/tickets/:id", async (req, res) => {
    try {
      const success = await storage.deleteTicket(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ error: "Ticket not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || "Unknown error" });
    }
  });

  // Document routes
  app.get("/api/documents", async (req, res) => {
    try {
      const documents = await storage.getAllDocuments();
      res.json(documents);
    } catch (error: any) {
      res.status(500).json({ error: error?.message || "Unknown error" });
    }
  });

  app.get("/api/documents/:id", async (req, res) => {
    try {
      const document = await storage.getDocument(parseInt(req.params.id));
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.json(document);
    } catch (error: any) {
      res.status(500).json({ error: error?.message || "Unknown error" });
    }
  });

  app.post("/api/documents", upload.single('file'), async (req: MulterRequest, res) => {
    try {
      let documentData;
      
      if (req.file) {
        // Handle file upload
        let content: string;
        
        // Handle different file types
        if (req.file.mimetype.startsWith('text/') || 
            req.file.mimetype === 'application/json' ||
            req.file.mimetype === 'application/xml' ||
            req.file.originalname.endsWith('.txt') ||
            req.file.originalname.endsWith('.md') ||
            req.file.originalname.endsWith('.csv')) {
          // Text files - convert to UTF-8
          try {
            content = req.file.buffer.toString('utf-8');
          } catch (e) {
            // If UTF-8 fails, try latin1
            content = req.file.buffer.toString('latin1');
          }
        } else if (req.file.mimetype === 'application/pdf' ||
                   req.file.originalname.endsWith('.pdf')) {
          // PDF files - extract actual text content
          try {
            const pdfExtract = (await import("pdf-text-extract")).default;
            
            // Write buffer to temporary file
            const tempFile = path.join(os.tmpdir(), `temp_${Date.now()}.pdf`);
            fs.writeFileSync(tempFile, req.file.buffer);
            
            // Extract text
            const pages = await new Promise<string[]>((resolve, reject) => {
              pdfExtract(tempFile, (err: any, pages: string[]) => {
                if (err) reject(err);
                else resolve(pages);
              });
            });
            
            // Clean up temp file
            fs.unlinkSync(tempFile);
            
            const extractedText = pages.join('\n\n--- Page Break ---\n\n');
            content = extractedText || `[PDF Document: ${req.file.originalname}]\nText extraction failed, but file was uploaded successfully.\nSize: ${req.file.size} bytes\nPages: ${pages.length}\nUploaded: ${new Date().toISOString()}`;
          } catch (pdfError: any) {
            content = `[PDF Document: ${req.file.originalname}]\nText extraction failed: ${pdfError.message}\nSize: ${req.file.size} bytes\nUploaded: ${new Date().toISOString()}`;
          }
        } else if (req.file.mimetype.startsWith('application/') && 
                   (req.file.originalname.endsWith('.doc') || 
                    req.file.originalname.endsWith('.docx') ||
                    req.file.originalname.endsWith('.rtf'))) {
          // Document files - store metadata
          content = `[Document: ${req.file.originalname}]\nSize: ${req.file.size} bytes\nType: ${req.file.mimetype}\nStatus: Processing for AI analysis...\nUploaded: ${new Date().toISOString()}`;
        } else if (req.file.mimetype.startsWith('image/')) {
          // Images - store metadata and will be analyzed
          content = `[Image: ${req.file.originalname}]\nSize: ${req.file.size} bytes\nType: ${req.file.mimetype}\nStatus: Processing for visual analysis...\nUploaded: ${new Date().toISOString()}`;
        } else {
          // Other binary files - store metadata only
          content = `[File: ${req.file.originalname}]\nSize: ${req.file.size} bytes\nType: ${req.file.mimetype}\nUploaded: ${new Date().toISOString()}`;
        }
        
        documentData = {
          title: req.body.title || req.file.originalname,
          content: content,
          filename: req.file.originalname,
          fileType: req.file.mimetype,
          category: req.body.category || "general",
          tags: req.body.tags ? JSON.parse(req.body.tags) : []
        };
      } else {
        // Handle JSON data
        documentData = insertDocumentSchema.parse(req.body);
      }

      const document = await storage.createDocument(documentData);
      
      // Generate AI summary for text content only (skip AI for metadata-only content)
      try {
        const hasTextContent = document.content && 
          document.content.length > 100 && 
          !document.content.startsWith('[') && 
          !document.content.includes('Text extraction failed');

        const shouldAnalyze = req.file && hasTextContent && (
          req.file.mimetype.startsWith('text/') || 
          req.file.mimetype === 'application/json' ||
          req.file.mimetype === 'application/pdf' ||
          req.file.originalname.endsWith('.txt') ||
          req.file.originalname.endsWith('.md') ||
          req.file.originalname.endsWith('.csv') ||
          req.file.originalname.endsWith('.pdf')
        );

        if (shouldAnalyze) {
          // Process in background to avoid blocking the response
          setTimeout(async () => {
            try {
              const summary = await openaiService.summarizeDocument(document.content, document.filename);
              await storage.updateDocument(document.id, {
                aiSummary: summary.summary,
                tags: [...(document.tags || []), ...summary.tags]
              });
            } catch (bgError: any) {
              console.warn("Background AI summary failed:", bgError?.message || "Unknown error");
            }
          }, 100);
        }
      } catch (aiError: any) {
        console.warn("Failed to set up AI summary:", aiError?.message || "Unknown error");
      }

      res.json(document);
    } catch (error: any) {
      res.status(400).json({ error: error?.message || "Unknown error" });
    }
  });

  app.put("/api/documents/:id", async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const updates = req.body;
      const document = await storage.updateDocument(documentId, updates);
      
      if (!document) {
        return res.status(404).json({ error: "Document not found" });
      }
      
      res.json(document);
    } catch (error: any) {
      res.status(500).json({ error: error?.message || "Unknown error" });
    }
  });

  app.delete("/api/documents/:id", async (req, res) => {
    try {
      const success = await storage.deleteDocument(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || "Unknown error" });
    }
  });

  // Search routes
  app.get("/api/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: "Query parameter required" });
      }

      const documents = await storage.searchDocuments(query);
      const tickets = await storage.getAllTickets();
      
      // Filter tickets by search query
      const relevantTickets = tickets.filter(ticket => 
        ticket.title.toLowerCase().includes(query.toLowerCase()) ||
        ticket.description.toLowerCase().includes(query.toLowerCase()) ||
        ticket.aiSummary?.toLowerCase().includes(query.toLowerCase())
      );

      // Use AI to provide smart search results
      let aiResults: SearchResult[] = [];
      try {
        aiResults = await openaiService.searchKnowledge(query, documents);
      } catch (aiError: any) {
        console.warn("AI search failed:", aiError?.message || "Unknown error");
      }

      // Save search history
      await storage.createSearchHistory({
        query,
        results: { documents, tickets: relevantTickets, aiResults }
      });

      res.json({
        documents,
        tickets: relevantTickets,
        aiResults
      });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || "Unknown error" });
    }
  });

  // Response template routes
  app.get("/api/response-templates", async (req, res) => {
    try {
      const templates = await storage.getAllResponseTemplates();
      res.json(templates);
    } catch (error: any) {
      res.status(500).json({ error: error?.message || "Unknown error" });
    }
  });

  app.get("/api/response-templates/:id", async (req, res) => {
    try {
      const template = await storage.getResponseTemplate(parseInt(req.params.id));
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json(template);
    } catch (error: any) {
      res.status(500).json({ error: error?.message || "Unknown error" });
    }
  });

  app.post("/api/response-templates", async (req, res) => {
    try {
      const templateData = insertResponseTemplateSchema.parse(req.body);
      const template = await storage.createResponseTemplate(templateData);
      res.json(template);
    } catch (error: any) {
      res.status(400).json({ error: error?.message || "Unknown error" });
    }
  });

  app.put("/api/response-templates/:id", async (req, res) => {
    try {
      const templateId = parseInt(req.params.id);
      const updates = req.body;
      const template = await storage.updateResponseTemplate(templateId, updates);
      
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      
      res.json(template);
    } catch (error: any) {
      res.status(500).json({ error: error?.message || "Unknown error" });
    }
  });

  app.delete("/api/response-templates/:id", async (req, res) => {
    try {
      const success = await storage.deleteResponseTemplate(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error?.message || "Unknown error" });
    }
  });

  // AI response drafting
  app.post("/api/draft-response", async (req, res) => {
    try {
      const { ticketId, templateId, customContext } = req.body;
      
      const ticket = await storage.getTicket(ticketId);
      if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
      }

      let template = null;
      if (templateId) {
        template = await storage.getResponseTemplate(templateId);
      }

      const draft = await openaiService.draftResponse(
        ticket.originalContent || ticket.description,
        customContext || ticket.aiSummary || "",
        template?.content
      );

      res.json(draft);
    } catch (error: any) {
      res.status(500).json({ error: error?.message || "Unknown error" });
    }
  });

  // Search history
  app.get("/api/search-history", async (req, res) => {
    try {
      const history = await storage.getSearchHistory();
      res.json(history);
    } catch (error: any) {
      res.status(500).json({ error: error?.message || "Unknown error" });
    }
  });

  // Chat endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, sessionId } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: "Message is required" });
      }

      // Generate session ID if not provided
      const chatSessionId = sessionId || `session_${Date.now()}`;

      // Get conversation history for context
      const conversationHistory = await storage.getChatConversations(chatSessionId);
      const recentHistory = conversationHistory
        .slice(-10) // Keep last 10 messages for context
        .map(conv => [
          { role: "user", content: conv.userMessage },
          { role: "assistant", content: conv.botResponse }
        ])
        .flat();

      // Get documents and tickets for context
      const documents = await storage.getAllDocuments();
      const tickets = await storage.getAllTickets();

      // Get AI response
      const chatResponse = await openaiService.chatWithBot(
        message,
        recentHistory,
        documents,
        tickets
      );

      // Save conversation to storage
      await storage.createChatConversation({
        sessionId: chatSessionId,
        userMessage: message,
        botResponse: chatResponse.response,
        confidence: Math.round(chatResponse.confidence * 100),
        sources: chatResponse.sources,
        actionTaken: chatResponse.actionTaken
      });

      res.json({
        response: chatResponse.response,
        confidence: chatResponse.confidence,
        sources: chatResponse.sources,
        actionTaken: chatResponse.actionTaken,
        sessionId: chatSessionId
      });
    } catch (error: any) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Failed to process chat message" });
    }
  });

  // Get chat history
  app.get("/api/chat/history", async (req, res) => {
    try {
      const { sessionId } = req.query;
      const conversations = await storage.getChatConversations(sessionId as string);
      res.json(conversations);
    } catch (error: any) {
      console.error("Chat history error:", error);
      res.status(500).json({ error: "Failed to get chat history" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}