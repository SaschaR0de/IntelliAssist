import { db } from "./db";
import { responseTemplates, type InsertResponseTemplate } from "@shared/schema";

const defaultTemplates: InsertResponseTemplate[] = [
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

export async function initializeDatabase() {
  try {
    // Check if templates already exist
    const existingTemplates = await db.select().from(responseTemplates);
    
    if (existingTemplates.length === 0) {
      console.log("Initializing database with default response templates...");
      
      for (const template of defaultTemplates) {
        await db.insert(responseTemplates).values(template);
      }
      
      console.log("Database initialized successfully!");
    } else {
      console.log("Database already initialized with response templates.");
    }
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}