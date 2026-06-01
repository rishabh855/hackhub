import { Body, Controller, Get, Param, Post, Query, UseGuards, Delete, Patch } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { SupabaseAuthGuard } from '../auth/supabase.guard';
import { User } from '../auth/user.decorator';

@Controller('teams')
@UseGuards(SupabaseAuthGuard)
export class TeamsController {
    constructor(private readonly teamsService: TeamsService) { }

    @Post()
    create(@User() user: any, @Body('name') name: string) {
        return this.teamsService.createTeam(user.id, name);
    }

    @Get()
    @Get()
    findAll(@User() user: any) {
        return this.teamsService.getUserTeams(user.id);
    }

    @Post(':id/members')
    invite(@Param('id') teamId: string, @Body('email') email: string) {
        return this.teamsService.inviteMember(teamId, email);
    }
    @Delete(':id')
    deleteTeam(@User() user: any, @Param('id') teamId: string) {
        return this.teamsService.deleteTeam(teamId, user.id);
    }

    @Delete(':id/members/:memberId')
    removeMember(@User() user: any, @Param('id') teamId: string, @Param('memberId') memberId: string) {
        return this.teamsService.removeMember(teamId, user.id, memberId);
    }

    @Patch(':id/members/:memberId')
    updateMemberRole(
        @User() user: any,
        @Param('id') teamId: string,
        @Param('memberId') memberId: string,
        @Body('role') role: string
    ) {
        return this.teamsService.updateMemberRole(teamId, user.id, memberId, role);
    }
}
