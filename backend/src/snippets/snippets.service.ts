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

    async deleteSnippet(id: string, userId: string) {
        const snippet = await this.prisma.snippet.findUnique({
            where: { id },
            include: { project: true }
        });

        if (!snippet) throw new NotFoundException('Snippet not found');

        // Check if user is Team Owner
        const teamMember = await this.prisma.teamMember.findUnique({
            where: {
                userId_teamId: {
                    userId,
                    teamId: snippet.project.teamId
                }
            }
        });

        if (!teamMember || teamMember.role !== 'OWNER') {
            // Also allow if user is the snippet creator? 
            // Requirement said "only team owner". Sticking to that.
            throw new NotFoundException('Only Team Owners can delete snippets'); // Using NotFound to hide existence or Forbidden
        }

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
