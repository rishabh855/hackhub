# HackHub


live at : https://hackhub-pi.vercel.app/


**The All-In-One Workspace for High-Velocity Hackathon Teams.**

HackHub is a comprehensive project management and collaboration platform designed specifically for the fast-paced environment of hackathons. It unifies task management, real-time communication, decision tracking, and code snippet sharing into a single, cohesive interface, enabling teams to build better and faster together.



## 🚀 Key Features

*   **Kanban Board**: intuitive drag-and-drop task management to track progress from "To Do" to "Done".
*   **Real-time Chat**: Instant team communication with WebSocket integration.
*   **Decision Log**: A dedicated space to record and track architectural and design consensus.
*   **Code Snippets**: Share and store reusable code blocks and configuration files.
*   **Role-Based Access Control (RBAC)**: secure workspace with distinct roles (Owner, Editor, Viewer) for teams and projects.
*   **AI Assistant**: Integrated AI capabilities for project summaries and queries (powered by Google Gemini).
*   **Team Management**: Create teams, invite members, and manage project hierarchies.

## 🛠 Tech Stack

### Frontend
*   **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
*   **Language**: TypeScript
*   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
*   **UI Components**: [Radix UI](https://www.radix-ui.com/), [Lucide React](https://lucide.dev/)
*   ** animations**: [Framer Motion](https://www.framer.com/motion/)
*   **Drag & Drop**: [dnd-kit](https://dndkit.com/)
*   **Real-time**: Socket.io Client
*   **Auth**: Supabase SSR

### Backend
*   **Framework**: [NestJS 11](https://nestjs.com/)
*   **Language**: TypeScript
*   **Database**: PostgreSQL
*   **ORM**: [Prisma](https://www.prisma.io/)
*   **Real-time**: Socket.io Gateway (WebSockets)
*   **Authentication**: Supabase Auth Integration
*   **AI**: Google Generative AI (Gemini)
*   **Email**: Nodemailer

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
*   [Node.js](https://nodejs.org/) (v18 or higher)
*   [PostgreSQL](https://www.postgresql.org/)
*   A [Supabase](https://supabase.com/) project
*   A Google Cloud project with [Gemini API](https://ai.google.dev/) access

## ⚡ Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/hackhub.git
cd hackhub
```

### 2. Backend Setup
Navigate to the backend directory:
```bash
cd backend
```

Install dependencies:
```bash
npm install
```

Create a `.env` file in the `backend` directory with the following variables:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/hackhub?schema=public"
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_KEY="your-service-role-key" 
JWT_SECRET="your-supabase-jwt-secret"
GEMINI_API_KEY="your-google-gemini-api-key"
PORT=4000
# Email Configuration (Optional)
EMAIL_HOST="smtp.example.com"
EMAIL_USER="user@example.com"
EMAIL_PASS="password"
```
*Note: Ensure you use the Service Role Key for backend administrative tasks if required, though standard Supabase Auth often uses the Anon key on client and JWT verification on server.*

Run Database Migrations:
```bash
npx prisma migrate dev
```

Start the Backend Server:
```bash
npm run start:dev
```
The backend will run on `http://localhost:4000`.

### 3. Frontend Setup
Open a new terminal and navigate to the frontend directory:
```bash
cd frontend
```

Install dependencies:
```bash
npm install
```

Create a `.env.local` file in the `frontend` directory:
```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
NEXT_PUBLIC_BACKEND_URL="http://localhost:4000"
```

Start the Development Server:
```bash
npm run dev
```
The frontend will be available at `http://localhost:3000`.

## 📂 Project Structure

```
HackHub/
├── backend/                # NestJS API Server
│   ├── src/
│   │   ├── auth/           # Authentication guards & strategies
│   │   ├── chat/           # WebSocket gateway & chat logic
│   │   ├── projects/       # Project management resources
│   │   ├── tasks/          # Kanban task resources
│   │   └── teams/          # Team management resources
│   ├── prisma/             # Database schema
│   └── ...
├── frontend/               # Next.js Application
│   ├── app/                # App Router pages
│   ├── components/         # Reusable UI components
│   │   ├── kanban/         # Board & Task components
│   │   ├── chat/           # Chat window components
│   │   └── ui/             # Shadcn/Radix UI primitives
│   ├── lib/                # API clients & utilities
│   └── ...
```

## 🔐 Authentication Flow
HackHub uses **Supabase Auth** for user management.
1.  **Frontend**: Users sign in via Supabase (OAuth or Email).
2.  **Session**: Supabase manages the session and issues a JWT.
3.  **Backend**: The Frontend sends the JWT in the `Authorization` header to the Backend.
4.  **Verification**: The Backend (NestJS) validates the token against Supabase to authorize requests.
5.  **User Sync**: A custom guard automatically syncs the Supabase User to the local PostgreSQL database to ensure data integrity.

## 🤝 Contributing
Contributions are welcome! Please fork the repository and submit a pull request for any enhancements or bug fixes.

## 📄 License
This project is licensed under the [MIT License](LICENSE).
