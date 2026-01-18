import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SnippetsService {
    constructor(private prisma: PrismaService) { }

    async createSnippet(userId: string, projectId: string, data: { title: string; code: string; language: string; category?: string; description?: string }) {
        return this.prisma.snippet.create({
            data: {
                ...data,
                projectId,
                userId,
            },
            include: { user: true }
        });
    }

    async getProjectSnippets(projectId: string) {
        return this.prisma.snippet.findMany({
            where: { projectId },
            include: { user: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async deleteSnippet(id: string) {
        return this.prisma.snippet.delete({
            where: { id },
        });
    }

    async updateSnippet(id: string, data: { title?: string; code?: string; language?: string; category?: string; description?: string }) {
        return this.prisma.snippet.update({
            where: { id },
            data,
        });
    }
}
