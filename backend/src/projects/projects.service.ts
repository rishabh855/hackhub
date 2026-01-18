import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ProjectsService {
    constructor(private prisma: PrismaService) { }

    async createProject(teamId: string, name: string, description?: string) {
        return this.prisma.project.create({
            data: {
                name,
                description,
                teamId,
            },
        });
    }

    async getTeamProjects(teamId: string) {
        return this.prisma.project.findMany({
            where: { teamId },
            orderBy: { createdAt: 'desc' },
        });
    }
}
