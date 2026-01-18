import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { SnippetsService } from './snippets.service';
import { ProjectRoles } from '../auth/project-roles.decorator';
import { ProjectRolesGuard } from '../auth/project-roles.guard';
import { ProjectRole } from '../projects/project-role.enum';

@Controller('snippets')
export class SnippetsController {
    constructor(private readonly snippetsService: SnippetsService) { }

    @Post()
    @ProjectRoles(ProjectRole.EDITOR)
    @UseGuards(ProjectRolesGuard)
    create(@Body() body: { userId: string; projectId: string; title: string; code: string; language: string; description?: string }) {
        const { userId, projectId, ...data } = body;
        return this.snippetsService.createSnippet(userId, projectId, data);
    }

    @Get()
    findAll(@Query('projectId') projectId: string) {
        return this.snippetsService.getProjectSnippets(projectId);
    }

    @Patch(':id')
    @ProjectRoles(ProjectRole.EDITOR)
    @UseGuards(ProjectRolesGuard)
    update(@Param('id') id: string, @Body() data: any) {
        return this.snippetsService.updateSnippet(id, data);
    }

    @Delete(':id')
    @ProjectRoles(ProjectRole.EDITOR)
    @UseGuards(ProjectRolesGuard)
    remove(@Param('id') id: string) {
        return this.snippetsService.deleteSnippet(id);
    }
}
