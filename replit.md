# Overview

This is a full-stack MVP for Beagvs Global, a crypto-powered SaaS marketplace that combines real estate, global shipping services, and social features. The platform enables users to buy, sell, and trade using cryptocurrencies like Pi Network and USDT across multiple blockchain networks, with built-in escrow protection and social networking capabilities.

The application serves as a comprehensive marketplace where users can list real estate properties, offer shipping services, trade products, and interact through direct messaging and follow/review systems. All transactions are protected by an escrow system that ensures secure crypto payments.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing with role-based route protection
- **UI Components**: Shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and crypto-themed color scheme
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Authentication**: Custom auth hooks integrated with backend session management

## Backend Architecture
- **Runtime**: Node.js with Express.js server framework
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Replit Auth integration with session-based authentication using express-session
- **File Storage**: Local file uploads to /public/uploads with Google Cloud Storage integration ready
- **Real-time Features**: Socket.IO infrastructure prepared for live messaging
- **API Design**: RESTful endpoints under /api with consistent error handling and logging

## Database Design
- **Users**: Profile management with crypto wallet addresses, social features (followers/following)
- **Listings**: Multi-type marketplace items (real estate, shipping services, products, services)
- **Escrow System**: Transaction management with status tracking and dispute resolution
- **Wallets**: Multi-network cryptocurrency wallet management (Pi, USDT on various chains)
- **Social Features**: Reviews, direct messaging, notifications, and follow relationships
- **Content Management**: Blog system for platform updates and educational content

## Security & Transaction Management
- **Escrow Protection**: Built-in escrow system for secure crypto transactions with status tracking
- **Multi-Network Support**: Pi Network, TRON, TON, BNB Chain, Solana, and Avalanche
- **Role-Based Access**: User and Admin roles with appropriate permission levels
- **Session Security**: Secure session management with PostgreSQL session store

## Development Environment
- **Build System**: Vite for fast development and optimized production builds
- **Type Safety**: Full TypeScript coverage across frontend, backend, and shared schemas
- **Database Migrations**: Drizzle Kit for schema management and migrations
- **Development Tools**: Hot reload, runtime error overlay, and development banner integration

# External Dependencies

## Database & Storage
- **Primary Database**: PostgreSQL via Neon serverless (@neondatabase/serverless)
- **ORM**: Drizzle ORM with PostgreSQL adapter for type-safe database operations
- **Session Storage**: PostgreSQL-backed session store using connect-pg-simple
- **File Storage**: Google Cloud Storage (@google-cloud/storage) for scalable file management

## Authentication & Security
- **Authentication Provider**: Replit OIDC for seamless platform integration
- **Session Management**: Express-session with secure cookie configuration
- **Password Hashing**: bcrypt for secure password storage
- **Validation**: Zod for runtime type validation and schema enforcement

## Frontend Libraries
- **UI Framework**: Radix UI components (@radix-ui/*) for accessible, unstyled primitives
- **Styling**: Tailwind CSS with PostCSS for utility-first styling
- **State Management**: TanStack Query for server state and caching
- **Form Handling**: React Hook Form with Hookform resolvers for validation integration
- **File Uploads**: Uppy.js ecosystem for robust file upload handling

## Utility Libraries
- **Routing**: Wouter for lightweight client-side routing
- **Utilities**: Memoizee for performance optimization, nanoid for ID generation
- **Development**: Various TypeScript definitions and development tools for enhanced DX