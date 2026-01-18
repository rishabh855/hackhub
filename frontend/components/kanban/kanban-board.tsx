'use client';

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
import { TeamMembersDialog } from "../dashboard/team-members-dialog";
import { CreateTaskDialog } from "../dashboard/create-task-dialog";
import { getProjectMembers, getProjectTasks, updateTask, deleteTask, getProjectMembership } from '@/lib/api';
import { useSession } from "next-auth/react";

interface Task {
    id: string;
    title: string;
    description?: string;
    status: string; // 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'
    priority: string; // 'LOW', 'MEDIUM', 'HIGH'
    dueDate?: string;
    isBlocked?: boolean;
    blockedReason?: string;
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
    const { data: session } = useSession();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [role, setRole] = useState<string | null>(null);

    // Sheet State (for Task Details)
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedSheetTask, setSelectedSheetTask] = useState<Task | null>(null);

    useEffect(() => {
        setIsMounted(true);
        loadTasks();
    }, [projectId]);

    useEffect(() => {
        if (session?.user && projectId) {
            // @ts-ignore
            getProjectMembership(projectId, session.user.id).then(m => {
                if (m) setRole(m.role);
            });
        }
    }, [session, projectId]);

    async function loadTasks() {
        try {
            const data = await getProjectTasks(projectId);
            setTasks(data);
        } catch (err) {
            console.error(err);
        }
    }

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
            // Optimistic Update
            setTasks((prev) =>
                prev.map((t) =>
                    t.id === activeTask.id ? { ...t, status: newStatus! } : t
                )
            );

            try {
                // @ts-ignore
                await updateTask(activeTask.id, { status: newStatus }, session?.user?.id, projectId);
            } catch (err) {
                console.error("Failed to update task status", err);
                loadTasks(); // Revert on failure
            }
        }

        setActiveId(null);
    }

    async function handleDeleteTask(id: string) {
        if (role === 'VIEWER') {
            alert('Viewers cannot delete tasks.');
            return;
        }
        console.log('Deleting task:', id);
        try {
            // @ts-ignore
            await deleteTask(id, projectId, session?.user?.id);
            setTasks(prev => prev.filter(t => t.id !== id));
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
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-semibold">Board</h2>
                    {/* Filter Bar */}
                    <div className="flex items-center gap-2">
                        <Input
                            placeholder="Search tasks..."
                            className="w-[200px] h-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                            <SelectTrigger className="w-[130px] h-9">
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
                </div>

                {/* New Task Dialog */}
                <div className="flex gap-2">
                    <TeamMembersDialog projectId={projectId} />
                    {role !== 'VIEWER' && (
                        <CreateTaskDialog
                            projectId={projectId}
                            trigger={
                                <Button>
                                    <Plus className="w-4 h-4 mr-2" />
                                    New Task
                                </Button>
                            }
                            onTaskCreated={loadTasks}
                        />
                    )}
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
                        />
                    ))}
                </div>
                <DragOverlay>
                    {activeId ? (
                        <TaskCard task={tasks.find((t) => t.id === activeId)!} deleteTask={() => { }} />
                    ) : null}
                </DragOverlay>
            </DndContext>

            <Sheet open={isSheetOpen} onOpenChange={(open) => {
                setIsSheetOpen(open);
                if (!open) {
                    loadTasks();
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
                                loadTasks();
                            }}
                        />
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
