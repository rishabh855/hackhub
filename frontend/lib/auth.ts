import type { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        GithubProvider({
            clientId: process.env.GITHUB_ID || "placeholder_id",
            clientSecret: process.env.GITHUB_SECRET || "placeholder_secret",
        }),
        CredentialsProvider({
            name: "Dev Bypass",
            credentials: {
                username: { label: "Username", type: "text", placeholder: "jsmith" }
            },
            async authorize(credentials, req) {
                try {
                    console.log("Attempting Dev Bypass...");
                    // Try to find existing dev user or any user to impersonate
                    const user = await prisma.user.findFirst({
                        where: { email: 'dev@example.com' }
                    });

                    if (user) {
                        return user;
                    }

                    // If no user exists, create one
                    console.log("Creating new Dev User...");
                    const newUser = await prisma.user.create({
                        data: {
                            id: 'dev-user-id-123', // Consistent ID for dev user
                            email: 'dev@example.com',
                            name: 'Dev User',
                            image: 'https://github.com/shadcn.png'
                        }
                    });
                    return newUser;
                } catch (error) {
                    console.error("Bypass Login Error:", error);
                    // Fallback to avoid complete block, but warn
                    return {
                        id: 'dev-user-id-123',
                        email: 'dev@example.com',
                        name: 'Fallbacked Dev User',
                        image: 'https://github.com/shadcn.png'
                    };
                }
            }
        })
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                // @ts-ignore
                session.user.id = token.id as string;
            }
            return session;
        },
    },
    pages: {
        signIn: '/login',
    },
};
