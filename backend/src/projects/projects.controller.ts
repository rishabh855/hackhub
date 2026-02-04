import { Controller, Post, Body, Get, Query, Param, Patch, Delete, UseGuards } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectRoles } from '../auth/project-roles.decorator';
import { ProjectRolesGuard } from '../auth/project-roles.guard';
import { ProjectRole } from './project-role.enum';
import { SupabaseAuthGuard } from '../auth/supabase.guard';
import { User } from '../auth/user.decorator';

@Controller('projects')
@UseGuards(SupabaseAuthGuard)
export class ProjectsController {
    constructor(private readonly projectsService: ProjectsService) { }

    @Post()
    create(@User() user: any, @Body() body: { teamId: string; name: string; description?: string }) {
        return this.projectsService.createProject(body.teamId, body.name, user.id, body.description);
    }

    @Get()
    findAll(@Query('teamId') teamId: string) {
        return this.projectsService.getTeamProjects(teamId);
    }

    @Get(':id/analytics/burndown')
    getBurndown(@Param('id') projectId: string) {
        console.log(`Getting burndown for project ${projectId}`);
        return this.projectsService.getBurndown(projectId);
    }

    @Get(':id/membership')
    getMembership(@Param('id') projectId: string, @User() user: any) {
        return this.projectsService.getMembership(projectId, user.id);
    }

    @Get(':id/members')
    getMembers(@Param('id') projectId: string) {
        return this.projectsService.getProjectMembers(projectId);
    }

    @Post(':id/members')
    @ProjectRoles(ProjectRole.OWNER)
    @UseGuards(ProjectRolesGuard)
    addMember(@Param('id') projectId: string, @Body() body: { email: string, role: string }) {
        return this.projectsService.addMember(projectId, body.email, body.role);
    }

    @Patch(':id/members/:userId')
    @ProjectRoles(ProjectRole.OWNER)
    @UseGuards(ProjectRolesGuard)
    updateMember(@Param('id') projectId: string, @Param('userId') userId: string, @Body() body: { role: string }) {
        return this.projectsService.updateMemberRole(projectId, userId, body.role);
    }

    @Delete(':id/members/:userId')
    @ProjectRoles(ProjectRole.OWNER)
    @UseGuards(ProjectRolesGuard)
    removeMember(@Param('id') projectId: string, @Param('userId') userId: string) {
        return this.projectsService.removeMember(projectId, userId);
    }

    @Get(':id')
    getProject(@Param('id') id: string) {
        return this.projectsService.getProject(id);
    }

    @Patch(':id')
    @ProjectRoles(ProjectRole.EDITOR)
    @UseGuards(ProjectRolesGuard)
    update(@Param('id') id: string, @Body() body: any) {
        return this.projectsService.updateProject(id, body);
    }
}
