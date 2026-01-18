import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { MembersService } from './members.service';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ProjectRole } from './project-role.enum';

@Controller('projects/:id/members')
@UseGuards(RolesGuard)
export class MembersController {
    constructor(private readonly membersService: MembersService) { }

    @Get()
    @Roles(ProjectRole.OWNER, ProjectRole.EDITOR, ProjectRole.VIEWER)
    findAll(@Param('id') projectId: string) {
        return this.membersService.getProjectMembers(projectId);
    }

    @Post()
    @Roles(ProjectRole.OWNER)
    invite(@Param('id') projectId: string, @Body() body: { email: string; role?: string }) {
        return this.membersService.inviteMember(projectId, body.email, body.role);
    }

    @Patch(':userId')
    @Roles(ProjectRole.OWNER)
    updateRole(
        @Param('id') projectId: string,
        @Param('userId') userId: string,
        @Body() body: { role: string }
    ) {
        return this.membersService.updateMemberRole(projectId, userId, body.role);
    }

    @Delete(':userId')
    @Roles(ProjectRole.OWNER)
    remove(
        @Param('id') projectId: string,
        @Param('userId') userId: string
    ) {
        return this.membersService.removeMember(projectId, userId);
    }
}
