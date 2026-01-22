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

        // Extract userId and projectId from various sources
        const userId = request.headers['x-user-id'] || request.body?.userId || request.query?.userId;
        let projectId = request.headers['x-project-id'] || request.body?.projectId || request.query?.projectId || request.params?.projectId || request.params?.id;

        console.log(`[ProjectRolesGuard] Checking access. UserId: ${userId}, ProjectId: ${projectId}, Path: ${request.path}, Params: ${JSON.stringify(request.params)}`);

        if (!userId) {
            throw new ForbiddenException('User ID required for RBAC check');
        }

        // Special case: If we only have a resource ID (e.g. DELETE /tasks/:id), we might need projectId.
        // For simplicity, we REQUIRE the client to send projectId in query/body even for deletes if using this guard.
        if (!projectId) {
            // Fallback: Try to look it up if request param has 'projectId'? No, already checked.
            // If we really can't find it, we can't authorize.
            // We could try to lookup the Task/Snippet if we knew this was a task route...
            // But generic is better: Client MUST send projectId.
            throw new BadRequestException('Project ID required for RBAC check');
        }

        const membership = await this.prisma.projectMember.findUnique({
            where: {
                userId_projectId: {
                    userId: userId,
                    projectId: projectId,
                },
            },
        });

        if (!membership) {
            throw new ForbiddenException('You are not a member of this project');
        }

        // Hierarchy check
        // OWNER > EDITOR > VIEWER
        const roleLevel = {
            [ProjectRole.OWNER]: 3,
            [ProjectRole.EDITOR]: 2,
            [ProjectRole.VIEWER]: 1,
        };

        const userLevel = roleLevel[membership.role as ProjectRole] || 0;

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
