import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ProjectsService {
    constructor(private prisma: PrismaService) { }

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
}
