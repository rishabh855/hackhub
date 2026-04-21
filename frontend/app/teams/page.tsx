'use client';

import { useEffect, useState, useCallback } from 'react';
import { useUser } from '@/hooks/use-user';
import { getUserTeams } from '@/lib/api';
import { CreateTeamDialog } from '@/components/teams/create-team-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, QrCode, Trash2 } from 'lucide-react';
import { deleteTeam } from '@/lib/api';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { JoinTeamDialog } from '@/components/projects/join-project-dialog';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface Team {
    id: string;
    name: string;
    members: any[];
}

export default function TeamsPage() {
    const { session, status } = useUser();
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTeams = useCallback(async () => {
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
    }, [session?.user?.id]);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchTeams();
        } else if (status === 'unauthenticated') {
            // Handle redirect if needed, or let middleware handle it
            setLoading(false);
        }
    }, [status, fetchTeams]);

    if (status === 'loading' || loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-8 w-32 bg-white/5" />
                    <Skeleton className="h-10 w-32 bg-white/5" />
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-32 w-full rounded-xl bg-white/5 border border-white/10" />
                    ))}
                </div>
            </div>
        );
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
    };

    return (
        <div className="space-y-8">
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex items-center justify-between"
            >
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-white">Your Teams</h1>
                    <p className="text-sm text-slate-400">Select a team workspace to view projects.</p>
                </div>
                <CreateTeamDialog onTeamCreated={fetchTeams} />
            </motion.div>

            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
                {teams.map((team) => (
                    <motion.div key={team.id} variants={itemVariants} whileHover={{ y: -5, transition: { duration: 0.2 } }}>
                        <Link href={`/teams/${team.id}/projects`} className="block h-full group">
                            <div className="h-full bg-white/5 backdrop-blur-md rounded-xl border border-white/10 group-hover:border-indigo-500/50 transition-all duration-300 p-6 flex flex-col shadow-lg group-hover:shadow-[0_0_20px_rgba(79,70,229,0.15)] relative overflow-hidden">
                                
                                {/* Ambient inner glow on hover */}
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-transparent to-purple-500/0 group-hover:from-indigo-500/10 group-hover:to-purple-500/10 transition-colors duration-500 pointer-events-none" />

                                <div className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
                                    <h3 className="text-xl font-semibold text-white group-hover:text-indigo-200 transition-colors">
                                        {team.name}
                                    </h3>
                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-300 group-hover:text-indigo-400 group-hover:bg-indigo-500/10 transition-colors">
                                        <Users className="h-4 w-4" />
                                    </div>
                                </div>
                                <div className="mt-auto pt-4 border-t border-white/5 relative z-10 flex items-center justify-between">
                                    <div className="text-sm text-slate-400 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500/80 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                                        {team.members?.length || 0} member{(team.members?.length || 0) !== 1 ? 's' : ''}
                                    </div>
                                    
                                    {session?.user?.id && team.members?.find((m: any) => m.userId === session.user.id && m.role === 'OWNER') && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 h-8 px-3 text-xs rounded-lg transition-colors"
                                            onClick={async (e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                if (confirm('Are you sure you want to delete this team? All projects and tasks will be lost.')) {
                                                    try {
                                                        // @ts-ignore
                                                        await deleteTeam(team.id, session.user.id);
                                                        fetchTeams();
                                                    } catch (err) {
                                                        console.error(err);
                                                    }
                                                }
                                            }}
                                        >
                                            <Trash2 className="w-3 h-3 mr-1" /> Delete
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                ))}

                {teams.length === 0 && (
                    <motion.div variants={itemVariants} className="col-span-full py-20 text-center rounded-2xl border-dashed border-2 border-white/10 bg-white/5 backdrop-blur-sm">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center text-slate-400">
                            <Users className="w-8 h-8 opacity-50" />
                        </div>
                        <h3 className="text-xl font-medium text-white mb-2">No active teams</h3>
                        <p className="text-slate-400 max-w-sm mx-auto mb-6">Create your first team workspace to start collaborating on projects.</p>
                        <CreateTeamDialog onTeamCreated={fetchTeams} />
                    </motion.div>
                )}
            </motion.div>

            <div className="fixed bottom-8 right-8 z-50">
                <JoinTeamDialog onJoinSuccess={fetchTeams}>
                    <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="rounded-full shadow-[0_0_25px_rgba(79,70,229,0.35)] bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white h-[60px] w-[60px] flex items-center justify-center transition-colors border-none"
                    >
                        <QrCode className="w-6 h-6" />
                    </motion.button>
                </JoinTeamDialog>
            </div>
        </div>
    );
}
