# BrainBanter Backend

BrainBanter is a backend service designed to support a debate platform. It leverages Express.js for server-side operations, Prisma for database management, and Supabase for authentication.

## Table of Contents

- [Project Description](#project-description)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Setup Instructions](#setup-instructions)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
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

## Usage

- Access the server at `http://localhost:8000`.
- Use the `/api/auth` endpoint for authentication-related operations.

## API Endpoints

- **GET /health**: Check server health status.
- **POST /api/auth/callback**: Handle user authentication after Supabase login.
- **GET /api/auth/me**: Retrieve current user profile.

