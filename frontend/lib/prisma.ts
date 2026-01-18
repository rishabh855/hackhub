import { PrismaClient } from '@prisma/client';

declare global {
    var prisma: PrismaClient | undefined;
}

let prisma: PrismaClient;

try {
    prisma = global.prisma || new PrismaClient();
} catch (error) {
    console.error("Failed to initialize Prisma Client:", error);
    throw error;
}

if (process.env.NODE_ENV === 'development') global.prisma = prisma;

export default prisma;
