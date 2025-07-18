import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: text("priority").notNull().default("medium"), // low, medium, high
  status: text("status").notNull().default("open"), // open, in_progress, resolved
  category: text("category"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  aiSummary: text("ai_summary"),
  aiAnalysis: json("ai_analysis"),
  originalContent: text("original_content"),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  filename: text("filename").notNull(),
  fileType: text("file_type").notNull(),
  category: text("category").default("general"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  aiSummary: text("ai_summary"),
  searchVector: text("search_vector"), // For semantic search
});

export const responseTemplates = pgTable("response_templates", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true),
});

export const searchHistory = pgTable("search_history", {
  id: serial("id").primaryKey(),
  query: text("query").notNull(),
  results: json("results"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chatConversations = pgTable("chat_conversations", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  userMessage: text("user_message").notNull(),
  botResponse: text("bot_response").notNull(),
  confidence: integer("confidence"), // 0-100
  sources: text("sources").array(),
  actionTaken: text("action_taken"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  tickets: many(tickets),
  documents: many(documents),
  responseTemplates: many(responseTemplates),
  searchHistory: many(searchHistory),
}));

export const ticketsRelations = relations(tickets, ({ one }) => ({
  user: one(users, {
    fields: [tickets.id],
    references: [users.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  user: one(users, {
    fields: [documents.id],
    references: [users.id],
  }),
}));

export const responseTemplatesRelations = relations(responseTemplates, ({ one }) => ({
  user: one(users, {
    fields: [responseTemplates.id],
    references: [users.id],
  }),
}));

export const searchHistoryRelations = relations(searchHistory, ({ one }) => ({
  user: one(users, {
    fields: [searchHistory.id],
    references: [users.id],
  }),
}));

export const chatConversationsRelations = relations(chatConversations, ({ one }) => ({
  user: one(users, {
    fields: [chatConversations.id],
    references: [users.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertTicketSchema = createInsertSchema(tickets).pick({
  title: true,
  description: true,
  priority: true,
  category: true,
  originalContent: true,
});

export const insertDocumentSchema = createInsertSchema(documents).pick({
  title: true,
  content: true,
  filename: true,
  fileType: true,
  category: true,
  tags: true,
});

export const insertResponseTemplateSchema = createInsertSchema(responseTemplates).pick({
  title: true,
  content: true,
  category: true,
  tags: true,
});

export const insertSearchHistorySchema = createInsertSchema(searchHistory).pick({
  query: true,
  results: true,
});

export const insertChatConversationSchema = createInsertSchema(chatConversations).pick({
  sessionId: true,
  userMessage: true,
  botResponse: true,
  confidence: true,
  sources: true,
  actionTaken: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type ResponseTemplate = typeof responseTemplates.$inferSelect;
export type InsertResponseTemplate = z.infer<typeof insertResponseTemplateSchema>;

export type SearchHistory = typeof searchHistory.$inferSelect;
export type InsertSearchHistory = z.infer<typeof insertSearchHistorySchema>;

export type ChatConversation = typeof chatConversations.$inferSelect;
export type InsertChatConversation = z.infer<typeof insertChatConversationSchema>;
