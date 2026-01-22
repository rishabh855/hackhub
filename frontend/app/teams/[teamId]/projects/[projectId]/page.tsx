'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

import { getProject, getUserTeams } from '@/lib/api';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AiProjectSummary } from '@/components/ai/ai-project-summary';
import { KanbanBoard } from '@/components/kanban/kanban-board';
import { SnippetList } from "@/components/snippets/snippet-list";
import { ChatWindow } from '@/components/chat/chat-window';
import { DecisionList } from '@/components/decisions/decision-list';
import { ProgressTab } from '@/components/analytics/progress-tab';
import { SubmissionTab } from '@/components/submissions/submission-tab';
import { Skeleton } from '@/components/ui/skeleton';

interface Project {
    id: string;
    name: string;
    description: string | null;
}

export default function ProjectDashboardPage({ params }: { params: Promise<{ teamId: string; projectId: string }> }) {
    const { teamId, projectId } = use(params);
    const { data: session, status } = useSession();

    const [project, setProject] = useState<Project | null>(null);
    const [teamName, setTeamName] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === 'authenticated') {
            loadData();
        } else if (status === 'unauthenticated') {
            setLoading(false);
        }
    }, [status, session, projectId, teamId]);

    const loadData = async () => {
        try {
            // Parallel fetch for speed
            const [projData, teamsData] = await Promise.all([
                getProject(projectId),
                // @ts-ignore
                getUserTeams(session?.user?.id as string)
            ]);

            setProject(projData);

            // Find team name
            // @ts-ignore
            const team = teamsData.find((t: any) => t.id === teamId);
            if (team) setTeamName(team.name);

        } catch (err) {
            console.error("Failed to load dashboard data", err);
        } finally {
            setLoading(false);
        }
    };

    if (status === 'loading' || loading) {
        return (
            <div className="space-y-6">
                <div className="h-6 w-64 bg-muted rounded animate-pulse" />
                <div className="h-10 w-96 bg-muted rounded animate-pulse" />
                <div className="h-[500px] w-full bg-muted rounded animate-pulse" />
            </div>
        );
    }

    if (!project) return <div>Project not found</div>;

    return (
        <div className="space-y-6">
            {/* 1. Breadcrumb: <- {Team Name} > {Project Name} */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link href={`/teams/${teamId}/projects`} className="hover:text-foreground transition-colors flex items-center gap-1">
                    <ArrowLeft className="w-4 h-4" />
                    {teamName || 'Team'}
                </Link>
                <span className="opacity-30">/</span>
                <span className="font-medium text-foreground">{project.name}</span>
            </div>

            {/* 2. Project Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{project.name}</h1>
                    {project.description && (
                        <p className="text-muted-foreground mt-1">{project.description}</p>
                    )}
                </div>
                <div className="shrink-0">
                    <AiProjectSummary projectId={project.id} />
                </div>
            </div>

            {/* 3. Tabs (Project Modes) */}
            <Tabs defaultValue="kanban" className="space-y-6">
                <div className="border-b">
                    <TabsList className="bg-transparent h-auto p-0 w-full justify-start gap-8">
                        {['kanban', 'snippets', 'chat', 'decisions', 'progress', 'submission'].map((tab) => (
                            <TabsTrigger
                                key={tab}
                                value={tab}
                                className="rounded-none border-b-2 border-transparent px-1 py-3 text-sm font-medium text-muted-foreground hover:text-foreground data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:shadow-none transition-all"
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                <div className="min-h-[calc(100vh-300px)]">
                    <TabsContent value="kanban" className="mt-0 h-full">
                        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                            <KanbanBoard projectId={project.id} />
                        </motion.div>
                    </TabsContent>

                    <TabsContent value="snippets" className="mt-0">
                        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                            <SnippetList projectId={project.id} />
                        </motion.div>
                    </TabsContent>

                    <TabsContent value="chat" className="mt-0 h-[600px]">
                        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="h-full">
                            <ChatWindow teamId={teamId} projectId={project.id} />
                        </motion.div>
                    </TabsContent>

                    <TabsContent value="decisions" className="mt-0">
                        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                            <DecisionList projectId={project.id} role={(session?.user as any)?.role || 'VIEWER'} />
                        </motion.div>
                    </TabsContent>

                    <TabsContent value="progress" className="mt-0">
                        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                            <ProgressTab projectId={project.id} />
                        </motion.div>
                    </TabsContent>

                    <TabsContent value="submission" className="mt-0">
                        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                            <SubmissionTab projectId={project.id} role={(session?.user as any)?.role || 'VIEWER'} />
                        </motion.div>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
