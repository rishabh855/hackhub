import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, MoreVertical, Trash2 } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getProjectMembers, inviteProjectMember, updateMemberRole, removeMember } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { useSession } from 'next-auth/react';

interface Member {
    userId: string;
    projectId: string;
    role: string;
    user: {
        id: string;
        name: string | null;
        email: string | null;
        image: string | null;
    };
}

interface Props {
    projectId: string;
}

export function TeamMembersDialog({ projectId }: Props) {
    const { data: session } = useSession();
    const { toast } = useToast();
    const [members, setMembers] = useState<Member[]>([]);
    const [open, setOpen] = useState(false);

    // Invite State
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('VIEWER');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            loadMembers();
        }
    }, [open]);

    async function loadMembers() {
        try {
            const data = await getProjectMembers(projectId);
            setMembers(data);
        } catch (err) {
            console.error(err);
        }
    }

    async function handleInvite() {
        if (!inviteEmail) return;
        setLoading(true);
        try {
            await inviteProjectMember(projectId, inviteEmail, inviteRole);
            setInviteEmail('');
            loadMembers();
            toast({ title: 'Member invited' });
        } catch (err) {
            toast({ title: 'Failed to invite', description: 'User may not exist or is already a member', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }

    async function handleUpdateRole(userId: string, newRole: string) {
        try {
            await updateMemberRole(projectId, userId, newRole);
            loadMembers();
            toast({ title: 'Role updated' });
        } catch (err) {
            toast({ title: 'Failed to update role', variant: 'destructive' });
        }
    }

    async function handleRemove(userId: string) {
        try {
            await removeMember(projectId, userId);
            loadMembers();
            toast({ title: 'Member removed' });
        } catch (err) {
            toast({ title: 'Failed to remove member', variant: 'destructive' });
        }
    }

    // Basic permission check: only OWNER can invite/manage (mock)
    // In real app, check current user's role from list
    const currentUserMembership = members.find(m => m.userId === (session?.user as any)?.id);
    const isOwner = currentUserMembership?.role === 'OWNER';

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Users className="w-4 h-4 mr-2" />
                    Members
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Team Members</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Invite Form */}
                    {isOwner && (
                        <div className="flex gap-2 items-end">
                            <div className="grid gap-1 flex-1">
                                <label className="text-sm font-medium">Invite by Email</label>
                                <Input
                                    placeholder="user@example.com"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                />
                            </div>
                            <Select value={inviteRole} onValueChange={setInviteRole}>
                                <SelectTrigger className="w-[110px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="VIEWER">Viewer</SelectItem>
                                    <SelectItem value="EDITOR">Editor</SelectItem>
                                    <SelectItem value="OWNER">Owner</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button onClick={handleInvite} disabled={loading}>Invite</Button>
                        </div>
                    )}

                    {/* Member List */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-medium text-muted-foreground">Current Members</h4>
                        {members.map((member) => (
                            <div key={member.userId} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={member.user.image || ''} />
                                        <AvatarFallback>{member.user.name?.[0] || 'U'}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-medium leading-none">{member.user.name}</p>
                                        <p className="text-xs text-muted-foreground">{member.user.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono bg-secondary px-2 py-1 rounded">
                                        {member.role}
                                    </span>
                                    {isOwner && member.userId !== (session?.user as any)?.id && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleUpdateRole(member.userId, 'VIEWER')}>
                                                    Set as Viewer
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleUpdateRole(member.userId, 'EDITOR')}>
                                                    Set as Editor
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleUpdateRole(member.userId, 'OWNER')}>
                                                    Set as Owner
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-red-600" onClick={() => handleRemove(member.userId)}>
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Remove
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
