import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { SnippetsService } from './snippets.service';

@Controller('snippets')
export class SnippetsController {
    constructor(private readonly snippetsService: SnippetsService) { }

    @Post()
    create(@Body() body: { userId: string; projectId: string; title: string; code: string; language: string; description?: string }) {
        const { userId, projectId, ...data } = body;
        return this.snippetsService.createSnippet(userId, projectId, data);
    }

    @Get()
    findAll(@Query('projectId') projectId: string) {
        return this.snippetsService.getProjectSnippets(projectId);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() data: any) {
        return this.snippetsService.updateSnippet(id, data);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.snippetsService.deleteSnippet(id);
    }
}
