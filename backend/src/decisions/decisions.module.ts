import { Module } from '@nestjs/common';
import { DecisionsController } from './decisions.controller';
import { DecisionsService } from './decisions.service';
import { PrismaService } from '../prisma.service';
import { ProjectsService } from '../projects/projects.service';
// Needed for ProjectRolesGuard if it uses ProjectsService, 
// OR we just provide PrismaService as Guard might need DB access directly or via Service.
// Checking ProjectRolesGuard... it uses PrismaService usually.

@Module({
    controllers: [DecisionsController],
    providers: [DecisionsService, PrismaService, ProjectsService],
})
export class DecisionsModule { }
