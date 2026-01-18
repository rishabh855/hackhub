import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiService {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor() {
        if (!process.env.GEMINI_API_KEY) {
            console.error('CRITICAL: GEMINI_API_KEY is missing from process.env');
            return;
        }
        console.log('AiService: Initializing Gemini with Key starting with ' + process.env.GEMINI_API_KEY.substring(0, 5));
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    }

    async chat(message: string, context: any) {
        if (!this.model) return this.mockChat(message);

        try {
            const result = await this.model.generateContent(`
                You are a helpful assistant for a developer collaboration platform called HackHub.
                Context: ${JSON.stringify(context)}
                User says: "${message}"
                Provide a concise and helpful response.
            `);
            const response = await result.response;
            return { reply: response.text() };
        } catch (error) {
            console.error("Gemini Error (Chat):", error);
            return this.mockChat(message, "(Fallback due to API Error)");
        }
    }

    private mockChat(message: string, prefix = "") {
        return {
            reply: `[AI Mock${prefix}]: I received your message: "${message}". I can help with tasks and code explanations!`
        };
    }

    async generateTasks(projectDescription: string) {
        if (!this.model) return this.mockGenerateTasks();

        try {
            const prompt = `
                Analyze this project description and suggest 3-5 actionable tasks for a Kanban board.
                Project Description: "${projectDescription}"
                
                Return ONLY valid JSON in this exact format, with no markdown code blocks:
                {
                    "tasks": [
                        { "title": "Task Title", "description": "Short description" }
                    ]
                }
            `;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();

            return JSON.parse(text);
        } catch (error) {
            console.error("Gemini Error (Tasks):", error);
            return this.mockGenerateTasks();
        }
    }

    private mockGenerateTasks() {
        return {
            tasks: [
                { title: 'Setup Database', description: 'Initialize Prisma and Postgres' },
                { title: 'Create Auth API', description: 'Implement JWT strategy' },
                { title: 'Design Landing Page', description: 'Use Tailwind CSS for landing page' }
            ]
        };
    }

    async explainSnippet(code: string, language: string) {
        if (!this.model) return this.mockExplainSnippet();

        try {
            const prompt = `
                Explain this ${language} code snippet concisely for a developer.
                Code:
                ${code}
            `;
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            return { explanation: response.text() };
        } catch (error) {
            console.error("Gemini Error (Explain):", error);
            return this.mockExplainSnippet(language);
        }
    }

    private mockExplainSnippet(language: string = "code") {
        return {
            explanation: `[Mock Analysis]: This appears to be valid ${language} code. (Real AI analysis failed).`
        };
    }
}
