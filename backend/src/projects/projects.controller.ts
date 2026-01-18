import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
    constructor(private readonly projectsService: ProjectsService) { }

    @Post()
    create(@Body() body: { teamId: string; name: string; description?: string }) {
        return this.projectsService.createProject(body.teamId, body.name, body.description);
    }

    @Get()
    findAll(@Query('teamId') teamId: string) {
        return this.projectsService.getTeamProjects(teamId);
    }
}
