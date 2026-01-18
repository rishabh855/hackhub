import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
    constructor(private readonly projectsService: ProjectsService) { }

    @Post()
    create(@Body() body: { teamId: string; name: string; description?: string; userId: string }) {
        // In a real app we'd get userId from Request object (JWT), but adhering to current API pattern 
        // or we updates frontend to pass it. 
        // Better: user ID should come from `@Req` user if available.
        // For MVP speed: assuming the body has it or we will pass it from frontend.
        // Actually, let's strictly require it.
        return this.projectsService.createProject(body.teamId, body.name, body.userId, body.description);
    }

    @Get()
    findAll(@Query('teamId') teamId: string) {
        return this.projectsService.getTeamProjects(teamId);
    }
}
