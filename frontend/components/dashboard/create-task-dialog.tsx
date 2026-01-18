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
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { createTask, getTeamProjects } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

interface Props {
    projectId?: string; // Optional if we want to select project
    teamId?: string;    // Required if projectId is missing
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    onTaskCreated?: () => void;
    defaultTitle?: string;
}

export function CreateTaskDialog({ projectId, teamId, trigger, open, onOpenChange, onTaskCreated, defaultTitle = '' }: Props) {
    const { toast } = useToast();
    const [internalOpen, setInternalOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [title, setTitle] = useState(defaultTitle);
    const [priority, setPriority] = useState('MEDIUM');
    const [selectedProjectId, setSelectedProjectId] = useState(projectId || '');
    const [projects, setProjects] = useState<{ id: string, name: string }[]>([]);

    const isOpen = open !== undefined ? open : internalOpen;
    const setIsOpen = onOpenChange || setInternalOpen;

    useEffect(() => {
        if (isOpen && defaultTitle) setTitle(defaultTitle);
    }, [isOpen, defaultTitle]);

    useEffect(() => {
        if (isOpen && !projectId && teamId) {
            // Fetch projects if not provided
            getTeamProjects(teamId).then(setProjects).catch(console.error);
        }
    }, [isOpen, projectId, teamId]);

    async function handleCreate() {
        if (!title) return;
        if (!selectedProjectId && !projectId) {
            toast({ title: "Please select a project", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            await createTask({
                title,
                projectId: projectId || selectedProjectId,
                priority,
            });
            toast({ title: "Task created" });
            setIsOpen(false);
            setTitle('');
            setPriority('MEDIUM');
            onTaskCreated?.();
        } catch (err) {
            console.error(err);
            toast({ title: "Failed to create task", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Task</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {/* Project Selection if needed */}
                    {!projectId && (
                        <div className="grid gap-2">
                            <Label>Project</Label>
                            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Project" />
                                </SelectTrigger>
                                <SelectContent>
                                    {projects.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="title">Task Title</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Design Homepage"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="priority">Priority</Label>
                        <Select value={priority} onValueChange={setPriority}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="LOW">Low</SelectItem>
                                <SelectItem value="MEDIUM">Medium</SelectItem>
                                <SelectItem value="HIGH">High</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={handleCreate} disabled={loading}>
                        {loading ? 'Creating...' : 'Create Task'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
