'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createInvite } from '@/lib/invitations';
import { Copy, Check, Mail, Link as LinkIcon, Hash, Loader2, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import QRCode from 'react-qr-code';

interface Props {
    teamId: string;
    children: React.ReactNode;
}

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getUserTeams, removeTeamMember } from '@/lib/api';
import { useUser } from '@/hooks/use-user';

export function InviteMembersModal({ teamId, children }: Props) {
    const { session } = useUser();
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('members');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [generatedLink, setGeneratedLink] = useState('');
    const [generatedCode, setGeneratedCode] = useState('');
    const [copied, setCopied] = useState(false);
    const [members, setMembers] = useState<any[]>([]);

    useEffect(() => {
        if (open) {
            loadMembers();
        }
    }, [open]);

    // Auto-generate on tab switch
    useEffect(() => {
        if (open) {
            if (activeTab === 'link' && !generatedLink && !loading) {
                handleCreateLinkInvite();
            } else if (activeTab === 'code' && !generatedCode && !loading) {
                handleCreateCodeInvite();
            }
        }
    }, [activeTab, open]);

    const loadMembers = async () => {
        if (!session?.user) return;
        try {
            // @ts-ignore
            const teams = await getUserTeams(session.user.id);
            const team = teams.find((t: any) => t.id === teamId);
            if (team) {
                setMembers(team.members || []);
            }
        } catch (err) {
            console.error('Failed to load members', err);
        }
    };

    const handleRemoveMember = async (memberId: string) => {
        if (!confirm('Are you sure you want to remove this member?')) return;
        try {
            // @ts-ignore
            await removeTeamMember(teamId, memberId, session?.user?.id);
            toast.success('Member removed');
            loadMembers();
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    const handleCreateEmailInvite = async () => {
        if (!email) return;
        setLoading(true);
        try {
            const res = await createInvite({ teamId, type: 'EMAIL', email });
            const link = `${window.location.origin}/invite/accept?token=${res.token}`;
            setGeneratedLink(link);
            toast.success('Invitation created!');
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateLinkInvite = async () => {
        setLoading(true);
        try {
            const res = await createInvite({ teamId, type: 'LINK' });
            const link = `${window.location.origin}/invite/accept?token=${res.token}`;
            setGeneratedLink(link);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCodeInvite = async () => {
        setLoading(true);
        try {
            const res = await createInvite({ teamId, type: 'CODE' });
            setGeneratedCode(res.code);
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success('Copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Manage Team</DialogTitle>
                </DialogHeader>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="members"><Users className="w-4 h-4 mr-2" /> Members</TabsTrigger>
                        <TabsTrigger value="email"><Mail className="w-4 h-4 mr-2" /> Email</TabsTrigger>
                        <TabsTrigger value="link"><LinkIcon className="w-4 h-4 mr-2" /> Link</TabsTrigger>
                        <TabsTrigger value="code"><Hash className="w-4 h-4 mr-2" /> Code</TabsTrigger>
                    </TabsList>

                    <TabsContent value="members" className="space-y-4 pt-4">
                        <div className="space-y-4 max-h-[300px] overflow-y-auto">
                            {members.map((member) => (
                                <div key={member.id} className="flex items-center justify-between p-2 rounded-lg border">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={member.user?.image || ''} />
                                            <AvatarFallback>{member.user?.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-sm font-medium">{member.user?.username || member.user?.email}</p>
                                            <p className="text-xs text-muted-foreground capitalize">{member.role.toLowerCase()}</p>
                                        </div>
                                    </div>
                                    {member.role !== 'OWNER' && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            onClick={() => handleRemoveMember(member.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="email" className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>Email Address</Label>
                            <Input
                                placeholder="colleague@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <Button className="w-full" onClick={handleCreateEmailInvite} disabled={loading || !email}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Email Invite'}
                        </Button>
                    </TabsContent>

                    <TabsContent value="link" className="space-y-4 pt-4">
                        <p className="text-sm text-muted-foreground">
                            Generate a secure link that you can share with anyone.
                        </p>
                        {loading && !generatedLink ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : generatedLink ? (
                            <div className="space-y-4">
                                <div className="flex justify-center bg-white p-4 rounded-lg">
                                    <QRCode value={generatedLink} size={150} />
                                </div>
                                <div className="flex gap-2">
                                    <Input value={generatedLink} readOnly />
                                    <Button size="icon" variant="outline" onClick={() => copyToClipboard(generatedLink)}>
                                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    </Button>
                                </div>
                            </div>
                        ) : null}
                    </TabsContent>

                    <TabsContent value="code" className="space-y-4 pt-4">
                        <p className="text-sm text-muted-foreground">
                            Generate a Team Code for easy joining.
                        </p>
                        {loading && !generatedCode ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : generatedCode ? (
                            <div className="flex flex-col items-center justify-center p-6 border rounded-lg bg-muted/50 border-dashed">
                                <span className="text-3xl font-mono font-bold tracking-widest text-primary">
                                    {generatedCode}
                                </span>
                                <Button variant="ghost" size="sm" className="mt-4" onClick={() => copyToClipboard(generatedCode)}>
                                    {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                                    Copy Code
                                </Button>
                            </div>
                        ) : null}
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
