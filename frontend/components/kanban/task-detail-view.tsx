import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Check, X, Users, MessageSquare, Clock, ArrowRight, CornerDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { updateTask, getProjectMembers, submitTaskReview, approveTask, rejectTask, getTaskActivities } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { useDebounce } from "@/hooks/use-debounce";
import { useUser } from "@/hooks/use-user";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type User = {
    id: string;
    name: string;
    email?: string;
    image?: string;
};

type TaskAssignee = {
    userId: string;
    user: User;
};

type Task = {
    id: string;
    title: string;
    description?: string | null;
    priority: string;
    status: string;
    dueDate?: string | null;
    labels?: string[];
    assigneeId?: string | null;
    assignees?: TaskAssignee[];
    isBlocked?: boolean;
    blockedReason?: string | null;
};

type ProjectMember = {
    userId: string;
    role: string;
    user: User;
};

interface TaskDetailViewProps {
    task: Task;
    projectId: string;
    role: string;
    onUpdate: () => void;
}

export function TaskDetailView({ task, projectId, role, onUpdate }: TaskDetailViewProps) {
    const { session } = useUser();
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
    const [assigneeIds, setAssigneeIds] = useState<string[]>(task.assignees?.map(a => a.userId) || []);
    const [isBlocked, setIsBlocked] = useState(task.isBlocked || false);

    const [members, setMembers] = useState<ProjectMember[]>([]);
    const [activities, setActivities] = useState<any[]>([]);
    const [firstLoad, setFirstLoad] = useState(true);

    const [rejectReason, setRejectReason] = useState('');
    const [showRejectInput, setShowRejectInput] = useState(false);

    const isViewer = role === 'VIEWER';
    const isMember = role === 'MEMBER';
    const canApprove = role === 'OWNER' || role === 'LEADER';

    // Fetch members
    useEffect(() => {
        getProjectMembers(projectId)
            .then(setMembers)
            .catch(console.error);
    }, [projectId]);

    // Fetch activities
    const fetchActivities = useCallback(async () => {
        try {
            const data = await getTaskActivities(task.id, projectId);
            setActivities(data);
        } catch (error) {
            console.error("Failed to fetch activities", error);
        }
    }, [task.id, projectId]);

    useEffect(() => {
        fetchActivities();
    }, [task.id, fetchActivities]);

    // Sync state when task prop changes
    useEffect(() => {
        setTitle(task.title);
        setDescription(task.description || '');
        setPriority(task.priority);
        setDueDate(task.dueDate ? new Date(task.dueDate) : undefined);
        setLabels(task.labels?.join(', ') || '');
        setAssigneeIds(task.assignees?.map(a => a.userId) || []);
        setIsBlocked(task.isBlocked || false);
        setBlockedReason(task.blockedReason || '');
        setShowRejectInput(false);
        setRejectReason('');
    }, [task]);

    // Generic Update Function
    const updateField = useCallback(async (data: Partial<Task> & { assigneeIds?: string[] }) => {
        if (isViewer) return;
        try {
            // @ts-ignore
            await updateTask(task.id, data, session?.user?.id || '', projectId);
            onUpdate(); // Trigger parent refresh
            fetchActivities(); // Refresh timeline
        } catch (error) {
            console.error("Failed to update task", error);
            toast({ title: "Error", description: "Failed to save changes.", variant: "destructive" });
        }
    }, [task.id, projectId, isViewer, onUpdate, fetchActivities, toast, session]);

    // Auto-save Effects for Debounced Fields
    useEffect(() => {
        if (firstLoad) { setFirstLoad(false); return; }
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

    const toggleAssignee = (memberUserId: string) => {
        if (isViewer) return;
        let newIds = [...assigneeIds];
        if (newIds.includes(memberUserId)) {
            newIds = newIds.filter(id => id !== memberUserId);
        } else {
            newIds.push(memberUserId);
        }
        setAssigneeIds(newIds);
        updateField({ assigneeIds: newIds });
    };

    const assignAllMembers = () => {
        if (isViewer) return;
        const allIds = members.map(m => m.userId);
        setAssigneeIds(allIds);
        updateField({ assigneeIds: allIds });
    };

    const clearAllAssignees = () => {
        if (isViewer) return;
        setAssigneeIds([]);
        updateField({ assigneeIds: [] });
    };

    const handleBlockedChange = (val: boolean) => {
        setIsBlocked(val);
        updateField({ isBlocked: val });
    };

    // Review Workflows
    const handleSubmitReview = async () => {
        try {
            await submitTaskReview(task.id, projectId, session?.user?.id || '');
            toast({ title: "Submitted", description: "Task status changed to REVIEW." });
            onUpdate();
            fetchActivities();
        } catch (err) {
            toast({ title: "Error", description: "Failed to submit for review.", variant: "destructive" });
        }
    };

    const handleApprove = async () => {
        try {
            await approveTask(task.id, projectId, session?.user?.id || '');
            toast({ title: "Approved", description: "Task approved and marked as DONE." });
            onUpdate();
            fetchActivities();
        } catch (err) {
            toast({ title: "Error", description: "Failed to approve task.", variant: "destructive" });
        }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            toast({ title: "Required", description: "Please enter a reason for rejection.", variant: "destructive" });
            return;
        }
        try {
            await rejectTask(task.id, projectId, session?.user?.id || '', rejectReason);
            toast({ title: "Rejected", description: "Task rejected. Sent back to In Progress." });
            setRejectReason('');
            setShowRejectInput(false);
            onUpdate();
            fetchActivities();
        } catch (err) {
            toast({ title: "Error", description: "Failed to reject task.", variant: "destructive" });
        }
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
                    className="text-lg font-semibold border-none shadow-none focus-visible:ring-0 px-0 h-auto bg-transparent"
                />
            </div>

            {/* Review Workflow Panel */}
            <div className="rounded-xl border border-indigo-100 dark:border-indigo-950 bg-indigo-50/30 dark:bg-indigo-950/10 p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Workflow Approval Pipeline
                </h4>

                <div className="flex flex-wrap gap-2 items-center">
                    {task.status === 'IN_PROGRESS' && (
                        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm" onClick={handleSubmitReview}>
                            Submit for Review
                        </Button>
                    )}

                    {task.status === 'REVIEW' && (
                        <>
                            {canApprove ? (
                                <div className="flex flex-col gap-2 w-full">
                                    <div className="flex gap-2">
                                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1" onClick={handleApprove}>
                                            <Check className="w-4 h-4" /> Approve Task
                                        </Button>
                                        <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20 shadow-sm flex items-center gap-1" onClick={() => setShowRejectInput(!showRejectInput)}>
                                            <X className="w-4 h-4" /> Reject Task
                                        </Button>
                                    </div>

                                    {showRejectInput && (
                                        <div className="mt-2 space-y-2 border-t pt-2 border-slate-100 dark:border-zinc-800">
                                            <Input
                                                placeholder="Enter rejection reason..."
                                                value={rejectReason}
                                                onChange={(e) => setRejectReason(e.target.value)}
                                                className="h-8 text-xs"
                                            />
                                            <div className="flex gap-1 justify-end">
                                                <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setShowRejectInput(false)}>Cancel</Button>
                                                <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white text-xs h-7" onClick={handleReject}>Submit Rejection</Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <span className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-2 py-1.5 rounded-md border border-amber-100 dark:border-amber-950/50 font-medium">
                                    Pending review by Owner or Leader.
                                </span>
                            )}
                        </>
                    )}

                    {task.status === 'DONE' && (
                        <span className="text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1.5 rounded-md border border-emerald-100 dark:border-emerald-950/50 font-semibold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Approved & Completed
                        </span>
                    )}

                    {task.status === 'TODO' && (
                        <span className="text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-zinc-800 px-2 py-1.5 rounded-md border border-slate-200 dark:border-zinc-700 font-medium">
                            Status: TODO. Move to In Progress to start working.
                        </span>
                    )}
                </div>
            </div>

            {/* Meta Grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                {/* Status */}
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</label>
                    <div className="flex items-center h-10">
                        <span className="px-2 py-1 rounded bg-secondary text-secondary-foreground text-sm font-medium border border-border/40">
                            {task.status.replace('_', ' ')}
                        </span>
                    </div>
                </div>

                {/* Priority */}
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Priority</label>
                    <Select value={priority} onValueChange={handlePriorityChange} disabled={isViewer}>
                        <SelectTrigger className="border-none shadow-none focus:ring-0 px-0 h-10 w-full justify-start bg-transparent">
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

                {/* Assignees (Multi-Select Popover) */}
                <div className="space-y-2 col-span-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Assignees</label>
                    <div className="flex flex-wrap items-center gap-3">
                        <Popover>
                            <PopoverTrigger asChild disabled={isViewer}>
                                <Button variant="outline" size="sm" className="h-9 px-3 flex items-center gap-1.5 bg-transparent border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/50">
                                    <Users className="w-4 h-4" /> Manage Assignees
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-2" align="start">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center pb-2 border-b">
                                        <span className="text-xs font-bold text-slate-500 uppercase">Select Assignees</span>
                                        <div className="flex gap-1.5">
                                            <Button size="sm" variant="ghost" className="text-[10px] h-6 px-1.5" onClick={assignAllMembers}>All</Button>
                                            <Button size="sm" variant="ghost" className="text-[10px] h-6 px-1.5" onClick={clearAllAssignees}>Clear</Button>
                                        </div>
                                    </div>
                                    <div className="max-h-48 overflow-y-auto space-y-1 py-1">
                                        {members.map(m => {
                                            const isChecked = assigneeIds.includes(m.userId);
                                            return (
                                                <div
                                                    key={m.userId}
                                                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50 dark:hover:bg-zinc-800/40 cursor-pointer"
                                                    onClick={() => toggleAssignee(m.userId)}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={() => { }} // Handled by outer click
                                                        className="w-3.5 h-3.5 rounded border-zinc-300 dark:border-zinc-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                    />
                                                    <Avatar className="h-5.5 w-5.5">
                                                        <AvatarImage src={m.user.image} />
                                                        <AvatarFallback className="text-[9px]">{m.user.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{m.user.name || m.user.email}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>

                        {/* Avatars Row */}
                        <div className="flex -space-x-1.5 overflow-hidden py-1">
                            {task.assignees && task.assignees.map((assignee) => (
                                <Avatar key={assignee.userId} className="inline-block h-7 w-7 rounded-full ring-2 ring-white dark:ring-zinc-900" title={assignee.user.name}>
                                    <AvatarImage src={assignee.user.image} />
                                    <AvatarFallback className="text-[10px] bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 font-bold">
                                        {assignee.user.name?.substring(0, 2).toUpperCase() || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                            ))}
                            {(!task.assignees || task.assignees.length === 0) && (
                                <span className="text-xs italic text-slate-400">No assignees</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Due Date */}
                <div className="space-y-2 flex flex-col col-span-2 sm:col-span-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Due Date</label>
                    <Popover>
                        <PopoverTrigger asChild disabled={isViewer}>
                            <Button
                                variant={"ghost"}
                                className={cn(
                                    "w-full justify-start text-left font-normal px-0 hover:bg-transparent h-10 bg-transparent",
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
                        className="resize-none bg-background text-xs min-h-[60px]"
                        disabled={isViewer}
                    />
                )}
            </div>

            {/* Description */}
            <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</label>
                <Textarea
                    className="min-h-[120px] font-sans resize-y bg-transparent"
                    placeholder="Add more details... (Markdown supported)"
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
                    className="bg-transparent"
                />
            </div>

            {/* Activity Timeline Logs */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-zinc-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Activity Timeline
                </h4>
                <div className="space-y-4 pl-2 max-h-60 overflow-y-auto pr-1">
                    {activities.map((act) => {
                        const dateStr = new Date(act.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
                        return (
                            <div key={act.id} className="relative pl-5 border-l border-zinc-200 dark:border-zinc-800 pb-1">
                                <div className="absolute -left-[6px] top-1.5 w-3 h-3 rounded-full bg-slate-200 dark:bg-zinc-800 border-2 border-white dark:border-zinc-900" />
                                <div className="space-y-1">
                                    <p className="text-xs text-slate-700 dark:text-slate-300">
                                        <span className="font-semibold">{act.user.name || act.user.email}</span>{' '}
                                        {act.action === 'CREATED' && 'created this task'}
                                        {act.action === 'STATUS_CHANGED' && (
                                            <>
                                                moved status from <span className="font-medium text-slate-900 dark:text-zinc-100 bg-slate-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-[10px]">{act.oldStatus}</span> to <span className="font-medium text-slate-900 dark:text-zinc-100 bg-slate-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-[10px]">{act.newStatus}</span>
                                            </>
                                        )}
                                        {act.action === 'ASSIGNED' && 'updated the task assignments'}
                                        {act.action === 'APPROVED' && 'approved this task review'}
                                        {act.action === 'REJECTED' && 'rejected this task review'}
                                        {act.action === 'DELETED' && 'soft-deleted this task'}
                                    </p>
                                    {act.action === 'REJECTED' && act.metadata?.reason && (
                                        <div className="flex gap-1 items-start text-[11px] text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-950/10 p-1.5 rounded border border-red-100/40 dark:border-red-950/40">
                                            <CornerDownRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                            <span>Reason: "{act.metadata.reason}"</span>
                                        </div>
                                    )}
                                    <span className="text-[10px] text-slate-400 block">{dateStr}</span>
                                </div>
                            </div>
                        );
                    })}
                    {activities.length === 0 && (
                        <p className="text-xs italic text-slate-400">No activity recorded yet.</p>
                    )}
                </div>
            </div>

            <div className="text-[10px] text-slate-400 text-right">
                All changes saved automatically
            </div>
        </div>
    );
}
