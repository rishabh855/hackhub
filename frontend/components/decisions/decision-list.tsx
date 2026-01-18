import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, ChevronDown, ChevronUp, Lock } from 'lucide-react';
import { createDecision, getProjectDecisionsWithUser, addDecisionNote, getProjectMembership } from '@/lib/api';
import { format } from 'date-fns';
// ... (imports)

interface Props {
    projectId: string;
    role?: string; // Optional
}

export function DecisionList({ projectId, role: initialRole }: Props) {
    const { data: session } = useSession();
    const [decisions, setDecisions] = useState<Decision[]>([]);
    const [loading, setLoading] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Role State
    const [role, setRole] = useState(initialRole || 'VIEWER');

    // Create Form
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');

    // Expand State
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [noteContent, setNoteContent] = useState('');

    const isViewer = role === 'VIEWER';

    useEffect(() => {
        if (session?.user && projectId) {
            // @ts-ignore
            getProjectMembership(projectId, session.user.id).then(m => {
                if (m) setRole(m.role);
            });
        }
    }, [session, projectId]);

    useEffect(() => {
        loadDecisions();
    }, [projectId]);

    async function loadDecisions() {
        if (!session?.user) return;
        try {
            const data = await getProjectDecisionsWithUser(projectId, (session.user as any).id);
            setDecisions(data);
        } catch (error) {
            console.error(error);
        }
    }

    async function handleCreate() {
        if (!newTitle.trim() || !newContent.trim() || isViewer) return;
        setLoading(true);
        try {
            await createDecision(projectId, { title: newTitle, content: newContent }, (session?.user as any).id);
            setNewTitle('');
            setNewContent('');
            setIsCreateOpen(false);
            loadDecisions();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    async function handleAddNote(decisionId: string) {
        if (!noteContent.trim() || isViewer) return;
        try {
            await addDecisionNote(decisionId, noteContent, (session?.user as any).id, projectId);
            setNoteContent('');
            loadDecisions(); // Refresh to show new note
        } catch (error) {
            console.error(error);
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-medium">Project Decisions</h3>
                    <p className="text-sm text-muted-foreground">Permanent record of key decisions.</p>
                </div>
                {!isViewer && (
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button><Plus className="w-4 h-4 mr-2" /> Log Decision</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Log a New Decision</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Title</label>
                                    <Input
                                        placeholder="e.g. Use Next.js for frontend"
                                        value={newTitle}
                                        onChange={e => setNewTitle(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Content</label>
                                    <Textarea
                                        placeholder="Describe the decision and context..."
                                        value={newContent}
                                        onChange={e => setNewContent(e.target.value)}
                                    />
                                </div>
                                <Button onClick={handleCreate} disabled={loading} className="w-full">
                                    {loading ? 'Saving...' : 'Log Decision'}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <div className="grid gap-4">
                {decisions.length === 0 && (
                    <div className="text-center py-10 text-muted-foreground border border-dashed rounded-lg">
                        No decisions recorded yet.
                    </div>
                )}
                {decisions.map(decision => (
                    <Card key={decision.id} className="overflow-hidden">
                        <CardHeader className="bg-muted/30 pb-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-base">{decision.title}</CardTitle>
                                    <CardDescription className="flex items-center gap-2 mt-1">
                                        <span>Decided by {decision.user.name}</span>
                                        <span>•</span>
                                        <span>{format(new Date(decision.createdAt), 'PPP')}</span>
                                    </CardDescription>
                                </div>
                                <div className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded uppercase dark:bg-green-900 dark:text-green-100 flex items-center gap-1">
                                    <Lock className="w-3 h-3" />
                                    {decision.status}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            <div className="text-sm whitespace-pre-wrap">{decision.content}</div>

                            {/* Expandable Notes */}
                            {decision.notes.length > 0 && (
                                <div className="mt-4 pt-4 border-t space-y-3 pl-4 border-l-2 bg-muted/10 p-2 rounded-r">
                                    <h5 className="text-xs font-semibold uppercase text-muted-foreground">Notes & Updates</h5>
                                    {decision.notes.map(note => (
                                        <div key={note.id} className="text-sm">
                                            <span className="font-semibold text-xs text-muted-foreground mr-2">
                                                {note.user.name} ({format(new Date(note.createdAt), 'MMM d')}):
                                            </span>
                                            {note.content}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="bg-muted/10 p-2 px-4 flex justify-end">
                            {expandedId === decision.id ? (
                                <div className="w-full space-y-2">
                                    {!isViewer && (
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Add a note/update..."
                                                value={noteContent}
                                                onChange={e => setNoteContent(e.target.value)}
                                                className="h-8 text-sm"
                                            />
                                            <Button size="sm" onClick={() => handleAddNote(decision.id)}>Add</Button>
                                        </div>
                                    )}
                                    <Button variant="ghost" size="sm" className="w-full text-xs h-6" onClick={() => setExpandedId(null)}>
                                        <ChevronUp className="w-3 h-3 mr-1" /> Close
                                    </Button>
                                </div>
                            ) : (
                                <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => setExpandedId(decision.id)}>
                                    {decision.notes.length > 0 ? 'Add Note' : 'Add Note'} <ChevronDown className="w-3 h-3 ml-1" />
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
