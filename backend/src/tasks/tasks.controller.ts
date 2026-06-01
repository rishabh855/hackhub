import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { ProjectRoles } from '../auth/project-roles.decorator';
import { ProjectRolesGuard } from '../auth/project-roles.guard';
import { ProjectRole } from '../projects/project-role.enum';
import { SupabaseAuthGuard } from '../auth/supabase.guard';
import { User } from '../auth/user.decorator';

@Controller('tasks')
@UseGuards(SupabaseAuthGuard)
export class TasksController {
    constructor(private readonly tasksService: TasksService) { }

    @Post()
    @ProjectRoles(ProjectRole.MEMBER)
    @UseGuards(ProjectRolesGuard)
    create(@User() user: any, @Body() body: { title: string; projectId: string; description?: string; priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'; assigneeIds?: string[]; dueDate?: Date; labels?: string[]; isBlocked?: boolean; blockedReason?: string }) {
        return this.tasksService.createTask(user.id, body);
    }

    @Get()
    @ProjectRoles(ProjectRole.MEMBER)
    @UseGuards(ProjectRolesGuard)
    findAll(@User() user: any, @Query('projectId') projectId: string) {
        return this.tasksService.getProjectTasks(projectId, user.id);
    }

    @Patch(':id')
    @ProjectRoles(ProjectRole.MEMBER)
    @UseGuards(ProjectRolesGuard)
    update(@Param('id') id: string, @User() user: any, @Body() body: any) {
        return this.tasksService.updateTask(id, user.id, body);
    }

    @Delete(':id')
    @ProjectRoles(ProjectRole.MEMBER)
    @UseGuards(ProjectRolesGuard)
    delete(@User() user: any, @Param('id') id: string) {
        return this.tasksService.deleteTask(id, user.id);
    }

    @Post(':id/submit-review')
    @ProjectRoles(ProjectRole.MEMBER)
    @UseGuards(ProjectRolesGuard)
    submitReview(@Param('id') id: string, @User() user: any) {
        return this.tasksService.submitReview(id, user.id);
    }

    @Post(':id/approve')
    @ProjectRoles(ProjectRole.MEMBER)
    @UseGuards(ProjectRolesGuard)
    approve(@Param('id') id: string, @User() user: any) {
        return this.tasksService.approveTask(id, user.id);
    }

    @Post(':id/reject')
    @ProjectRoles(ProjectRole.MEMBER)
    @UseGuards(ProjectRolesGuard)
    reject(@Param('id') id: string, @User() user: any, @Body('reason') reason: string) {
        return this.tasksService.rejectTask(id, user.id, reason);
    }

    @Get(':id/activities')
    @ProjectRoles(ProjectRole.MEMBER)
    @UseGuards(ProjectRolesGuard)
    getActivities(@Param('id') id: string) {
        return this.tasksService.getTaskActivities(id);
    }
}
