'use client';

import { useEffect, useState, use, useCallback } from 'react';
import { useUser } from '@/hooks/use-user';
import { getTeamProjects, getUserTeams } from '@/lib/api';
import { CreateProjectDialog } from '@/components/projects/create-project-dialog';
import { InviteMembersModal } from '@/components/projects/invite-members-modal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Folder, Plus } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

interface Project {
    id: string;
    name: string;
    description?: string;
    updatedAt: string;
    createdAt: string;
    members: {
        user: {
            name: string;
            email: string;
        }
    }[];
}

export default function ProjectsPage({ params }: { params: Promise<{ teamId: string }> }) {
    const { teamId } = use(params);
    const { session, status } = useUser();

    const [projects, setProjects] = useState<Project[]>([]);
    const [teamName, setTeamName] = useState<string>('');
    const [isTeamOwner, setIsTeamOwner] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchProjects = useCallback(async () => {
        try {
            const data = await getTeamProjects(teamId);
            setProjects(data);
        } catch (error) {
            console.error("Failed to fetch projects", error);
        }
    }, [teamId]);

    const fetchTeamInfo = useCallback(async () => {
        // @ts-ignore
        if (session?.user?.id) {
            try {
                // @ts-ignore
                const teams = await getUserTeams(session.user.id);
                // @ts-ignore
                const currentTeam = teams.find((t: any) => t.id === teamId);
                if (currentTeam) {
                    setTeamName(currentTeam.name);
                    // Check ownership
                    // @ts-ignore
                    const member = currentTeam.members.find((m: any) => m.userId === session.user.id);
                    if (member && member.role === 'OWNER') {
                        setIsTeamOwner(true);
                    }
                }
            } catch (err) {
                console.error(err);
            }
        }
    }, [session?.user?.id, teamId]);

    const loadAll = useCallback(async () => {
        await Promise.all([fetchProjects(), fetchTeamInfo()]);
        setLoading(false);
    }, [fetchProjects, fetchTeamInfo]);

    useEffect(() => {
        if (status === 'authenticated') {
            loadAll();
        } else if (status === 'unauthenticated') {
            setLoading(false);
        }
    }, [status, loadAll]);

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
                <div className="flex items-center gap-2">
                    {isTeamOwner && (
                        <InviteMembersModal teamId={teamId}>
                            <Button variant="outline">
                                <Plus className="w-4 h-4 mr-2" /> Invite Members
                            </Button>
                        </InviteMembersModal>
                    )}
                    <CreateProjectDialog teamId={teamId} onProjectCreated={fetchProjects} />
                </div>
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
                                <div className="flex items-center justify-between mt-4">
                                    <div className="text-xs text-muted-foreground/60">
                                        Updated {project.updatedAt ? formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true }) : 'recently'}
                                    </div>
                                    <div className="text-xs text-muted-foreground font-medium">
                                        Created by {(() => {
                                            const user = project.members?.[0]?.user;
                                            if (!user) return 'Unknown';
                                            const displayName = user.name || user.email.split('@')[0];
                                            return displayName.split(' ')[0]; // First name
                                        })()}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}

                {projects.length === 0 && (
                    <div className="col-span-full py-16 text-center rounded-xl border-dashed border-2 bg-muted/5">
                        <h3 className="text-lg font-medium text-foreground">No projects yet</h3>
                        <p className="text-muted-foreground mb-4">Create your first project to get started.</p>
                    </div>
                )}
            </div>


        </div>
    );
}
