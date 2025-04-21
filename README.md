# BrainBanter Backend

BrainBanter is a backend service designed to support a debate platform. It leverages Express.js for server-side operations, Prisma for database management, and Supabase for authentication.

## Table of Contents

- [Project Description](#project-description)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Setup Instructions](#setup-instructions)
- [Docker Setup](#docker-setup)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)

## Project Description

BrainBanter is a backend service that facilitates user authentication, debate session management, and user feedback collection. It is built with scalability and security in mind, using modern web technologies.

## Features

- User authentication via Supabase
- Debate session management
- User feedback and reporting
- Health check endpoint for server status

## Technologies Used

- **Node.js**: JavaScript runtime
- **Express.js**: Web framework for Node.js
- **Prisma**: ORM for database management
- **Supabase**: Authentication and database service
- **TypeScript**: Typed superset of JavaScript
- **PostgreSQL**: Database

## Setup Instructions

1. **Clone the repository:**

   ```bash
   git clone https://github.com/yourusername/brainbanter-backend.git
   cd brainbanter-backend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**

   Create a `.env` file in the root directory and add the following:

   ```plaintext
   PORT=8000
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key
   SUPABASE_SERVICE_KEY=your_supabase_service_key
   DATABASE_URL=your_database_url
   ```

4. **Run the development server:**

   ```bash
   npm run dev
   ```

## Docker Setup

### Running with Docker

1. **Build the Docker image:**
   ```bash
   docker build -t brainbanter-backend .
   ```

2. **Run the container:**
   ```bash
   docker run -p 8000:8000 -d brainbanter-backend
   ```

### Running with Docker Compose (Production)

Use the production Docker Compose file to run the full stack including PostgreSQL proxy, Redis, and PgBouncer:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

This will start all services defined in the production configuration, including:
- Cloud SQL Proxy for database connection
- Redis for caching
- PgBouncer for connection pooling
- The BrainBanter backend application

## Usage

- Access the server at `http://localhost:8000`.
- Use the `/api/auth` endpoint for authentication-related operations.

## API Endpoints

- **GET /health**: Check server health status.
- **POST /api/auth/callback**: Handle user authentication after Supabase login.
- **GET /api/auth/me**: Retrieve current user profile.

## API Documentation

The API is documented using Swagger/OpenAPI. You can access the interactive documentation at:

```
http://localhost:8000/api-docs
```

The documentation provides:

- Detailed information about all available endpoints
- Request and response schemas
- Authentication requirements
- Interactive testing capabilities

You can also access the raw OpenAPI specification at:

```
http://localhost:8000/api-docs.json
```

## License

This project is licensed under the ISC License.

