# AI-Powered Corporate Support Assistant

## Overview

This is a full-stack web application that serves as an AI-powered corporate support assistant. The system helps automate and streamline support ticket management through intelligent triage, knowledge base search, and automated response generation. It's built with a modern tech stack featuring React frontend, Express backend, and PostgreSQL database with AI integration via OpenAI's GPT-4.

## Recent Changes

- **Database Integration (January 2025)**: Successfully migrated from in-memory storage to PostgreSQL database using Neon serverless. Added proper database relations and initialized with default response templates. Database schema includes users, tickets, documents, response templates, and search history tables.

- **Demo Customization Features (January 2025)**: Added comprehensive demo personalization capabilities including custom app titles, company branding, color schemes, user personas, and feature toggles. Settings allow for different demo modes (basic, full, advanced) with configurable UI elements and maximum ticket display limits.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for development and production builds
- **Styling**: TailwindCSS with shadcn/ui component library
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing
- **UI Components**: Radix UI primitives with custom styling

### Backend Architecture
- **Runtime**: Node.js with Express framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL
- **File Upload**: Multer for handling file uploads
- **Development**: tsx for TypeScript execution

### Database Design
- **Primary Database**: PostgreSQL (via Neon serverless)
- **Schema Management**: Drizzle Kit for migrations
- **Tables**: Users, tickets, documents, response templates, search history
- **Features**: Full-text search, AI analysis storage, file metadata

## Key Components

### 1. Auto-Triage System
- **Purpose**: Automatically analyze and categorize incoming support tickets
- **Implementation**: File upload or manual ticket creation with AI analysis
- **Features**: Priority assignment, category classification, sentiment analysis
- **AI Integration**: Uses OpenAI GPT-4 for ticket analysis and summary generation

### 2. Knowledge Base Management
- **Purpose**: Store and search through corporate documentation
- **Implementation**: Document upload with AI summarization
- **Features**: Full-text search, semantic search capabilities, categorization
- **Search**: Cross-document search with relevance scoring

### 3. Response Generation
- **Purpose**: Generate customer-facing responses using AI
- **Implementation**: Template-based responses with AI enhancement
- **Features**: Tone adjustment, context-aware responses, template management
- **Workflow**: Select ticket → Choose template → Generate AI response

### 4. Dashboard Analytics
- **Purpose**: Provide overview of support operations
- **Implementation**: Real-time stats and metrics display
- **Features**: Ticket counts, response times, priority distribution
- **UI**: Cards-based layout with trend indicators

### 5. Settings Management
- **Purpose**: Configure AI behavior and system preferences
- **Implementation**: Local storage for user preferences
- **Features**: OpenAI API configuration, model selection, behavior tuning
- **Security**: API key management and validation

### 6. Demo Customization System
- **Purpose**: Personalize the application for different demonstration scenarios
- **Implementation**: Persistent settings stored in localStorage with `useDemoSettings` hook
- **Features**: 
  - Custom app titles and company branding
  - Color scheme customization (primary, accent, warning colors)
  - User persona settings (name, role, company)
  - Demo mode selection (basic, full, advanced)
  - Feature toggles for advanced functionality
  - Maximum ticket display configuration
  - Custom welcome messages and descriptions
- **Integration**: Settings are used throughout the UI including sidebar, header, and dashboard components

## Data Flow

1. **Ticket Creation**: User uploads file or creates manual ticket
2. **AI Analysis**: OpenAI processes ticket content for categorization
3. **Storage**: Ticket data and AI analysis stored in PostgreSQL
4. **Knowledge Search**: AI searches through document database
5. **Response Generation**: AI generates responses based on templates and context
6. **User Interface**: React components display processed data

## External Dependencies

### AI Services
- **OpenAI API**: GPT-4 for text analysis, summarization, and generation
- **Integration**: Via official OpenAI Node.js SDK
- **Usage**: Ticket analysis, document summarization, response generation

### Database
- **Neon Database**: Serverless PostgreSQL hosting
- **Connection**: Via @neondatabase/serverless package
- **Features**: Automatic scaling, connection pooling

### UI Components
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling framework
- **Lucide React**: Icon library for consistent iconography

### Development Tools
- **Vite**: Fast development server and build tool
- **TypeScript**: Type safety and developer experience
- **ESBuild**: Fast JavaScript bundler for production

## Deployment Strategy

### Development Environment
- **Server**: Express with Vite middleware for HMR
- **Database**: Local PostgreSQL or Neon development instance
- **Build**: Vite dev server for frontend, tsx for backend

### Production Build
- **Frontend**: Vite build outputs to `dist/public`
- **Backend**: ESBuild bundles server code to `dist/index.js`
- **Database**: Drizzle migrations via `db:push` command
- **Deployment**: Single Node.js process serving both API and static files

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string
- **OPENAI_API_KEY**: API key for AI services
- **NODE_ENV**: Environment mode (development/production)

The application uses a monorepo structure with shared TypeScript schemas and a clean separation between client and server code, making it easy to maintain and extend while providing a robust foundation for AI-powered support operations.