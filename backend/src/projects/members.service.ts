import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ProjectRole } from '../projects/project-role.enum';

@Injectable()
export class MembersService {
    constructor(private prisma: PrismaService) { }

    async getProjectMembers(projectId: string) {
        return this.prisma.projectMember.findMany({
            where: { projectId },
            include: { user: true },
        });
    }

    async inviteMember(projectId: string, email: string, role: string = 'VIEWER') {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw new NotFoundException('User with this email not found');
        }

        // Check if already a member
        const existing = await this.prisma.projectMember.findUnique({
            where: {
                userId_projectId: {
                    userId: user.id,
                    projectId,
                },
            },
        });

        if (existing) {
            throw new BadRequestException('User is already a member of this project');
        }

        return this.prisma.projectMember.create({
            data: {
                projectId,
                userId: user.id,
                role,
            },
            include: { user: true }
        });
    }

    async updateMemberRole(projectId: string, userId: string, role: string) {
        // Validate role enum if needed, or rely on TS/DB
        if (!Object.values(ProjectRole).includes(role as ProjectRole)) {
            throw new BadRequestException('Invalid role');
        }

        return this.prisma.projectMember.update({
            where: {
                userId_projectId: {
                    userId,
                    projectId,
                }
            },
            data: { role },
        });
    }

    async removeMember(projectId: string, userId: string) {
        return this.prisma.projectMember.delete({
            where: {
                userId_projectId: {
                    userId,
                    projectId,
                },
            },
        });
    }
}
