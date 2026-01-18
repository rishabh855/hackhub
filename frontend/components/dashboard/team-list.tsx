'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createTeam, getUserTeams, inviteMember } from '@/lib/api';
import { ProjectList } from './project-list';
import { ArrowLeft, UserPlus, Plus, Users } from 'lucide-react';

interface Team {
    id: string;
    name: string;
    members: any[];
}

export function TeamList() {
    const { data: session } = useSession();
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [newTeamName, setNewTeamName] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Invite Logic State
    const [inviteEmail, setInviteEmail] = useState('');
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        if (session?.user?.id) {
            // @ts-ignore
            loadTeams(session.user.id);
        }
    }, [session]);

    if (!isMounted) return null; // Prevent hydration mismatch

    async function loadTeams(userId: string) {
        try {
            const data = await getUserTeams(userId);
            setTeams(data);
        } catch (err) {
            console.error(err);
        }
    }

    async function handleCreateTeam() {
        // @ts-ignore
        if (!newTeamName || !session?.user?.id) return;
        setLoading(true);
        try {
            // @ts-ignore
            await createTeam(session.user.id, newTeamName);
            setIsOpen(false);
            setNewTeamName('');
            // @ts-ignore
            loadTeams(session.user.id);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleInviteMember() {
        if (!inviteEmail || !selectedTeam) return;
        setLoading(true);
        try {
            await inviteMember(selectedTeam.id, inviteEmail);
            setIsInviteOpen(false);
            setInviteEmail('');
            alert('Member invited successfully!');
            // Refresh teams to update member count if needed, though member list isn't detailed in main view
            // @ts-ignore
            loadTeams(session.user.id);
        } catch (err: any) {
            console.error(err);
            alert(err.message);
        } finally {
            setLoading(false);
        }
    }

    if (selectedTeam) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Button variant="ghost" onClick={() => setSelectedTeam(null)}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Teams
                        </Button>
                        <h2 className="text-2xl font-bold tracking-tight">{selectedTeam.name}</h2>
                    </div>
                    <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <UserPlus className="w-4 h-4 mr-2" />
                                Invite Member
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Invite Member</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        placeholder="colleague@example.com"
                                    />
                                </div>
                                <Button onClick={handleInviteMember} disabled={loading}>
                                    {loading ? 'Inviting...' : 'Invite'}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
                <div className="border-t pt-6">
                    <ProjectList teamId={selectedTeam.id} />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold tracking-tight">Your Teams</h2>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Team
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create a new team</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Team Name</Label>
                                <Input
                                    id="name"
                                    value={newTeamName}
                                    onChange={(e) => setNewTeamName(e.target.value)}
                                    placeholder="e.g. Alpha Squad"
                                />
                            </div>
                            <Button onClick={handleCreateTeam} disabled={loading}>
                                {loading ? 'Creating...' : 'Create Team'}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {teams.map((team) => (
                    <div
                        key={team.id}
                        className="p-6 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setSelectedTeam(team)}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold">{team.name}</h3>
                            <Users className="w-4 h-4 text-gray-500" />
                        </div>
                        <p className="text-sm text-gray-500">
                            {team.members.length} member{team.members.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                ))}
                {teams.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 rounded-lg border-dashed border-2">
                        No teams yet. Create one to get started!
                    </div>
                )}
            </div>
        </div>
    );
}
