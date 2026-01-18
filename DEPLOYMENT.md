# Deployment Guide for HackHub

## Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL (if not using Docker)

## 1. Environment Setup
Ensure your `.env` file is configured correctly in both `backend/` and `frontend/`.

### Backend `.env`
```env
DATABASE_URL="postgresql://user:password@localhost:5432/hackhub?schema=public"
JWT_SECRET="your_secure_secret"
PORT=4000
AI_API_KEY="your_openai_or_gemini_key" # Optional
```

### Frontend `.env.local`
```env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your_nextauth_secret"
```

## 2. Docker Deployment (Recommended)
You can run the entire stack (Frontend, Backend, Database) using Docker Compose.

```bash
# In the root directory
docker-compose up --build -d
```
The app will be available at:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:4000

## 3. Manual Deployment
If you prefer to run services individually:

### Database
Start your PostgreSQL server.
```bash
cd backend
npx prisma migrate deploy
```

### Backend
```bash
cd backend
npm install
npm run build
npm run start:prod
```

### Frontend
```bash
cd frontend
npm install
npm run build
npm start
```

## 4. Production Notes
- Set `NODE_ENV=production`.
- Use a robust database provider (Supabase, Neon, AWS RDS) for production data.
- Configure SSL/TLS (HTTPS) using a reverse proxy like Nginx or cloud provider settings.
