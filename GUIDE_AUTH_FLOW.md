# Google & NestJS Auth Architecture Guide

This guide explains your architecture, why the redirect loop occurred, and how to fix the end-to-end flow.

## 1. Why the Redirect Loop Happened

You experienced a redirect loop despite "successful" Google login because of a disconnect between your Frontend and Backend state.

1.  **NextAuth (Frontend)**: Handles the Google redirect interaction. It receives the `code` from Google and exchanges it for tokens.
    *   *Problem 1*: We discovered your frontend was using an old `@auth/prisma-adapter` incompatible with your NextAuth version, preventing the user session from being saved to the database.
    *   *Problem 2*: Your Frontend and Backend were running on different ports/urls than configured (`NEXTAUTH_URL=localhost:3000` vs `localhost:3001`), causing generic cookie failures.

2.  **NestJS (Backend)**: Was expecting `req.user` to be populated, but you had **no authentication logic** (Guards/Strategies) running on your backend.
    *   *Result*: `req.user` was undefined.
    *   *Consequence*: Your controllers fell back to dummy data or failed with database errors because they were receiving empty User IDs.

## 2. The Correct Architecture

Since you are using **NextAuth.js** on the frontend and **NestJS** on the backend, the flow works like this:

1.  **Frontend Login**: User clicks "Login with Google". NextAuth handles the redirect.
2.  **Session Creation**: NextAuth gets user info from Google. The **PrismaAdapter** automatically upserts (creates/updates) the `User` in your Postgres database.
3.  **Frontend Request**: When the frontend calls your API (e.g., `createTeam`), it must send the authentication token.
    *   *Header*: `Authorization: Bearer <NextAuth-JWT>`
    *   *Body*: `{"name": "Team A"}` (No need to send `userId`, the backend should extract it from the token!)
4.  **Backend Verification**: NestJS intercepts the request using a `Guard`.
    *   It reads the `Authorization` header.
    *   It verifies the signature using `JWT_SECRET`.
    *   It decodes the user ID.
    *   It sets `req.user = { userId: '...' }`.

## 3. Implementation Steps (Completed & Next Steps)

I have already performed the heavy lifting to fix your infrastructure:

### Step A: Fix Database & Adapter (DONE)
*   Enabled `PrismaAdapter` in `auth.ts`.
*   Switched to the compatible `@next-auth/prisma-adapter`.
*   Synced your Frontend/Backend `schema.prisma`.
*   **Result**: Users are now correctly saved to the DB upon Google Login.

### Step B: Enable Backend Authentication (DONE)
I have created the files missing from your backend:
1.  `src/auth/auth.module.ts`: Enables Passport.
2.  `src/auth/jwt.strategy.ts`: Configured to verify NextAuth tokens.
3.  `src/auth/jwt-auth.guard.ts`: A simple annotation to protect routes.

### Step C: Protect Your Routes (YOU MUST DO THIS)
To stop "req.user is undefined", you need to use the Guard I created.

**Example: Protecting Teams Controller**

Open `backend/src/teams/teams.controller.ts` and add:

```typescript
import { UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('teams')
@UseGuards(JwtAuthGuard) // <--- Adds Auth Protection
export class TeamsController {
    
    @Post()
    create(@Body('name') name: string, @Request() req) {
        // Now req.user is guaranteed to exist!
        const userId = req.user.userId; 
        return this.teamsService.createTeam(userId, name);
    }
}
```

### Step D: Frontend Token Passing
Ensure your frontend `api.ts` sends the token. You can get the token from the session.

```typescript
// In your API call helper
const session = await getSession();
headers: {
  'Authorization': `Bearer ${session.accessToken}` // or session.token depending on your callback
}
```

## Summary
*   **Upsert User**: Handled automatically by `PrismaAdapter` (Frontend).
*   **Issue Session**: Handled by NextAuth (Frontend).
*   **Attach to req.user**: Handled by `JwtStrategy` (Backend).
*   **Prevent Redirect Loop**: Ensure `NEXTAUTH_URL` matches your running port.

Check `backend/src/auth` to see the code I wrote for you.
