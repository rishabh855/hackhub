import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { updateTask, getProjectMembers } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useDebounce } from "@/hooks/use-debounce";
import { useSession } from "next-auth/react";

type Task = {
    id: string;
    title: string;
    description?: string | null;
    priority: string;
    status: string;
    dueDate?: string | null;
    labels?: string[];
    assigneeId?: string | null;
    isBlocked?: boolean;
    blockedReason?: string | null;
};

type ProjectMember = {
    userId: string;
    role: string;
    user: {
        id: string;
        name: string;
        email: string;
        image?: string;
    }
};

interface TaskDetailViewProps {
    task: Task;
    projectId: string;
    role: string;
    onUpdate: () => void;
}

export function TaskDetailView({ task, projectId, role, onUpdate }: TaskDetailViewProps) {
    const { data: session } = useSession();
    const { toast } = useToast();

    // Local state for inputs
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description || '');
    const [blockedReason, setBlockedReason] = useState(task.blockedReason || '');
    const [labels, setLabels] = useState(task.labels?.join(', ') || '');

    // Debounced values for auto-save
    const debouncedTitle = useDebounce(title, 1000);
    const debouncedDescription = useDebounce(description, 1000);
    const debouncedBlockedReason = useDebounce(blockedReason, 1000);
    const debouncedLabels = useDebounce(labels, 1000);

    // Immediate state
    const [priority, setPriority] = useState(task.priority);
    const [dueDate, setDueDate] = useState<Date | undefined>(task.dueDate ? new Date(task.dueDate) : undefined);
    const [assigneeId, setAssigneeId] = useState<string | undefined>(task.assigneeId || undefined);
    const [isBlocked, setIsBlocked] = useState(task.isBlocked || false);

    const [members, setMembers] = useState<ProjectMember[]>([]);
    const [loading, setLoading] = useState(false);
    const [firstLoad, setFirstLoad] = useState(true);

    const isViewer = role === 'VIEWER';

    // Fetch members
    useEffect(() => {
        getProjectMembers(projectId)
            .then(setMembers)
            .catch(console.error);
    }, [projectId]);

    // Sync state when task prop changes (mostly for initial load or external updates)
    useEffect(() => {
        setTitle(task.title);
        setDescription(task.description || '');
        setPriority(task.priority);
        setDueDate(task.dueDate ? new Date(task.dueDate) : undefined);
        setLabels(task.labels?.join(', ') || '');
        setAssigneeId(task.assigneeId || undefined);
        setIsBlocked(task.isBlocked || false);
        setBlockedReason(task.blockedReason || '');
    }, [task]);

    // Generic Update Function
    const updateField = useCallback(async (data: Partial<Task>) => {
        if (isViewer) return;
        try {
            // @ts-ignore
            await updateTask(task.id, data, session?.user?.id || '', projectId);
            onUpdate(); // Trigger parent refresh (optimistic mostly)
        } catch (error) {
            console.error("Failed to update task", error);
            toast({ title: "Error", description: "Failed to save changes.", variant: "destructive" });
        }
    }, [task.id, projectId, isViewer, onUpdate, toast, session]);

    // Auto-save Effects for Debounced Fields
    useEffect(() => {
        if (firstLoad) { setFirstLoad(false); return; }
        // We compare against the task prop values to prevent loop if parent update reflects back
        // But better to compare against the *last saved* value or just rely on react-query/state stability.
        // For now, fire if debounced value is different from task prop.
        if (debouncedTitle !== task.title) updateField({ title: debouncedTitle });
    }, [debouncedTitle]);

    useEffect(() => {
        if (firstLoad) return;
        if (debouncedDescription !== (task.description || '')) updateField({ description: debouncedDescription });
    }, [debouncedDescription]);

    useEffect(() => {
        if (firstLoad) return;
        if (debouncedBlockedReason !== (task.blockedReason || '')) updateField({ blockedReason: debouncedBlockedReason });
    }, [debouncedBlockedReason]);

    useEffect(() => {
        if (firstLoad) return;
        const processedLabels = debouncedLabels.split(',').map(l => l.trim()).filter(Boolean);
        const currentLabels = task.labels || [];
        // deep compare arrays
        if (JSON.stringify(processedLabels.sort()) !== JSON.stringify(currentLabels.sort())) {
            updateField({ labels: processedLabels });
        }
    }, [debouncedLabels]);

    // Immediate Handlers
    const handlePriorityChange = (val: string) => {
        setPriority(val);
        updateField({ priority: val });
    };

    const handleDueDateChange = (date: Date | undefined) => {
        setDueDate(date);
        updateField({ dueDate: date ? date.toISOString() : null });
    };

    const handleAssigneeChange = (val: string) => {
        setAssigneeId(val);
        updateField({ assigneeId: val === 'unassigned' ? null : val });
    };

    const handleBlockedChange = (val: boolean) => {
        setIsBlocked(val);
        updateField({ isBlocked: val });
    };

    return (
        <div className="space-y-6 py-4 pb-20">
            {/* Title */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Title</label>
                <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={isViewer}
                    className="text-lg font-semibold border-none shadow-none focus-visible:ring-0 px-0 h-auto"
                />
            </div>

            {/* Meta Grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                {/* Status */}
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</label>
                    <div className="flex items-center h-10">
                        <span className="px-2 py-1 rounded bg-secondary text-secondary-foreground text-sm font-medium">
                            {task.status.replace('_', ' ')}
                        </span>
                    </div>
                </div>

                {/* Priority */}
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Priority</label>
                    <Select value={priority} onValueChange={handlePriorityChange} disabled={isViewer}>
                        <SelectTrigger className="border-none shadow-none focus:ring-0 px-0 h-10 w-full justify-start">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="LOW">Low</SelectItem>
                            <SelectItem value="MEDIUM">Medium</SelectItem>
                            <SelectItem value="HIGH">High</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Assignee */}
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assignee</label>
                    <Select value={assigneeId || 'unassigned'} onValueChange={handleAssigneeChange} disabled={isViewer}>
                        <SelectTrigger className="border-none shadow-none focus:ring-0 px-0 h-10 w-full justify-start">
                            <SelectValue placeholder="Unassigned" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                            {members.map(m => (
                                <SelectItem key={m.userId} value={m.userId}>
                                    {m.user.name || m.user.email}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Due Date */}
                <div className="space-y-2 flex flex-col">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Due Date</label>
                    <Popover>
                        <PopoverTrigger asChild disabled={isViewer}>
                            <Button
                                variant={"ghost"}
                                className={cn(
                                    "w-full justify-start text-left font-normal px-0 hover:bg-transparent h-10",
                                    !dueDate && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={dueDate}
                                onSelect={handleDueDateChange}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            <hr className="border-border/50" />

            {/* Blocked Status */}
            <div className="space-y-4 rounded-lg border p-4 bg-muted/20">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", isBlocked ? "bg-red-500" : "bg-green-500")} />
                        Task Blocked
                    </label>
                    {/* Toggle Switch Custom */}
                    <div
                        className={cn(
                            "w-10 h-6 rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out relative",
                            isBlocked ? "bg-red-500" : "bg-gray-200 dark:bg-gray-700"
                        )}
                        onClick={() => !isViewer && handleBlockedChange(!isBlocked)}
                    >
                        <div className={cn(
                            "w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 absolute top-1",
                            isBlocked ? "left-5" : "left-1"
                        )} />
                    </div>
                </div>

                {isBlocked && (
                    <Textarea
                        placeholder="Reason for blocking..."
                        value={blockedReason}
                        onChange={(e) => setBlockedReason(e.target.value)}
                        className="resize-none bg-background"
                        disabled={isViewer}
                    />
                )}
            </div>

            {/* Description */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</label>
                <Textarea
                    className="min-h-[200px] font-sans resize-y"
                    placeholder="Add more details... (Markdown supported mainly)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isViewer}
                />
            </div>

            {/* Labels */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Labels</label>
                <Input
                    placeholder="frontend, bug, v1"
                    value={labels}
                    onChange={(e) => setLabels(e.target.value)}
                    disabled={isViewer}
                />
            </div>

            <div className="text-xs text-muted-foreground text-right">
                All changes saved automatically
            </div>
        </div>
    );
}
