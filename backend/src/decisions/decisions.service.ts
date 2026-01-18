import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class DecisionsService {
    constructor(private prisma: PrismaService) { }

    async create(projectId: string, userId: string, data: { title: string; content: string; taskId?: string }) {
        return this.prisma.decision.create({
            data: {
                ...data,
                projectId,
                userId,
                status: 'DECIDED',
            },
            include: { user: true, notes: true },
        });
    }

    async findAll(projectId: string) {
        return this.prisma.decision.findMany({
            where: { projectId },
            include: {
                user: true,
                notes: {
                    include: { user: true },
                    orderBy: { createdAt: 'asc' }
                }
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async addNote(decisionId: string, userId: string, content: string) {
        return this.prisma.decisionNote.create({
            data: {
                content,
                decisionId,
                userId,
            },
            include: { user: true },
        });
    }
}
