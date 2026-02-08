import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class TasksService {
    constructor(private prisma: PrismaService) { }

    async createTask(data: { title: string; projectId: string; description?: string; priority?: string; assigneeId?: string; dueDate?: Date; labels?: string[]; isBlocked?: boolean; blockedReason?: string }) {
        return this.prisma.task.create({
            data: {
                title: data.title,
                projectId: data.projectId,
                description: data.description,
                priority: data.priority || 'MEDIUM',
                assigneeId: data.assigneeId,
                status: 'TODO',
                dueDate: data.dueDate,
                labels: data.labels || [],
                isBlocked: data.isBlocked || false,
                blockedReason: data.blockedReason,
                completedAt: null, // Tasks are created as TODO, so completedAt is null
            },
            include: { assignee: true }
        });
    }

    async getProjectTasks(projectId: string) {
        return this.prisma.task.findMany({
            where: { projectId },
            include: { assignee: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async updateTask(id: string, data: { status?: string; priority?: string; assigneeId?: string; title?: string; description?: string; dueDate?: Date | null; labels?: string[]; isBlocked?: boolean; blockedReason?: string }) {
        const task = await this.prisma.task.findUnique({ where: { id } });
        if (!task) throw new NotFoundException('Task not found');

        return this.prisma.task.update({
            where: { id },
            data,
        });
    }

    async deleteTask(id: string, userId: string) {
        const task = await this.prisma.task.findUnique({
            where: { id },
            include: { project: true }
        });

        if (!task) throw new NotFoundException('Task not found');

        // Check Team Owner
        const teamMember = await this.prisma.teamMember.findUnique({
            where: {
                userId_teamId: {
                    userId,
                    teamId: task.project.teamId
                }
            }
        });

        if (!teamMember || teamMember.role !== 'OWNER') {
            throw new NotFoundException('Only Team Owners can delete tasks');
        }

        return this.prisma.task.delete({ where: { id } });
    }
}
