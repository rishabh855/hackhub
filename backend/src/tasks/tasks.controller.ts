import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { ProjectRoles } from '../auth/project-roles.decorator';
import { ProjectRolesGuard } from '../auth/project-roles.guard';
import { ProjectRole } from '../projects/project-role.enum';

@Controller('tasks')
export class TasksController {
    constructor(private readonly tasksService: TasksService) { }

    @Post()
    @ProjectRoles(ProjectRole.EDITOR)
    @UseGuards(ProjectRolesGuard)
    create(@Body() body: { title: string; projectId: string; description?: string; priority?: string; assigneeId?: string; dueDate?: Date; labels?: string[]; isBlocked?: boolean; blockedReason?: string }) {
        return this.tasksService.createTask(body);
    }

    @Get()
    findAll(@Query('projectId') projectId: string) {
        return this.tasksService.getProjectTasks(projectId);
    }

    @Patch(':id')
    @ProjectRoles(ProjectRole.EDITOR)
    @UseGuards(ProjectRolesGuard)
    update(@Param('id') id: string, @Body() body: any) {
        return this.tasksService.updateTask(id, body);
    }

    @Delete(':id')
    @ProjectRoles(ProjectRole.EDITOR)
    @UseGuards(ProjectRolesGuard)
    delete(@Param('id') id: string) {
        // Warning: guard needs projectId in query/body!
        return this.tasksService.deleteTask(id);
    }
}
