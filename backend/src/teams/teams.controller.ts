import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
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
}
