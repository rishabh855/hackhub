import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { TeamsService } from './teams.service';

@Controller('teams')
export class TeamsController {
    constructor(private readonly teamsService: TeamsService) { }

    @Post()
    create(@Body('userId') userId: string, @Body('name') name: string) {
        return this.teamsService.createTeam(userId, name);
    }

    @Get()
    findAll(@Query('userId') userId: string) {
        return this.teamsService.getUserTeams(userId);
    }

    @Post(':id/members')
    invite(@Param('id') teamId: string, @Body('email') email: string) {
        return this.teamsService.inviteMember(teamId, email);
    }
}
