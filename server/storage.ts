import { 
  users, 
  tickets, 
  documents, 
  responseTemplates, 
  searchHistory,
  type User, 
  type InsertUser,
  type Ticket,
  type InsertTicket,
  type Document,
  type InsertDocument,
  type ResponseTemplate,
  type InsertResponseTemplate,
  type SearchHistory,
  type InsertSearchHistory
} from "@shared/schema";
import { db } from "./db";
import { eq, like, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Ticket methods
  getAllTickets(): Promise<Ticket[]>;
  getTicket(id: number): Promise<Ticket | undefined>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  updateTicket(id: number, updates: Partial<Ticket>): Promise<Ticket | undefined>;
  deleteTicket(id: number): Promise<boolean>;

  // Document methods
  getAllDocuments(): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, updates: Partial<Document>): Promise<Document | undefined>;
  deleteDocument(id: number): Promise<boolean>;
  searchDocuments(query: string): Promise<Document[]>;

  // Response template methods
  getAllResponseTemplates(): Promise<ResponseTemplate[]>;
  getResponseTemplate(id: number): Promise<ResponseTemplate | undefined>;
  createResponseTemplate(template: InsertResponseTemplate): Promise<ResponseTemplate>;
  updateResponseTemplate(id: number, updates: Partial<ResponseTemplate>): Promise<ResponseTemplate | undefined>;
  deleteResponseTemplate(id: number): Promise<boolean>;

  // Search history methods
  getSearchHistory(): Promise<SearchHistory[]>;
  createSearchHistory(search: InsertSearchHistory): Promise<SearchHistory>;

  // Stats methods
  getStats(): Promise<{
    ticketsProcessed: number;
    documentsIndexed: number;
    avgResponseTime: string;
    autoResolved: string;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tickets: Map<number, Ticket>;
  private documents: Map<number, Document>;
  private responseTemplates: Map<number, ResponseTemplate>;
  private searchHistory: Map<number, SearchHistory>;
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.tickets = new Map();
    this.documents = new Map();
    this.responseTemplates = new Map();
    this.searchHistory = new Map();
    this.currentId = 1;

    // Initialize with some default response templates
    this.initializeDefaultTemplates();
  }

  private initializeDefaultTemplates() {
    const templates: InsertResponseTemplate[] = [
      {
        title: "Account Issue Response",
        content: "Thank you for contacting us regarding your account issue. We understand how important it is to have your account working properly, and we're here to help resolve this matter quickly.\n\nWe have received your request and our support team is currently investigating the issue. We will provide you with an update within 24 hours.\n\nIn the meantime, if you have any urgent concerns, please don't hesitate to contact us directly.\n\nBest regards,\nSupport Team",
        category: "account",
        tags: ["account", "standard", "acknowledgment"]
      },
      {
        title: "Technical Escalation",
        content: "Thank you for bringing this technical issue to our attention. We understand the complexity of your request and have escalated this to our technical team for further investigation.\n\nOur engineers are currently analyzing the issue and will provide you with a detailed response within 2-3 business days. We appreciate your patience as we work to resolve this matter.\n\nIf you have any additional information that might help with the investigation, please feel free to share it with us.\n\nBest regards,\nTechnical Support Team",
        category: "technical",
        tags: ["technical", "escalation", "engineering"]
      },
      {
        title: "Feature Request Acknowledgment",
        content: "Thank you for your feature request. We truly value feedback from our users as it helps us improve our product and better serve our community.\n\nYour request has been forwarded to our product development team for review and consideration. While we cannot guarantee implementation, all feature requests are carefully evaluated based on user needs and technical feasibility.\n\nWe will keep you updated on the status of your request. Thank you for taking the time to share your ideas with us.\n\nBest regards,\nProduct Team",
        category: "feature_request",
        tags: ["feature", "product", "acknowledgment"]
      }
    ];

    templates.forEach(template => {
      this.createResponseTemplate(template);
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Ticket methods
  async getAllTickets(): Promise<Ticket[]> {
    return Array.from(this.tickets.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getTicket(id: number): Promise<Ticket | undefined> {
    return this.tickets.get(id);
  }

  async createTicket(insertTicket: InsertTicket): Promise<Ticket> {
    const id = this.currentId++;
    const now = new Date();
    const ticket: Ticket = { 
      ...insertTicket,
      priority: insertTicket.priority || "medium",
      category: insertTicket.category || null,
      originalContent: insertTicket.originalContent || null,
      id, 
      status: "open",
      createdAt: now,
      updatedAt: now,
      aiSummary: null,
      aiAnalysis: null
    };
    this.tickets.set(id, ticket);
    return ticket;
  }

  async updateTicket(id: number, updates: Partial<Ticket>): Promise<Ticket | undefined> {
    const ticket = this.tickets.get(id);
    if (!ticket) return undefined;

    const updatedTicket = { ...ticket, ...updates, updatedAt: new Date() };
    this.tickets.set(id, updatedTicket);
    return updatedTicket;
  }

  async deleteTicket(id: number): Promise<boolean> {
    return this.tickets.delete(id);
  }

  // Document methods
  async getAllDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = this.currentId++;
    const now = new Date();
    const document: Document = { 
      ...insertDocument,
      category: insertDocument.category || null,
      tags: insertDocument.tags || null,
      id, 
      createdAt: now,
      updatedAt: now,
      aiSummary: null,
      searchVector: null
    };
    this.documents.set(id, document);
    return document;
  }

  async updateDocument(id: number, updates: Partial<Document>): Promise<Document | undefined> {
    const document = this.documents.get(id);
    if (!document) return undefined;

    const updatedDocument = { ...document, ...updates, updatedAt: new Date() };
    this.documents.set(id, updatedDocument);
    return updatedDocument;
  }

  async deleteDocument(id: number): Promise<boolean> {
    return this.documents.delete(id);
  }

  async searchDocuments(query: string): Promise<Document[]> {
    const queryLower = query.toLowerCase();
    return Array.from(this.documents.values()).filter(doc => 
      doc.title.toLowerCase().includes(queryLower) ||
      doc.content.toLowerCase().includes(queryLower) ||
      doc.category?.toLowerCase().includes(queryLower) ||
      doc.tags?.some(tag => tag.toLowerCase().includes(queryLower))
    );
  }

  // Response template methods
  async getAllResponseTemplates(): Promise<ResponseTemplate[]> {
    return Array.from(this.responseTemplates.values()).filter(template => template.isActive);
  }

  async getResponseTemplate(id: number): Promise<ResponseTemplate | undefined> {
    return this.responseTemplates.get(id);
  }

  async createResponseTemplate(insertTemplate: InsertResponseTemplate): Promise<ResponseTemplate> {
    const id = this.currentId++;
    const now = new Date();
    const template: ResponseTemplate = { 
      ...insertTemplate,
      tags: insertTemplate.tags || null,
      id, 
      createdAt: now,
      updatedAt: now,
      isActive: true
    };
    this.responseTemplates.set(id, template);
    return template;
  }

  async updateResponseTemplate(id: number, updates: Partial<ResponseTemplate>): Promise<ResponseTemplate | undefined> {
    const template = this.responseTemplates.get(id);
    if (!template) return undefined;

    const updatedTemplate = { ...template, ...updates, updatedAt: new Date() };
    this.responseTemplates.set(id, updatedTemplate);
    return updatedTemplate;
  }

  async deleteResponseTemplate(id: number): Promise<boolean> {
    return this.responseTemplates.delete(id);
  }

  // Search history methods
  async getSearchHistory(): Promise<SearchHistory[]> {
    return Array.from(this.searchHistory.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createSearchHistory(insertSearch: InsertSearchHistory): Promise<SearchHistory> {
    const id = this.currentId++;
    const search: SearchHistory = { 
      ...insertSearch,
      results: insertSearch.results || null,
      id, 
      createdAt: new Date()
    };
    this.searchHistory.set(id, search);
    return search;
  }

  // Stats methods
  async getStats(): Promise<{
    ticketsProcessed: number;
    documentsIndexed: number;
    avgResponseTime: string;
    autoResolved: string;
  }> {
    const resolvedTickets = Array.from(this.tickets.values()).filter(t => t.status === "resolved");
    const autoResolvedCount = resolvedTickets.filter(t => t.aiSummary).length;
    
    return {
      ticketsProcessed: this.tickets.size,
      documentsIndexed: this.documents.size,
      avgResponseTime: "2.3s",
      autoResolved: this.tickets.size > 0 ? `${Math.round((autoResolvedCount / this.tickets.size) * 100)}%` : "0%"
    };
  }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Ticket methods
  async getAllTickets(): Promise<Ticket[]> {
    return await db.select().from(tickets);
  }

  async getTicket(id: number): Promise<Ticket | undefined> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id));
    return ticket || undefined;
  }

  async createTicket(insertTicket: InsertTicket): Promise<Ticket> {
    const [ticket] = await db
      .insert(tickets)
      .values(insertTicket)
      .returning();
    return ticket;
  }

  async updateTicket(id: number, updates: Partial<Ticket>): Promise<Ticket | undefined> {
    const [ticket] = await db
      .update(tickets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tickets.id, id))
      .returning();
    return ticket || undefined;
  }

  async deleteTicket(id: number): Promise<boolean> {
    const result = await db.delete(tickets).where(eq(tickets.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Document methods
  async getAllDocuments(): Promise<Document[]> {
    return await db.select().from(documents);
  }

  async getDocument(id: number): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document || undefined;
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const [document] = await db
      .insert(documents)
      .values(insertDocument)
      .returning();
    return document;
  }

  async updateDocument(id: number, updates: Partial<Document>): Promise<Document | undefined> {
    const [document] = await db
      .update(documents)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(documents.id, id))
      .returning();
    return document || undefined;
  }

  async deleteDocument(id: number): Promise<boolean> {
    const result = await db.delete(documents).where(eq(documents.id, id));
    return (result.rowCount || 0) > 0;
  }

  async searchDocuments(query: string): Promise<Document[]> {
    return await db.select().from(documents).where(
      like(documents.content, `%${query}%`)
    );
  }

  // Response template methods
  async getAllResponseTemplates(): Promise<ResponseTemplate[]> {
    return await db.select().from(responseTemplates);
  }

  async getResponseTemplate(id: number): Promise<ResponseTemplate | undefined> {
    const [template] = await db.select().from(responseTemplates).where(eq(responseTemplates.id, id));
    return template || undefined;
  }

  async createResponseTemplate(insertTemplate: InsertResponseTemplate): Promise<ResponseTemplate> {
    const [template] = await db
      .insert(responseTemplates)
      .values(insertTemplate)
      .returning();
    return template;
  }

  async updateResponseTemplate(id: number, updates: Partial<ResponseTemplate>): Promise<ResponseTemplate | undefined> {
    const [template] = await db
      .update(responseTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(responseTemplates.id, id))
      .returning();
    return template || undefined;
  }

  async deleteResponseTemplate(id: number): Promise<boolean> {
    const result = await db.delete(responseTemplates).where(eq(responseTemplates.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Search history methods
  async getSearchHistory(): Promise<SearchHistory[]> {
    return await db.select().from(searchHistory);
  }

  async createSearchHistory(insertSearch: InsertSearchHistory): Promise<SearchHistory> {
    const [search] = await db
      .insert(searchHistory)
      .values(insertSearch)
      .returning();
    return search;
  }

  // Stats methods
  async getStats(): Promise<{
    ticketsProcessed: number;
    documentsIndexed: number;
    avgResponseTime: string;
    autoResolved: string;
  }> {
    const allTickets = await db.select().from(tickets);
    const allDocuments = await db.select().from(documents);
    
    // Count tickets with AI analysis as "processed"
    const processedTickets = allTickets.filter(t => t.aiSummary);
    const resolvedTickets = allTickets.filter(t => t.status === "resolved");
    
    // Calculate average response time based on ticket creation to resolution
    let avgResponseTimeMs = 0;
    if (resolvedTickets.length > 0) {
      const totalTime = resolvedTickets.reduce((sum, ticket) => {
        const created = new Date(ticket.createdAt).getTime();
        const updated = new Date(ticket.updatedAt).getTime();
        return sum + (updated - created);
      }, 0);
      avgResponseTimeMs = totalTime / resolvedTickets.length;
    }
    
    const avgResponseTime = avgResponseTimeMs > 0 
      ? `${Math.round(avgResponseTimeMs / 1000)}s`
      : "N/A";
    
    // Calculate auto-resolved percentage (tickets with AI summary that are resolved)
    const autoResolvedCount = resolvedTickets.filter(t => t.aiSummary).length;
    const autoResolvedPercentage = allTickets.length > 0 
      ? Math.round((autoResolvedCount / allTickets.length) * 100)
      : 0;
    
    return {
      ticketsProcessed: processedTickets.length,
      documentsIndexed: allDocuments.length,
      avgResponseTime,
      autoResolved: `${autoResolvedPercentage}%`
    };
  }
}

export const storage = new DatabaseStorage();
