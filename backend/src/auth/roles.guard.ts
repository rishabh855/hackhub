import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma.service';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector, private prisma: PrismaService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const roles = this.reflector.get<string[]>('roles', context.getHandler());
        if (!roles) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;
        // Assuming backend receives projectId in params or body
        const projectId = request.params.id || request.body.projectId || request.query.projectId;

        if (!user || !projectId) {
            // If we can't determine context, we might default to safe or throw.
            // For now, if no projectId found but route is protected, deny.
            return false;
        }

        const membership = await this.prisma.projectMember.findUnique({
            where: {
                userId_projectId: {
                    userId: user.userId,
                    projectId: projectId,
                },
            },
        });

        if (!membership) {
            throw new ForbiddenException('You are not a member of this project');
        }

        if (!roles.includes(membership.role)) {
            throw new ForbiddenException(`Insufficient permissions. Required: ${roles.join(', ')}`);
        }

        return true;
    }
}
