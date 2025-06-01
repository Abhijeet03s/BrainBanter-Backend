# BrainBanter Backend

AI-powered debate platform that transforms user queries into engaging conversations with alternative perspectives and critical thinking challenges.

## Tech Stack

- **Runtime**: Node.js + Express + TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Supabase Auth
- **AI**: Google Gemini API
- **Cache**: Redis (ioredis)
- **Documentation**: Swagger UI

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Redis instance

### Installation

```bash
# Clone and install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Generate Prisma client and run migrations
npx prisma generate
npx prisma migrate dev

# Start development server
npm run dev
```

### Environment Variables

```env
DATABASE_URL="postgresql://..."
SUPABASE_URL="https://..."
SUPABASE_ANON_KEY="..."
GOOGLE_AI_API_KEY="..."
REDIS_URL="redis://..."
PORT=8000
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Debates
- `POST /api/debates` - Create debate session
- `GET /api/debates` - List user debates
- `GET /api/debates/:id` - Get debate details
- `POST /api/debates/:id/messages` - Send message
- `POST /api/debates/:id/save` - Save debate

### System
- `GET /health` - Health check
- `GET /api-docs` - Swagger documentation

## Database Schema

### Core Models
- **User**: Authentication and preferences
- **DebateSession**: Conversation containers
- **Message**: Individual chat messages
- **Feedback**: User ratings and comments
- **ConversationAnalytics**: Session metrics

## Development

```bash
# Development with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up --build

# Or build standalone
docker build -t brainbanter-backend .
docker run -p 8000:8000 brainbanter-backend
```

## Features

- **AI Debate Engine**: Google Gemini-powered conversations
- **Rate Limiting**: API protection with configurable limits
- **Real-time Analytics**: Conversation tracking and metrics
- **Secure Authentication**: Supabase-based user management
- **Swagger Documentation**: Interactive API explorer
- **Docker Ready**: Multi-stage build for production

## Project Structure

```
src/
├── controllers/    # Request handlers
├── routes/        # API route definitions
├── services/      # Business logic & AI integration
├── middleware/    # Auth, rate limiting, validation
├── config/        # Database and app configuration
└── server.ts      # Application entry point
```

