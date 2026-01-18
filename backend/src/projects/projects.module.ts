import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { PrismaService } from '../prisma.service';

import { MembersController } from './members.controller';
import { MembersService } from './members.service';

@Module({
    controllers: [ProjectsController, MembersController],
    providers: [ProjectsService, MembersService, PrismaService],
})
export class ProjectsModule { }
