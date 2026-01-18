import { Body, Controller, Post } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
    constructor(private readonly aiService: AiService) { }

    @Post('chat')
    async chat(@Body() body: { message: string; context?: any }) {
        return this.aiService.chat(body.message, body.context);
    }

    @Post('generate-tasks')
    async generateTasks(@Body() body: { description: string }) {
        return this.aiService.generateTasks(body.description);
    }

    @Post('explain-snippet')
    async explainSnippet(@Body() body: { code: string; language: string }) {
        return this.aiService.explainSnippet(body.code, body.language);
    }

    @Post('summarize-project')
    async summarizeProject(@Body() body: { projectId: string }) {
        return this.aiService.summarizeProject(body.projectId);
    }

    @Post('analyze-scope')
    async analyzeScope(@Body() body: { projectId: string }) {
        return this.aiService.analyzeScope(body.projectId);
    }
}
