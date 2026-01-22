'use client';

import { useEffect, useState, use } from 'react';
import { useSession } from 'next-auth/react';
import { getTeamProjects, getUserTeams } from '@/lib/api';
import { CreateProjectDialog } from '@/components/projects/create-project-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Folder } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

interface Project {
    id: string;
    name: string;
    description?: string;
    updatedAt: string;
    createdAt: string;
}

export default function ProjectsPage({ params }: { params: Promise<{ teamId: string }> }) {
    const { teamId } = use(params);
    const { data: session, status } = useSession();

    const [projects, setProjects] = useState<Project[]>([]);
    const [teamName, setTeamName] = useState<string>('');
    const [loading, setLoading] = useState(true);

    const fetchProjects = async () => {
        try {
            const data = await getTeamProjects(teamId);
            setProjects(data);
        } catch (error) {
            console.error("Failed to fetch projects", error);
        }
    };

    const fetchTeamInfo = async () => {
        // @ts-ignore
        if (session?.user?.id) {
            try {
                // @ts-ignore
                const teams = await getUserTeams(session.user.id);
                // @ts-ignore
                const currentTeam = teams.find((t: { id: string; name: string }) => t.id === teamId);
                if (currentTeam) setTeamName(currentTeam.name);
            } catch (err) {
                console.error(err);
            }
        }
    }

    const loadAll = async () => {
        await Promise.all([fetchProjects(), fetchTeamInfo()]);
        setLoading(false);
    }

    useEffect(() => {
        if (status === 'authenticated') {
            loadAll();
        } else if (status === 'unauthenticated') {
            setLoading(false);
        }
    }, [session, status, teamId]);

    if (status === 'loading' || loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-6 w-48 bg-muted rounded"></div>
                <div className="flex justify-between">
                    <div className="h-10 w-32 bg-muted rounded"></div>
                    <div className="h-10 w-32 bg-muted rounded"></div>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-40 bg-muted rounded-xl"></div>)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link href="/teams" className="hover:text-foreground transition-colors flex items-center gap-1">
                    <ArrowLeft className="w-4 h-4" />
                    Teams
                </Link>
                <span className="opacity-30">/</span>
                <span className="font-medium text-foreground">{teamName || 'This Team'}</span>
            </div>

            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Projects</h1>
                <CreateProjectDialog teamId={teamId} onProjectCreated={fetchProjects} />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                    <Link key={project.id} href={`/teams/${teamId}/projects/${project.id}`}>
                        <Card className="hover:shadow-md transition-all hover:border-primary/50 cursor-pointer h-full group">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-lg font-semibold truncate pr-4 group-hover:text-primary transition-colors">
                                    {project.name}
                                </CardTitle>
                                <Folder className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                                    {project.description || 'No description provided.'}
                                </div>
                                <div className="text-xs text-muted-foreground/60 mt-4">
                                    Updated {project.updatedAt ? formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true }) : 'recently'}
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}

                {projects.length === 0 && (
                    <div className="col-span-full py-16 text-center rounded-xl border-dashed border-2 bg-muted/5">
                        <h3 className="text-lg font-medium text-foreground">No projects yet</h3>
                        <p className="text-muted-foreground mb-4">Launch your first project in this team.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
