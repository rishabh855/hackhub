# How to Run HackHub

This guide provides step-by-step instructions to set up and run the HackHub application (Database, Backend, and Frontend).

## Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16 or higher)
- [Docker & Docker Compose](https://www.docker.com/) (for the database)

## 1. Database Setup

The project uses PostgreSQL running in a Docker container.

1. Open a terminal in the root directory `d:\HackHub`.
2. Start the database container:
   ```bash
   docker-compose up -d
   ```
   This will start PostgreSQL on port **5435** with the following credentials (defined in `docker-compose.yml`):
   - **User**: `user`
   - **Password**: `password`
   - **Database**: `hackhub`

## 2. Backend Setup

The backend is built with NestJS.

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create a `.env` file in `backend/` with the following content:
   ```env
   # Database Connection
   DATABASE_URL="postgresql://user:password@localhost:5435/hackhub?schema=public"
   
   # Server Port
   PORT=4000
   
   # AI Integration (Required for AI features)
   GEMINI_API_KEY="your_gemini_api_key_here"
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Generate Prisma Client:
   ```bash
   npx prisma generate
   ```
5. Apply database migrations (to create tables):
   ```bash
   npx prisma db push
   ```
   *(Or use `npx prisma migrate dev` if migrations are initialized)*

6. Start the backend server:
   ```bash
   npm run start:dev
   ```
   The backend should now be running at `http://localhost:4000`.

## 3. Frontend Setup

The frontend is built with Next.js.

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Create a `.env` file in `frontend/` (or `.env.local`) with the following content:
   ```env
   # Database Connection (shared with backend)
   DATABASE_URL="postgresql://user:password@localhost:5435/hackhub?schema=public"
   
   # NextAuth Configuration
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your_secret_key_here" # Generate one with: openssl rand -base64 32
   
   # OAuth Providers (Optional for Dev Bypass, but recommended)
   GOOGLE_CLIENT_ID="your_google_client_id"
   GOOGLE_CLIENT_SECRET="your_google_client_secret"
   GITHUB_ID="your_github_id"
   GITHUB_SECRET="your_github_secret"
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Generate Prisma Client (Frontend also uses Prisma directly for Auth):
   ```bash
   npx prisma generate
   ```
5. Start the frontend development server:
   ```bash
   npm run dev
   ```
   The frontend should now be running at `http://localhost:3000`.

## Summary of Ports
- **Frontend**: `http://localhost:3000`
- **Backend**: `http://localhost:4000`
- **Postgres DB**: `localhost:5435`
