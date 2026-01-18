import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ChatService {
    constructor(private prisma: PrismaService) { }

    async saveMessage(teamId: string, senderId: string, content: string, projectId?: string) {
        return this.prisma.message.create({
            data: {
                teamId,
                senderId,
                content,
                projectId,
            },
            include: { sender: true },
        });
    }

    async getRecentMessages(teamId: string, projectId?: string) {
        const whereClause: any = { teamId };
        if (projectId) {
            whereClause.projectId = projectId;
        } else {
            // If fetching Team chat, exclude project-specific messages?
            // Or just show all? Usually project chat is separate.
            // Let's explicitly filter for messages WITHOUT a projectId for the main team chat
            // to avoid cluttering the general channel.
            whereClause.projectId = null;
        }

        return this.prisma.message.findMany({
            where: whereClause,
            include: { sender: true },
            orderBy: { createdAt: 'asc' }, // Older first for chat history
            take: 50,
        });
    }
    async pinMessage(messageId: string, isPinned: boolean) {
        return this.prisma.message.update({
            where: { id: messageId },
            data: { isPinned },
            include: { sender: true },
        });
    }
}
