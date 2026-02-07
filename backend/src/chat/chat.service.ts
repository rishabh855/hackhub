import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ChatService {
    constructor(private prisma: PrismaService) { }

    async isProjectMember(userId: string, projectId: string): Promise<boolean> {
        // Check direct membership
        const member = await this.prisma.projectMember.findUnique({
            where: { userId_projectId: { userId, projectId } }
        });
        if (member) return true;

        // Check implicit (Team Owner)
        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
            select: { teamId: true }
        });

        if (project) {
            const teamMember = await this.prisma.teamMember.findUnique({
                where: { userId_teamId: { userId, teamId: project.teamId } }
            });
            if (teamMember) return true;
        }
        return false;
    }

    async saveMessage(teamId: string, senderId: string, content: string, projectId?: string) {
        console.log('[ChatService] Saving message:', { teamId, senderId, content, projectId });
        try {
            const message = await this.prisma.message.create({
                data: {
                    teamId,
                    senderId,
                    content,
                    projectId,
                },
                include: { sender: true },
            });
            console.log('[ChatService] Message created:', message.id);
            return message;
        } catch (error) {
            console.error('[ChatService] Error creating message:', error);
            throw error;
        }
    }

    async getRecentMessages(teamId: string, projectId?: string) {
        const whereClause: any = { teamId };
        if (projectId) {
            whereClause.projectId = projectId;
        } else {
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
