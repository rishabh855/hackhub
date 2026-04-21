'use client';

import { useEffect, useState, use, useCallback } from 'react';
import { useUser } from '@/hooks/use-user';
import { getTeamProjects, getUserTeams } from '@/lib/api';
import { CreateProjectDialog } from '@/components/projects/create-project-dialog';
import { InviteMembersModal } from '@/components/projects/invite-members-modal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Folder, Plus, Trash2 } from 'lucide-react';
import { deleteProject } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';

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
            <div className="space-y-6">
                <div className="h-6 w-48 bg-white/5 rounded"></div>
                <div className="flex justify-between">
                    <div className="h-10 w-32 bg-white/5 rounded"></div>
                    <div className="h-10 w-32 bg-white/5 rounded"></div>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-40 bg-white/5 border border-white/10 rounded-xl"></div>)}
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
        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
    };

    return (
        <div className="space-y-8">
            {/* Breadcrumb */}
            <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 text-sm text-slate-400"
            >
                <Link href="/teams" className="hover:text-white transition-colors flex items-center gap-1">
                    <ArrowLeft className="w-4 h-4" />
                    Teams
                </Link>
                <span className="opacity-30">/</span>
                <span className="font-medium text-white">{teamName || 'This Team'}</span>
            </motion.div>

            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="flex items-center justify-between"
            >
                <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">Projects</h1>
                <div className="flex items-center gap-2">
                    {isTeamOwner && (
                        <>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={async () => {
                                    if (confirm('Are you sure you want to delete this team? All projects and data will be permanently lost.')) {
                                        try {
                                            // @ts-ignore
                                            await deleteTeam(teamId, session.user.id);
                                            window.location.href = '/teams';
                                        } catch (err) {
                                            console.error(err);
                                        }
                                    }
                                }}
                            >
                                <Trash2 className="w-4 h-4 mr-2" /> Delete Team
                            </Button>
                            <InviteMembersModal teamId={teamId}>
                                <Button variant="outline">
                                    <Plus className="w-4 h-4 mr-2" /> Invite Members
                                </Button>
                            </InviteMembersModal>
                        </>
                    )}
                    <CreateProjectDialog teamId={teamId} onProjectCreated={fetchProjects} />
                </div>
            </motion.div>

            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
                {projects.map((project) => (
                    <motion.div key={project.id} variants={itemVariants} whileHover={{ y: -5, transition: { duration: 0.2 } }}>
                        <Link href={`/teams/${teamId}/projects/${project.id}`} className="block h-full group">
                            <div className="h-full bg-white/5 backdrop-blur-md rounded-xl border border-white/10 group-hover:border-indigo-500/50 transition-all duration-300 p-6 flex flex-col shadow-lg group-hover:shadow-[0_0_20px_rgba(79,70,229,0.15)] relative overflow-hidden">
                                
                                {/* Ambient inner glow on hover */}
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-transparent to-purple-500/0 group-hover:from-indigo-500/5 group-hover:to-purple-500/5 transition-colors duration-500 pointer-events-none" />

                                <div className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
                                    <h3 className="text-xl font-semibold text-white group-hover:text-indigo-200 transition-colors truncate pr-4">
                                        {project.name}
                                    </h3>
                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-300 group-hover:text-indigo-400 group-hover:bg-indigo-500/10 transition-colors flex-shrink-0">
                                        <Folder className="h-4 w-4" />
                                    </div>
                                </div>
                                
                                <div className="text-sm text-slate-400 line-clamp-2 min-h-[2.5rem] relative z-10">
                                    {project.description || 'No description provided.'}
                                </div>
                                <div className="flex items-center justify-between mt-auto pt-4 relative z-10">
                                    <div className="text-xs text-slate-500">
                                        Updated {project.updatedAt ? formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true }) : 'recently'}
                                    </div>
                                    <div className="text-xs text-slate-400 font-medium bg-white/5 px-2 py-1 rounded-md">
                                        {(() => {
                                            const user = project.members?.[0]?.user;
                                            if (!user) return 'Unknown';
                                            const displayName = user.name || user.email.split('@')[0];
                                            return displayName.split(' ')[0]; // First name
                                        })()}
                                    </div>
                                </div>
                                {isTeamOwner && (
                                    <div className="mt-4 flex justify-end border-t border-white/5 pt-3 relative z-10">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 h-7 px-2 text-xs rounded-lg transition-colors"
                                            onClick={async (e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                if (confirm('Are you sure you want to delete this project?')) {
                                                    try {
                                                        // @ts-ignore
                                                        await deleteProject(project.id, session.user.id);
                                                        fetchProjects();
                                                    } catch (err) {
                                                        console.error(err);
                                                    }
                                                }
                                            }}
                                        >
                                            <Trash2 className="w-3 h-3 mr-1" /> Delete
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </Link>
                    </motion.div>
                ))}

                {projects.length === 0 && (
                    <motion.div variants={itemVariants} className="col-span-full py-16 text-center rounded-2xl border-dashed border-2 border-white/10 bg-white/5 backdrop-blur-sm">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center text-slate-400">
                            <Folder className="w-8 h-8 opacity-50" />
                        </div>
                        <h3 className="text-lg font-medium text-white mb-2">No projects yet</h3>
                        <p className="text-slate-400 mb-6">Create your first project to get started.</p>
                        <CreateProjectDialog teamId={teamId} onProjectCreated={fetchProjects} />
                    </motion.div>
                )}
            </motion.div>


        </div>
    );
}
