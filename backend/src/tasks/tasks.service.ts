import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class TasksService {
    constructor(private prisma: PrismaService) { }

    async createTask(data: { title: string; projectId: string; description?: string; priority?: string; assigneeId?: string }) {
        return this.prisma.task.create({
            data: {
                title: data.title,
                projectId: data.projectId,
                description: data.description,
                priority: data.priority || 'MEDIUM',
                assigneeId: data.assigneeId,
                status: 'TODO',
            },
        });
    }

    async getProjectTasks(projectId: string) {
        return this.prisma.task.findMany({
            where: { projectId },
            include: { assignee: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async updateTask(id: string, data: { status?: string; priority?: string; assigneeId?: string; title?: string; description?: string }) {
        const task = await this.prisma.task.findUnique({ where: { id } });
        if (!task) throw new NotFoundException('Task not found');

        return this.prisma.task.update({
            where: { id },
            data,
        });
    }

    async deleteTask(id: string) {
        return this.prisma.task.delete({ where: { id } });
    }
}
