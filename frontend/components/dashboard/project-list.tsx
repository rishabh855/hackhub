import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getTeamProjects, createProject } from '@/lib/api';
import { Plus, MessageSquare, X, ArrowLeft } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { KanbanBoard } from '@/components/kanban/kanban-board';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SnippetList } from "@/components/snippets/snippet-list";
import { AiTaskSuggester } from '@/components/ai/ai-task-suggester';
import { ChatWindow } from '@/components/chat/chat-window';
import { DecisionList } from '@/components/decisions/decision-list';
import { ProgressTab } from '@/components/analytics/progress-tab';

type Project = {
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
};

export function ProjectList({ teamId }: { teamId: string }) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [newProjectName, setNewProjectName] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);

    useEffect(() => {
        if (teamId) {
            loadProjects();
        }
    }, [teamId]);

    async function loadProjects() {
        try {
            const data = await getTeamProjects(teamId);
            setProjects(data);
        } catch (err) {
            console.error(err);
        }
    }

    const { data: session } = useSession();

    async function handleCreateProject() {
        if (!newProjectName.trim() || !session?.user) return;
        setLoading(true);
        try {
            // @ts-ignore
            await createProject(teamId, newProjectName, (session.user as any).id);
            setIsOpen(false);
            setNewProjectName('');
            loadProjects();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="relative min-h-[calc(100vh-100px)]">
            {selectedProject ? (
                <div className="space-y-6">
                    <div className="flex items-center space-x-4">
                        <Button variant="ghost" onClick={() => setSelectedProject(null)}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Projects
                        </Button>
                        <h2 className="text-2xl font-bold tracking-tight">{selectedProject.name}</h2>
                    </div>

                    <Tabs defaultValue="kanban" className="w-full">

                        <TabsList>
                            <TabsTrigger value="kanban">Tasks & Kanban</TabsTrigger>
                            <TabsTrigger value="snippets">Code Snippets</TabsTrigger>
                            <TabsTrigger value="chat">Chat</TabsTrigger>
                            <TabsTrigger value="decisions">Decisions</TabsTrigger>
                            <TabsTrigger value="progress">Progress</TabsTrigger>
                        </TabsList>
                        <TabsContent value="kanban" className="h-[calc(100vh-250px)]">
                            <div className="flex justify-end mb-2">
                                <AiTaskSuggester projectId={selectedProject.id} onTasksCreated={loadProjects} />
                            </div>
                            <KanbanBoard projectId={selectedProject.id} />
                        </TabsContent>
                        <TabsContent value="snippets">
                            <div className="max-w-4xl mx-auto py-6">
                                <SnippetList projectId={selectedProject.id} />
                            </div>
                        </TabsContent>
                        <TabsContent value="chat" className="h-[calc(100vh-250px)]">
                            <div className="max-w-4xl mx-auto py-6 h-full">
                                <ChatWindow teamId={teamId} projectId={selectedProject.id} />
                            </div>
                        </TabsContent>
                        <TabsContent value="decisions">
                            <div className="max-w-4xl mx-auto py-6">
                                <DecisionList projectId={selectedProject.id} role={(session?.user as any)?.role || 'VIEWER'} />
                            </div>
                        </TabsContent>
                        <TabsContent value="progress">
                            <div className="max-w-4xl mx-auto py-6">
                                <ProgressTab projectId={selectedProject.id} />
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            ) : (
                <div className="space-y-4 mt-8">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Projects</h2>
                        <Dialog open={isOpen} onOpenChange={setIsOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm"><Plus className="mr-2 h-4 w-4" /> New Project</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Create New Project</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <label htmlFor="proj-name" className="text-sm font-medium">Project Name</label>
                                        <Input
                                            id="proj-name"
                                            placeholder="e.g. AI Med assistant"
                                            value={newProjectName}
                                            onChange={(e) => setNewProjectName(e.target.value)}
                                        />
                                    </div>
                                    <Button onClick={handleCreateProject} disabled={loading} className="w-full">
                                        {loading ? 'Creating...' : 'Create Project'}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {projects.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 border rounded-lg bg-gray-50">
                            No projects yet. Start building something awesome!
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {projects.map((project) => (
                                <Card
                                    key={project.id}
                                    className="hover:shadow-md transition-shadow cursor-pointer"
                                    onClick={() => setSelectedProject(project)}
                                >
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">
                                            {project.name}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-xs text-muted-foreground truncate">
                                            {project.description || 'No description'}
                                        </div>
                                        <div className="text-xs text-gray-400 mt-2">
                                            Created {new Date(project.createdAt).toLocaleDateString()}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Chat Widget */}
            <div className="fixed bottom-6 right-6 z-50">
                {isChatOpen ? (
                    <div className="relative shadow-xl rounded-lg overflow-hidden bg-white dark:bg-gray-900 border w-80 md:w-96">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 z-10 h-6 w-6"
                            onClick={() => setIsChatOpen(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                        <ChatWindow teamId={teamId} projectId={selectedProject?.id} />
                    </div>
                ) : (
                    <Button
                        onClick={() => setIsChatOpen(true)}
                        className="rounded-full h-14 w-14 shadow-lg"
                    >
                        <MessageSquare className="h-6 w-6" />
                    </Button>
                )}
            </div>
        </div>
    );
}
