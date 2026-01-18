import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController {
    constructor(private readonly tasksService: TasksService) { }

    @Post()
    create(@Body() body: { title: string; projectId: string; description?: string; priority?: string; assigneeId?: string }) {
        return this.tasksService.createTask(body);
    }

    @Get()
    findAll(@Query('projectId') projectId: string) {
        return this.tasksService.getProjectTasks(projectId);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() body: any) {
        return this.tasksService.updateTask(id, body);
    }

    @Delete(':id')
    delete(@Param('id') id: string) {
        return this.tasksService.deleteTask(id);
    }
}
