import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ProjectsService {
    constructor(private prisma: PrismaService) { }

    async updateProject(id: string, data: { name?: string; description?: string; submissionGithub?: string; submissionDemo?: string; submissionPPT?: string; submissionVideo?: string; submissionDescription?: string }) {
        return this.prisma.project.update({
            where: { id },
            data,
        });
    }

    async getProject(id: string) {
        return this.prisma.project.findUnique({
            where: { id },
            include: { team: true }
        });
    }

    async createProject(teamId: string, name: string, userId: string, description?: string) {
        return this.prisma.$transaction(async (prisma) => {
            const project = await prisma.project.create({
                data: {
                    name,
                    description,
                    teamId,
                },
            });

            await prisma.projectMember.create({
                data: {
                    userId,
                    projectId: project.id,
                    role: 'OWNER',
                },
            });

            return project;
        });
    }

    async getTeamProjects(teamId: string) {
        return this.prisma.project.findMany({
            where: { teamId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getMembership(projectId: string, userId: string) {
        return this.prisma.projectMember.findUnique({
            where: {
                userId_projectId: { userId, projectId },
            },
        });
    }

    async getProjectMembers(projectId: string) {
        return this.prisma.projectMember.findMany({
            where: { projectId },
            include: { user: true },
        });
    }

    async addMember(projectId: string, email: string, role: string) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) throw new Error('User not found');

        // check if already member
        const existing = await this.prisma.projectMember.findUnique({
            where: { userId_projectId: { userId: user.id, projectId } }
        });
        if (existing) throw new Error('User is already a member');

        return this.prisma.projectMember.create({
            data: {
                projectId,
                userId: user.id,
                role: role as any,
            },
        });
    }

    async updateMemberRole(projectId: string, userId: string, role: string) {
        return this.prisma.projectMember.update({
            where: { userId_projectId: { userId, projectId } },
            data: { role: role as any },
        });
    }

    async removeMember(projectId: string, userId: string) {
        return this.prisma.projectMember.deleteMany({
            where: { projectId, userId }
        });
    }

    async getBurndown(projectId: string) {
        const tasks = await this.prisma.task.findMany({
            where: { projectId },
            orderBy: { createdAt: 'asc' }
        });

        if (tasks.length === 0) return { chartData: [], blockedTasks: [] };

        const startDate = tasks[0].createdAt;
        // End date: Latest due date or today + 7 days
        let endDate = new Date();
        const dueDates = tasks.map(t => t.dueDate).filter(d => d !== null) as Date[];
        if (dueDates.length > 0) {
            // Find max due date
            endDate = dueDates.reduce((a, b) => a > b ? a : b);
        } else {
            endDate.setDate(endDate.getDate() + 7);
        }

        // Generate dates from start to end (exclude time)
        const dates: Date[] = [];
        let currentDate = new Date(startDate);
        currentDate.setHours(0, 0, 0, 0);
        const normalizedStartDate = new Date(currentDate); // Capture start date correctly

        const lastDate = new Date(endDate);
        lastDate.setHours(0, 0, 0, 0);

        while (currentDate <= lastDate) {
            dates.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }

        const totalTasks = tasks.length;
        const totalDuration = lastDate.getTime() - normalizedStartDate.getTime();

        const chartData = dates.map(date => {
            // Ideal: Linear regression from totalTasks to 0
            const elapsed = date.getTime() - normalizedStartDate.getTime();

            let ideal: number;
            if (totalDuration <= 0) {
                // Single day project: Ideal is totalTasks (start) -> 0 (end of day? strictly manual)
                // Or just flat totalTasks? 
                // If duration is 0, we can't really draw a line. 
                // But typically if it's 1 day, we start with Total and end with 0? 
                // Let's just return Total tasks for the single point to show what needs to be done.
                ideal = totalTasks;
            } else {
                ideal = Math.max(0, totalTasks - (totalTasks * (elapsed / totalDuration)));
            }

            // Actual: Tasks remaining
            // Count tasks where (createdAt <= date) AND (completedAt is NULL OR completedAt > date)
            const actual = tasks.filter(t => {
                const created = new Date(t.createdAt);
                created.setHours(0, 0, 0, 0);
                if (created > date) return false; // Not created yet

                if (!t.completedAt) return true; // Not completed yet
                const completed = new Date(t.completedAt);
                completed.setHours(0, 0, 0, 0);
                return completed > date; // Completed AFTER this date
            }).length;

            return {
                date: date.toISOString().split('T')[0],
                ideal: Math.round(ideal),
                actual
            };
        });

        const blockedTasks = tasks.filter(t => t.isBlocked);

        return { chartData, blockedTasks };
    }
}
