import { Controller, Post, Body, Get, Param, UseGuards, Req } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { SupabaseAuthGuard } from '../auth/supabase.guard'; // Assuming global auth
import { ProjectRolesGuard } from '../auth/project-roles.guard';
import { ProjectRoles } from '../auth/project-roles.decorator';
import { ProjectRole } from '../projects/project-role.enum';
import { User } from '../auth/user.decorator';

@Controller('invitations')
export class InvitationsController {
    constructor(private readonly invitationsService: InvitationsService) { }

    @Post('create')
    @UseGuards(SupabaseAuthGuard)
    async createInvite(
        @User() user: any,
        @Body() body: { teamId: string; type: 'EMAIL' | 'LINK' | 'CODE'; email?: string }
    ) {
        return this.invitationsService.createInvite(user.id, body.teamId, body.type, body.email);
    }

    @Post('accept')
    @UseGuards(SupabaseAuthGuard)
    async acceptInvite(@User() user: any, @Body() body: { tokenOrCode: string }) {
        return this.invitationsService.acceptInvite(user.id, body.tokenOrCode);
    }

    @Get('pending/:teamId')
    @UseGuards(SupabaseAuthGuard)
    async getPending(@Param('teamId') teamId: string) {
        return this.invitationsService.getPendingInvites(teamId);
    }
}
