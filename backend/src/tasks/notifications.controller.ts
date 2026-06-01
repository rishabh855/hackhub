import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { SupabaseAuthGuard } from '../auth/supabase.guard';
import { User } from '../auth/user.decorator';

@Controller('notifications')
@UseGuards(SupabaseAuthGuard)
export class NotificationsController {
    constructor(private readonly tasksService: TasksService) { }

    @Get()
    getUserNotifications(@User() user: any) {
        return this.tasksService.getUserNotifications(user.id);
    }

    @Post(':id/read')
    markAsRead(@User() user: any, @Param('id') id: string) {
        return this.tasksService.markNotificationAsRead(id, user.id);
    }
}
