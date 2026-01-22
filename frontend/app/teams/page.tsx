'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getUserTeams } from '@/lib/api';
import { CreateTeamDialog } from '@/components/teams/create-team-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

interface Team {
    id: string;
    name: string;
    members: any[];
}

export default function TeamsPage() {
    const { data: session, status } = useSession();
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTeams = async () => {
        // @ts-ignore
        if (session?.user?.id) {
            try {
                // @ts-ignore
                const data = await getUserTeams(session.user.id);
                setTeams(data);
            } catch (error) {
                console.error("Failed to fetch teams", error);
            } finally {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        if (status === 'authenticated') {
            fetchTeams();
        } else if (status === 'unauthenticated') {
            // Handle redirect if needed, or let middleware handle it
            setLoading(false);
        }
    }, [session, status]);

    if (status === 'loading' || loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-32 w-full rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Your Teams</h1>
                <CreateTeamDialog onTeamCreated={fetchTeams} />
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {teams.map((team) => (
                    <Link key={team.id} href={`/teams/${team.id}/projects`}>
                        <Card className="hover:shadow-md transition-all hover:border-primary/50 cursor-pointer h-full">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-lg font-semibold">
                                    {team.name}
                                </CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm text-muted-foreground">
                                    {team.members?.length || 0} member{(team.members?.length || 0) !== 1 ? 's' : ''}
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}

                {teams.length === 0 && (
                    <div className="col-span-full py-16 text-center rounded-xl border-dashed border-2 bg-muted/5">
                        <h3 className="text-lg font-medium text-foreground">No teams yet</h3>
                        <p className="text-muted-foreground mb-4">Create your first team to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
