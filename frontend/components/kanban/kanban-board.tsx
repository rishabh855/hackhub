'use client';

import useSWR from 'swr';

import { useState, useEffect } from 'react';
import {
    DndContext,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    DragStartEvent,
    DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { io } from 'socket.io-client';
import { KanbanColumn } from './kanban-column';
import { TaskCard } from './task-card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { TaskDetailView } from "./task-detail-view";
import { TeamMembersDialog } from "./team-members-dialog";
import { CreateTaskDialog } from "./create-task-dialog";
import { getProjectMembers, getProjectTasks, updateTask, deleteTask, getProjectMembership } from '@/lib/api';
import { useUser } from "@/hooks/use-user";
import { AiTaskSuggester } from '@/components/ai/ai-task-suggester';

// Centralized allowed transitions matching the backend
const MEMBER_ALLOWED_TRANSITIONS: Record<string, string[]> = {
    TODO: ['IN_PROGRESS'],
    IN_PROGRESS: ['REVIEW'],
    REVIEW: [],
    DONE: [],
};

const LEADER_ALLOWED_TRANSITIONS: Record<string, string[]> = {
    TODO: ['IN_PROGRESS', 'REVIEW', 'DONE'],
    IN_PROGRESS: ['TODO', 'REVIEW', 'DONE'],
    REVIEW: ['IN_PROGRESS', 'DONE'],
    DONE: ['REVIEW'],
};

const OWNER_ALLOWED_TRANSITIONS: Record<string, string[]> = {
    TODO: ['IN_PROGRESS', 'REVIEW', 'DONE'],
    IN_PROGRESS: ['TODO', 'REVIEW', 'DONE'],
    REVIEW: ['IN_PROGRESS', 'DONE'],
    DONE: ['REVIEW'],
};

function canMoveTask(role: string, currentStatus: string, nextStatus: string): boolean {
    if (currentStatus === nextStatus) return true;
    let allowed: string[] = [];
    if (role === 'OWNER') {
        allowed = OWNER_ALLOWED_TRANSITIONS[currentStatus] || [];
    } else if (role === 'LEADER') {
        allowed = LEADER_ALLOWED_TRANSITIONS[currentStatus] || [];
    } else {
        allowed = MEMBER_ALLOWED_TRANSITIONS[currentStatus] || [];
    }
    return allowed.includes(nextStatus);
}

interface User {
    id: string;
    name: string;
    image?: string;
    email?: string;
}

interface TaskAssignee {
    userId: string;
    user: User;
}

interface Task {
    id: string;
    title: string;
    description?: string;
    status: string; // 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'
    priority: string; // 'LOW', 'MEDIUM', 'HIGH', 'URGENT'
    dueDate?: string;
    isBlocked?: boolean;
    blockedReason?: string;
    position: number;
    assignees?: TaskAssignee[];
    activeBy?: User;
}

interface Props {
    projectId: string;
}

const COLUMNS = [
    { id: 'TODO', title: 'To Do' },
    { id: 'IN_PROGRESS', title: 'In Progress' },
    { id: 'REVIEW', title: 'Review' },
    { id: 'DONE', title: 'Done' },
];

export function KanbanBoard({ projectId }: Props) {
    const { session } = useUser();
    const [activeId, setActiveId] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const [role, setRole] = useState<string | null>(null);

    // Sheet State (for Task Details)
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedSheetTask, setSelectedSheetTask] = useState<Task | null>(null);

    const { data: tasks = [], error, mutate } = useSWR<Task[]>(
        projectId ? ['tasks', projectId] : null,
        ([_, id]) => getProjectTasks(id as string),
        {
            refreshInterval: 5000,
            revalidateOnFocus: true
        }
    );

    useEffect(() => {
        setIsMounted(true);
    }, [projectId]);

    useEffect(() => {
        if (session?.user && projectId) {
            // @ts-ignore
            getProjectMembership(projectId, session.user.id).then(m => {
                if (m) setRole(m.role);
            });
        }
    }, [session, projectId]);

    // WebSocket realtime connection for instant updates
    useEffect(() => {
        if (!session?.access_token || !projectId) return;

        const SOCKET_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
        const socket = io(SOCKET_URL, {
            auth: { token: session.access_token },
            transports: ['websocket'],
        });

        socket.on('connect', () => {
            console.log('[KanbanBoard] Connected to real-time sync, joining project room:', projectId);
            socket.emit('joinProject', projectId);
        });

        socket.on('taskCreated', (task) => {
            console.log('[KanbanBoard] Task created event received');
            mutate();
        });

        socket.on('taskUpdated', (task) => {
            console.log('[KanbanBoard] Task updated event received');
            mutate();
        });

        socket.on('taskDeleted', (payload) => {
            console.log('[KanbanBoard] Task deleted event received');
            mutate();
        });

        return () => {
            socket.disconnect();
        };
    }, [projectId, session?.access_token, mutate]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 } // Fix for button clicks
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    function handleDragStart(event: DragStartEvent) {
        if (role === 'VIEWER') return;
        const activeTask = tasks.find((t) => t.id === event.active.id);
        
        // Enforce member edit permissions (must be assigned to the task)
        if (role === 'MEMBER') {
            const isAssignee = activeTask?.assignees?.some((a) => a.userId === session?.user?.id);
            if (!isAssignee) {
                alert("Members can only move tasks assigned to them.");
                return;
            }
        }
        
        setActiveId(event.active.id as string);
    }

    async function handleDragEnd(event: DragEndEvent) {
        if (role === 'VIEWER') return;
        const { active, over } = event;

        if (!over) {
            setActiveId(null);
            return;
        }

        const activeTask = tasks.find((t) => t.id === active.id);
        const overId = over.id as string;

        // Logic: Find which column the `over` target belongs to.
        let newStatus = activeTask?.status;

        if (COLUMNS.find(c => c.id === overId)) {
            newStatus = overId;
        } else {
            const overTask = tasks.find(t => t.id === overId);
            if (overTask) {
                newStatus = overTask.status;
            }
        }

        if (activeTask && newStatus && activeTask.status !== newStatus) {
            const currentRole = role || 'MEMBER';

            // 1. Enforce workflow transition map checks client-side
            if (!canMoveTask(currentRole, activeTask.status, newStatus)) {
                alert(`Insufficient permissions to move task from ${activeTask.status} to ${newStatus}`);
                setActiveId(null);
                return;
            }

            // 2. Enforce member assigned check
            if (currentRole === 'MEMBER') {
                const isAssignee = activeTask.assignees?.some((a) => a.userId === session?.user?.id);
                if (!isAssignee) {
                    alert("Members can only move tasks assigned to them.");
                    setActiveId(null);
                    return;
                }
            }

            // Optimistic Update
            mutate(
                tasks.map((t) =>
                    t.id === activeTask.id ? { ...t, status: newStatus! } : t
                ),
                false // Do not revalidate immediately
            );

            try {
                // @ts-ignore
                await updateTask(activeTask.id, { status: newStatus }, session?.user?.id, projectId);
                mutate(); // Revalidate SWR cache with backend confirmation
            } catch (err) {
                console.error("Failed to update task status", err);
                mutate(); // Revert on failure
            }
        }

        setActiveId(null);
    }

    async function handleDeleteTask(id: string) {
        const currentRole = role || 'MEMBER';
        if (currentRole !== 'OWNER' && currentRole !== 'LEADER') {
            alert('Only Team Owners and Leaders can delete tasks.');
            return;
        }
        console.log('Deleting task:', id);
        try {
            // @ts-ignore
            await deleteTask(id, projectId, session?.user?.id);
            // Optimistic delete
            mutate(tasks.filter(t => t.id !== id), false);
            console.log('Task deleted successfully');
        } catch (err: any) {
            console.error('Delete failed:', err);
            alert('Failed to delete task: ' + err.message);
        }
    }

    // Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('ALL');

    // Filter Logic
    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesPriority = priorityFilter === 'ALL' || task.priority === priorityFilter;
        return matchesSearch && matchesPriority;
    });

    function onTaskClick(task: Task) {
        setSelectedSheetTask(task);
        setIsSheetOpen(true);
    }

    if (!isMounted) return null;



    return (
        <div className="h-full flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                {/* Filter Bar (Left) */}
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Input
                        placeholder="Search tasks..."
                        className="w-full md:w-[240px] h-9 bg-white dark:bg-zinc-950"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                        <SelectTrigger className="w-[130px] h-9 bg-white dark:bg-zinc-950">
                            <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Priorities</SelectItem>
                            <SelectItem value="HIGH">High</SelectItem>
                            <SelectItem value="MEDIUM">Medium</SelectItem>
                            <SelectItem value="LOW">Low</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Actions (Right) */}
                <div className="flex items-center gap-2 self-end md:self-auto">
                    {role !== 'VIEWER' && (
                        <>
                            <CreateTaskDialog
                                projectId={projectId}
                                trigger={
                                    <Button size="sm" className="shadow-sm">
                                        <Plus className="w-4 h-4 mr-2" />
                                        New Task
                                    </Button>
                                }
                                onTaskCreated={() => mutate()}
                            />
                            <AiTaskSuggester projectId={projectId} onTasksCreated={() => mutate()} />
                        </>
                    )}
                    <TeamMembersDialog projectId={projectId} />
                </div>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-250px)]">
                    {COLUMNS.map((col) => (
                        <KanbanColumn
                            key={col.id}
                            id={col.id}
                            title={col.title}
                            tasks={filteredTasks.filter((t) => t.status === col.id)}
                            deleteTask={handleDeleteTask}
                            onTaskClick={onTaskClick}
                            role={role || 'VIEWER'}
                        />
                    ))}
                </div>
                <DragOverlay>
                    {activeId ? (
                        <TaskCard
                            task={tasks.find((t) => t.id === activeId)!}
                            deleteTask={() => { }}
                            role={role || 'VIEWER'}
                        />
                    ) : null}
                </DragOverlay>
            </DndContext>

            <Sheet open={isSheetOpen} onOpenChange={(open) => {
                setIsSheetOpen(open);
                if (!open) {
                    mutate();
                    setSelectedSheetTask(null);
                }
            }}>
                <SheetContent side="right" className="w-[400px] sm:w-[540px] overflow-y-auto pt-10">
                    <SheetHeader>
                        <SheetTitle>Task Details</SheetTitle>
                    </SheetHeader>
                    {selectedSheetTask && (
                        <TaskDetailView
                            task={selectedSheetTask}
                            projectId={projectId}
                            role={role || 'VIEWER'}
                            onUpdate={() => {
                                // Auto-saving, might not need full reload but safe to do
                                // Don't close sheet on update
                                mutate();
                            }}
                        />
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
