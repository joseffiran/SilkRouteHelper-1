# SilkRoute OS Declaration Helper

## Overview

SilkRoute OS is a full-stack web application designed to help companies with shipment declaration processing using AI-powered OCR technology. The system features a React frontend with TypeScript, a FastAPI backend, and PostgreSQL database integration. The application provides user authentication, shipment management, and document processing capabilities.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for build tooling
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent UI design
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation schemas
- **Component Strategy**: Component-based architecture with reusable UI components from Radix UI primitives

### Backend Architecture
- **Framework**: FastAPI (Python) for high-performance REST API
- **Database ORM**: SQLAlchemy with Alembic for database migrations
- **Authentication**: JWT-based authentication with PassLib for password hashing
- **API Structure**: Modular router-based organization with separate endpoints for authentication, users, and shipments

### Database Strategy
- **Primary Database**: PostgreSQL configured through Drizzle ORM on the frontend side
- **Backend Database**: SQLAlchemy models with PostgreSQL integration
- **Migration Strategy**: Alembic for database schema versioning and migrations

## Key Components

### Authentication System
- JWT token-based authentication with secure password hashing
- Session management with token storage in localStorage
- Protected routes with authentication guards
- User registration and login with form validation

### User Management
- User profiles with company information
- Email-based user identification
- Account status tracking and user activity monitoring

### Shipment Processing
- Shipment creation and management
- Status tracking (processing, completed, failed)
- JSON-based extracted data storage for OCR results
- User-specific shipment filtering and organization

### Frontend Components
- Responsive design with mobile-first approach
- Reusable UI components built on Radix UI primitives
- Form components with validation and error handling
- Dashboard with shipment statistics and management

## Data Flow

1. **User Authentication Flow**:
   - User submits login credentials through React form
   - Frontend validates data using Zod schemas
   - API request sent to FastAPI backend
   - Backend validates credentials and returns JWT token
   - Token stored in localStorage and used for subsequent requests

2. **Shipment Management Flow**:
   - Authenticated users can create new shipments
   - Shipment data stored in PostgreSQL with user association
   - Real-time status updates through API queries
   - Extracted data from OCR processing stored as JSON

3. **Data Synchronization**:
   - TanStack Query manages server state caching and synchronization
   - Optimistic updates for better user experience
   - Error handling with toast notifications

## External Dependencies

### Frontend Dependencies
- **UI Framework**: React with TypeScript support
- **Build Tool**: Vite with hot module replacement
- **Styling**: Tailwind CSS with PostCSS processing
- **Component Library**: Radix UI primitives for accessible components
- **HTTP Client**: Fetch API with TanStack Query wrapper
- **Form Libraries**: React Hook Form with Hookform resolvers
- **Validation**: Zod for schema validation
- **Routing**: Wouter for lightweight routing
- **Date Handling**: date-fns for date manipulation

### Backend Dependencies
- **Web Framework**: FastAPI with Uvicorn ASGI server
- **Database**: PostgreSQL with psycopg2 driver
- **ORM**: SQLAlchemy with Alembic migrations
- **Authentication**: python-jose for JWT handling, PassLib for password hashing
- **Validation**: Pydantic for request/response validation
- **CORS**: FastAPI CORS middleware for cross-origin requests

### Database Integration
- **Primary**: PostgreSQL 16 (configured in .replit)
- **Frontend ORM**: Drizzle ORM with PostgreSQL dialect
- **Backend ORM**: SQLAlchemy with Alembic migrations
- **Connection**: Neon Database serverless for scalable PostgreSQL hosting

## Deployment Strategy

### Development Environment
- **Platform**: Replit with Node.js 20 and PostgreSQL 16 modules
- **Build Process**: Vite development server with hot reload
- **Backend Server**: FastAPI with Uvicorn in development mode
- **Database**: Local PostgreSQL instance with environment variable configuration

### Production Deployment
- **Build Strategy**: Vite production build with static asset optimization
- **Server Bundle**: ESBuild for backend bundling with Node.js target
- **Deployment Target**: Autoscale deployment on Replit infrastructure
- **Port Configuration**: Frontend on port 5000, backend proxy to port 8000

### Environment Configuration
- **Development**: Hot reload with source maps and development tools
- **Production**: Optimized builds with minification and tree shaking
- **Database**: Environment variable-based connection string configuration
- **Security**: JWT secret management through environment variables

## Changelog

```
Changelog:
- June 22, 2025. Initial setup
- June 22, 2025. Phase 1 Complete: FastAPI backend with JWT authentication, user registration, PostgreSQL database setup, and Alembic migrations
- June 22, 2025. Fixed frontend-backend connection issues: Resolved CORS problems, improved database connection pooling, and enabled successful account creation through signup form
- June 22, 2025. Phase 2 Complete: Intelligent Document Hub implementation with structured document upload, OCR processing with template-based field extraction, admin panel for template management, real-time document status polling, and comprehensive database schema for documents, templates, and fields
- June 22, 2025. Secured Admin Panel: Restricted admin panel access to superuser accounts only, Russian customs declaration template with 36 fields initialized, admin navigation hidden from regular users, authentication-based access control implemented
- June 22, 2025. Fixed Frontend-Backend API Endpoint Mismatch: Resolved document upload and admin panel connectivity issues by implementing proper Express proxy with multer middleware for file uploads, corrected multipart form data handling, and verified all API endpoints work correctly through frontend
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```