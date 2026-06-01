import { Module } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { InvitationsController } from './invitations.controller';
import { PrismaService } from '../prisma.service';
import { ProjectsModule } from '../projects/projects.module';
import { EmailModule } from '../email/email.module';
import { ChatModule } from '../chat/chat.module';

@Module({
    imports: [ProjectsModule, EmailModule, ChatModule],
    controllers: [InvitationsController],
    providers: [InvitationsService, PrismaService],
    exports: [InvitationsService],
})
export class InvitationsModule { }
