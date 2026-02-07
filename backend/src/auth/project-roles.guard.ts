import { CanActivate, ExecutionContext, Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma.service';
import { ROLES_KEY } from './project-roles.decorator';
import { ProjectRole } from '../projects/project-role.enum';

@Injectable()
export class ProjectRolesGuard implements CanActivate {
    constructor(private reflector: Reflector, private prisma: PrismaService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredRoles = this.reflector.getAllAndOverride<ProjectRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles) {
            return true;
        }

        const request = context.switchToHttp().getRequest();

        // Get authenticated user from request (set by SupabaseAuthGuard)
        const user = request.user;
        if (!user || !user.id) {
            throw new ForbiddenException('User authentication required for RBAC check');
        }
        const userId = user.id;

        // Get API parameters
        let projectId = request.headers['x-project-id'] || request.body?.projectId || request.query?.projectId || request.params?.projectId || request.params?.id;

        console.log(`[ProjectRolesGuard] Checking access. UserId: ${userId}, ProjectId: ${projectId}, Path: ${request.path}`);

        // Special case: If we only have a resource ID (e.g. DELETE /tasks/:id), we might need projectId.
        // For simplicity, we REQUIRE the client to send projectId in query/body even for deletes if using this guard.
        if (!projectId) {
            // Fallback: Try to look it up if request param has 'projectId'? No, already checked.
            // If we really can't find it, we can't authorize.
            // We could try to lookup the Task/Snippet if we knew this was a task route...
            // But generic is better: Client MUST send projectId.
            throw new BadRequestException('Project ID required for RBAC check');
        }

        // Check direct Project Membership
        const membership = await this.prisma.projectMember.findUnique({
            where: {
                userId_projectId: {
                    userId: userId,
                    projectId: projectId,
                },
            },
        });

        let userRole: ProjectRole | null = null;

        if (membership) {
            userRole = membership.role as ProjectRole;
        } else {
            // Fallback: Check if user is a member of the parent Team
            // This allows Team Members to automatically access Team Projects
            const project = await this.prisma.project.findUnique({
                where: { id: projectId },
                select: { teamId: true }
            });

            if (project) {
                const teamMember = await this.prisma.teamMember.findUnique({
                    where: {
                        userId_teamId: {
                            userId: userId,
                            teamId: project.teamId
                        }
                    }
                });

                if (teamMember) {
                    // Map Team Role to Project Role equivalent
                    // Team OWNER -> Project OWNER
                    // Team MEMBER -> Project MEMBER
                    userRole = teamMember.role === 'OWNER' ? ProjectRole.OWNER : ProjectRole.MEMBER;
                }
            }
        }

        if (!userRole) {
            throw new ForbiddenException('You are not a member of this project');
        }

        // Hierarchy check
        // OWNER > MEMBER
        const roleLevel = {
            [ProjectRole.OWNER]: 2,
            [ProjectRole.MEMBER]: 1,
        };

        const userLevel = roleLevel[userRole] || 0;

        // We assume requiredRoles lists the *minimum* role needed? 
        // Or usually generic roles allows specific list. 
        // Let's implement: "Must match one of the required roles".
        // But conceptually, if EDITOR is required, OWNER should also pass.
        // So we check if userLevel >= min(requiredRoles).

        // Find the lowest level in required roles (e.g. if allowed EDITOR or OWNER, min is EDITOR)
        // Usually we pass just one role: @Roles(ProjectRole.EDITOR)

        const minRequiredLevel = Math.min(...requiredRoles.map(r => roleLevel[r] || 0));

        if (userLevel < minRequiredLevel) {
            throw new ForbiddenException(`Insufficient permissions. Required level: ${requiredRoles.join(', ')}`);
        }

        return true;
    }
}
