import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { DecisionsService } from './decisions.service';
import { ProjectRolesGuard } from '../auth/project-roles.guard';
import { ProjectRoles } from '../auth/project-roles.decorator';
import { ProjectRole } from '../projects/project-role.enum';

@Controller()
@UseGuards(ProjectRolesGuard)
export class DecisionsController {
    constructor(private readonly decisionsService: DecisionsService) { }

    @Post('projects/:projectId/decisions')
    @ProjectRoles(ProjectRole.EDITOR)
    async create(
        @Param('projectId') projectId: string,
        @Request() req,
        @Body() body: { title: string; content: string; taskId?: string }
    ) {
        // Extract userId from header or request (ProjectRolesGuard puts user in internal request usually, 
        // but here we depend on x-user-id header or session handled by guard. 
        // Our guard extraction logic puts userId in headers or query mostly.
        // Let's rely on the header 'x-user-id' which should be present and validated by Guard/Middleware.
        // Actually, ProjectRolesGuard logic reads x-user-id. We can use it directly or get it from req.headers['x-user-id']
        const userId = req.headers['x-user-id'] as string;
        return this.decisionsService.create(projectId, userId, body);
    }

    @Get('projects/:projectId/decisions')
    @ProjectRoles(ProjectRole.VIEWER) // Viewers can read
    async findAll(@Param('projectId') projectId: string) {
        return this.decisionsService.findAll(projectId);
    }

    @Post('decisions/:decisionId/notes')
    // We need to resolve projectId from decisionId to check permissions? 
    // ProjectRolesGuard needs a projectId. 
    // If we only have decisionId, we might need a custom lookup or pass projectId in query.
    // Let's require projectId in query for simplicity: ?projectId=...
    @ProjectRoles(ProjectRole.EDITOR)
    async addNote(
        @Param('decisionId') decisionId: string,
        @Request() req,
        @Body() body: { content: string }
    ) {
        const userId = req.headers['x-user-id'] as string;
        return this.decisionsService.addNote(decisionId, userId, body.content);
    }
}
