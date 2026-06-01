import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { NotificationsController } from './notifications.controller';
import { PrismaService } from '../prisma.service';
import { ChatModule } from '../chat/chat.module';

@Module({
    imports: [ChatModule],
    controllers: [TasksController, NotificationsController],
    providers: [TasksService, PrismaService],
    exports: [TasksService],
})
export class TasksModule { }
