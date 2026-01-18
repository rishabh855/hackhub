import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getTeamProjects, createProject } from '@/lib/api';
import { Plus, MessageSquare, X, ArrowLeft, LayoutGrid } from 'lucide-react';
import Link from 'next/link';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { KanbanBoard } from '@/components/kanban/kanban-board';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AiProjectSummary } from '@/components/ai/ai-project-summary';
import { SnippetList } from "@/components/snippets/snippet-list";

import { SubmissionTab } from '@/components/submissions/submission-tab';
import { ChatWindow } from '@/components/chat/chat-window';
import { DecisionList } from '@/components/decisions/decision-list';
import { ProgressTab } from '@/components/analytics/progress-tab';
import { motion, AnimatePresence } from 'framer-motion';

type Project = {
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
    submissionGithub?: string;
    submissionDemo?: string;
    submissionPPT?: string;
    submissionVideo?: string;
    submissionDescription?: string;
};

export function ProjectList({ teamId, teamName }: { teamId: string; teamName?: string }) {
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
                    {/* Header Region */}
                    {/* Breadcrumb Navigation */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 p-0 hover:bg-transparent text-muted-foreground hover:text-foreground"
                            onClick={() => setSelectedProject(null)}
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <span
                            className="hover:text-foreground cursor-pointer transition-colors"
                            onClick={() => setSelectedProject(null)}
                        >
                            {teamName}
                        </span>
                        <span className="text-muted-foreground/40">&gt;</span>
                        <span className="font-medium text-foreground">{selectedProject.name}</span>
                    </div>

                    {/* Project Header */}
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-3xl font-extrabold tracking-tight text-foreground leading-none mb-2">{selectedProject.name}</h2>
                            <p className="text-muted-foreground text-base max-w-2xl">{selectedProject.description}</p>
                        </div>
                        <div className="shrink-0 pt-1">
                            <AiProjectSummary projectId={selectedProject.id} />
                        </div>
                    </div>

                    <Tabs defaultValue="kanban" className="space-y-4">

                        <div className="flex items-center justify-between">
                            <TabsList className="bg-transparent border-b rounded-none h-auto p-0 w-full justify-start gap-6">
                                {['kanban', 'snippets', 'chat', 'decisions', 'progress', 'submission'].map((tab) => (
                                    <TabsTrigger
                                        key={tab}
                                        value={tab}
                                        className="rounded-none border-b-2 border-transparent px-0 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none transition-all duration-200"
                                    >
                                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </div>


                        <TabsContent value="kanban" className="h-[calc(100vh-250px)]">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="h-full"
                            >

                                <KanbanBoard projectId={selectedProject.id} />
                            </motion.div>
                        </TabsContent>
                        <TabsContent value="snippets">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="max-w-4xl mx-auto py-6"
                            >
                                <SnippetList projectId={selectedProject.id} />
                            </motion.div>
                        </TabsContent>
                        <TabsContent value="chat" className="h-[calc(100vh-250px)]">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="max-w-4xl mx-auto py-6 h-full"
                            >
                                <ChatWindow teamId={teamId} projectId={selectedProject.id} />
                            </motion.div>
                        </TabsContent>
                        <TabsContent value="decisions">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="max-w-4xl mx-auto py-6"
                            >
                                <DecisionList projectId={selectedProject.id} role={(session?.user as any)?.role || 'VIEWER'} />
                            </motion.div>
                        </TabsContent>
                        <TabsContent value="progress">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="max-w-4xl mx-auto py-6"
                            >
                                <ProgressTab projectId={selectedProject.id} />
                            </motion.div>
                        </TabsContent>
                        <TabsContent value="submission">
                            <motion.div
                                initial={{ opacity: 0, y: 0 }} // Less movement for checklist
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className="max-w-4xl mx-auto py-6"
                            >
                                <SubmissionTab projectId={selectedProject.id} role={(session?.user as any)?.role || 'VIEWER'} />
                            </motion.div>
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
                        className="rounded-full h-12 w-12 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 bg-primary text-primary-foreground"
                    >
                        <MessageSquare className="h-5 w-5" />
                    </Button>
                )}
            </div>
        </div>
    );
}
