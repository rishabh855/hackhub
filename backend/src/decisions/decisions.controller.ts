import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { DecisionsService } from './decisions.service';
import { ProjectRolesGuard } from '../auth/project-roles.guard';
import { ProjectRoles } from '../auth/project-roles.decorator';
import { ProjectRole } from '../projects/project-role.enum';
import { SupabaseAuthGuard } from '../auth/supabase.guard';
import { User } from '../auth/user.decorator';

@Controller()
@UseGuards(SupabaseAuthGuard, ProjectRolesGuard)
export class DecisionsController {
    constructor(private readonly decisionsService: DecisionsService) { }

    @Post('projects/:projectId/decisions')
    @ProjectRoles(ProjectRole.MEMBER)
    async create(
        @Param('projectId') projectId: string,
        @User() user: any,
        @Body() body: { title: string; content: string; taskId?: string }
    ) {
        return this.decisionsService.create(projectId, user.id, body);
    }

    @Get('projects/:projectId/decisions')
    @ProjectRoles(ProjectRole.MEMBER) // Viewers can read
    async findAll(@Param('projectId') projectId: string) {
        return this.decisionsService.findAll(projectId);
    }

    @Post('decisions/:decisionId/notes')
    // We need to resolve projectId from decisionId to check permissions? 
    // ProjectRolesGuard needs a projectId. 
    // If we only have decisionId, we might need a custom lookup or pass projectId in query.
    // Let's require projectId in query for simplicity: ?projectId=...
    @ProjectRoles(ProjectRole.MEMBER)
    async addNote(
        @Param('decisionId') decisionId: string,
        @User() user: any,
        @Body() body: { content: string }
    ) {
        return this.decisionsService.addNote(decisionId, user.id, body.content);
    }
}
