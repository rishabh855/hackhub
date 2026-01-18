import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ChatService {
    constructor(private prisma: PrismaService) { }

    async saveMessage(teamId: string, senderId: string, content: string) {
        return this.prisma.message.create({
            data: {
                teamId,
                senderId,
                content,
            },
            include: { sender: true },
        });
    }

    async getRecentMessages(teamId: string) {
        return this.prisma.message.findMany({
            where: { teamId },
            include: { sender: true },
            orderBy: { createdAt: 'asc' }, // Older first for chat history
            take: 50,
        });
    }
}
