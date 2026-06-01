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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Users } from 'lucide-react';
import { createTask, getTeamProjects, getProjectMembers } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { useUser } from "@/hooks/use-user";

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
    const { session } = useUser();
    const { toast } = useToast();
    const [internalOpen, setInternalOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [title, setTitle] = useState(defaultTitle);
    const [priority, setPriority] = useState('MEDIUM');
    const [selectedProjectId, setSelectedProjectId] = useState(projectId || '');
    const [projects, setProjects] = useState<{ id: string, name: string }[]>([]);
    
    // Assignees state
    const [members, setMembers] = useState<any[]>([]);
    const [assigneeIds, setAssigneeIds] = useState<string[]>([]);

    const isOpen = open !== undefined ? open : internalOpen;
    const setIsOpen = onOpenChange || setInternalOpen;

    const activeProjectId = projectId || selectedProjectId;

    useEffect(() => {
        if (isOpen && defaultTitle) setTitle(defaultTitle);
    }, [isOpen, defaultTitle]);

    useEffect(() => {
        if (isOpen && !projectId && teamId) {
            // Fetch projects if not provided
            getTeamProjects(teamId).then(setProjects).catch(console.error);
        }
    }, [isOpen, projectId, teamId]);

    // Fetch project members for assignment
    useEffect(() => {
        if (isOpen && activeProjectId) {
            getProjectMembers(activeProjectId)
                .then(setMembers)
                .catch(console.error);
        } else {
            setMembers([]);
            setAssigneeIds([]);
        }
    }, [isOpen, activeProjectId]);

    async function handleCreate() {
        if (!title) return;
        if (!activeProjectId) {
            toast({ title: "Please select a project", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            await createTask({
                title,
                projectId: activeProjectId,
                priority,
                assigneeIds,
            }, session?.user?.id || '');
            toast({ title: "Task created" });
            setIsOpen(false);
            setTitle('');
            setPriority('MEDIUM');
            setAssigneeIds([]);
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
                    
                    {/* Assignees (Multi-Select Popover) */}
                    <div className="grid gap-2">
                        <Label>Assign To</Label>
                        <div className="flex flex-wrap items-center gap-2">
                            <Popover>
                                <PopoverTrigger asChild disabled={!activeProjectId}>
                                    <Button variant="outline" size="sm" className="h-9 px-3 flex items-center gap-1.5 bg-transparent border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/50">
                                        <Users className="w-4 h-4" /> Choose Assignees
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-64 p-2" align="start">
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center pb-2 border-b">
                                            <span className="text-xs font-bold text-slate-500 uppercase">Select Assignees</span>
                                            <div className="flex gap-1.5">
                                                <Button size="sm" variant="ghost" className="text-[10px] h-6 px-1.5" onClick={() => setAssigneeIds(members.map(m => m.userId))}>All</Button>
                                                <Button size="sm" variant="ghost" className="text-[10px] h-6 px-1.5" onClick={() => setAssigneeIds([])}>Clear</Button>
                                            </div>
                                        </div>
                                        <div className="max-h-48 overflow-y-auto space-y-1 py-1">
                                            {members.map(m => {
                                                const isChecked = assigneeIds.includes(m.userId);
                                                return (
                                                    <div
                                                        key={m.userId}
                                                        className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50 dark:hover:bg-zinc-800/40 cursor-pointer"
                                                        onClick={() => {
                                                            if (isChecked) {
                                                                setAssigneeIds(assigneeIds.filter(id => id !== m.userId));
                                                            } else {
                                                                setAssigneeIds([...assigneeIds, m.userId]);
                                                            }
                                                        }}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            onChange={() => { }} // Handled by outer click
                                                            className="w-3.5 h-3.5 rounded border-zinc-300 dark:border-zinc-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                        />
                                                        <Avatar className="h-5.5 w-5.5">
                                                            <AvatarImage src={m.user.image || ''} />
                                                            <AvatarFallback className="text-[9px]">{m.user.name?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{m.user.name || m.user.email}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </PopoverContent>
                            </Popover>

                            {/* Selected Names / Avatars */}
                            <div className="flex -space-x-1.5 overflow-hidden py-1">
                                {assigneeIds.map(uid => {
                                    const m = members.find(mem => mem.userId === uid);
                                    if (!m) return null;
                                    return (
                                        <Avatar key={uid} className="inline-block h-7 w-7 rounded-full ring-2 ring-white dark:ring-zinc-900" title={m.user.name || m.user.email || 'User'}>
                                            <AvatarImage src={m.user.image || ''} />
                                            <AvatarFallback className="text-[10px] bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-bold">
                                                {m.user.name?.substring(0, 2).toUpperCase() || 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                    );
                                })}
                                {assigneeIds.length === 0 && (
                                    <span className="text-xs italic text-slate-400">Unassigned</span>
                                )}
                            </div>
                        </div>
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
                                <SelectItem value="URGENT">Urgent</SelectItem>
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
