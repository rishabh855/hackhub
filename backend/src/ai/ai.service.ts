import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AiService {
    private genAI: GoogleGenerativeAI;
    private model: any;

    constructor(private prisma: PrismaService) {
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

    async summarizeProject(projectId: string) {
        if (!this.model) return this.mockSummarizeProject();

        try {
            const project = await this.prisma.project.findUnique({
                where: { id: projectId },
                include: { tasks: true }
            });

            if (!project) throw new Error('Project not found');

            const taskSummary = project.tasks.map(t => `- ${t.title} (${t.status})`).join('\n');
            const prompt = `
                You are a project manager. Summarize the current state of this project based on these tasks.
                Project: ${project.name}
                Description: ${project.description || 'No description'}
                
                Tasks:
                ${taskSummary}
                
                Output a 3-4 sentence summary highlighting what has been done (DONE), what is in progress (IN_PROGRESS), and what is pending (TODO). 
                Keep it professional and encouraging. Do not use markdown formatting like bold or headers.
            `;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            return { summary: response.text() };

        } catch (error) {
            console.error("Gemini Error (Summarize):", error);
            return this.mockSummarizeProject();
        }
    }

    private mockSummarizeProject() {
        return {
            summary: "This project is making good progress. Several core features are implemented, and the team is currently focusing on remaining tasks. [Mock Summary]"
        };
    }

    async analyzeScope(projectId: string) {
        if (!this.model) return this.mockAnalyzeScope();

        try {
            const project = await this.prisma.project.findUnique({
                where: { id: projectId },
                include: { tasks: true }
            });

            if (!project) throw new Error('Project not found');

            const totalTasks = project.tasks.length;
            const completedTasks = project.tasks.filter(t => t.status === 'DONE').length;
            const inProgressTasks = project.tasks.filter(t => t.status === 'IN_PROGRESS').length;
            const pendingTasks = totalTasks - completedTasks;

            // Infer deadline: max due date or today + 14 days
            const dueDates = project.tasks.map(t => t.dueDate).filter(d => d !== null) as Date[];
            let deadline = new Date();
            if (dueDates.length > 0) {
                deadline = dueDates.reduce((a, b) => a > b ? a : b);
            } else {
                deadline.setDate(deadline.getDate() + 14);
            }

            const prompt = `
                You are an expert Agile Project Manager. Analyze this project's scope and timeline risk.
                
                Context:
                - Project: ${project.name}
                - Total Tasks: ${totalTasks}
                - Completed: ${completedTasks}
                - In Progress: ${inProgressTasks}
                - Pending: ${pendingTasks}
                - Implied Deadline: ${deadline.toISOString().split('T')[0]}
                - Current Date: ${new Date().toISOString().split('T')[0]}
                
                Task List (Sample):
                ${project.tasks.slice(0, 10).map(t => `- ${t.title} (${t.priority})`).join('\n')}
                ${project.tasks.length > 10 ? `...and ${project.tasks.length - 10} more` : ''}

                Determine the RISK LEVEL (LOW, MEDIUM, HIGH) of missing the deadline or having scope creep.
                Provide a 'reason' (max 1 sentence) and a 'recommendation' (concise).
                
                Return ONLY valid JSON in this exact format:
                { 
                    "risk": "HIGH", 
                    "reason": "Brief reason...", 
                    "recommendation": "Brief recommendation..." 
                }
            `;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(text);

        } catch (error) {
            console.error("Gemini Error (Scope):", error);
            return this.mockAnalyzeScope();
        }
    }

    private mockAnalyzeScope() {
        return {
            risk: "MEDIUM",
            reason: "Mock Analysis: Risk calculated based on default fallback.",
            recommendation: "Review tasks and set clear deadlines."
        };
    }
}
