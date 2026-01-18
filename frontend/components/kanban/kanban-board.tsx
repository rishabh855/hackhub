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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { createTask, getProjectTasks, updateTask, deleteTask } from '@/lib/api';

interface Task {
    id: string;
    title: string;
    description?: string;
    status: string; // 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'
    priority: string; // 'LOW', 'MEDIUM', 'HIGH'
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
    const [tasks, setTasks] = useState<Task[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // New Task State
    const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState('MEDIUM');

    useEffect(() => {
        setIsMounted(true);
        loadTasks();
    }, [projectId]);

    async function loadTasks() {
        try {
            const data = await getProjectTasks(projectId);
            setTasks(data);
        } catch (err) {
            console.error(err);
        }
    }

    // ... (sensors and handlers)

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    function handleDragStart(event: DragStartEvent) {
        setActiveId(event.active.id as string);
    }

    async function handleDragEnd(event: DragEndEvent) {
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
                await updateTask(activeTask.id, { status: newStatus });
            } catch (err) {
                console.error("Failed to update task status", err);
                loadTasks(); // Revert on failure
            }
        }

        setActiveId(null);
    }

    async function handleCreateTask() {
        if (!newTaskTitle) return;
        setLoading(true);
        try {
            await createTask({
                title: newTaskTitle,
                projectId,
                priority: newTaskPriority,
            });
            setIsNewTaskOpen(false);
            setNewTaskTitle('');
            setNewTaskPriority('MEDIUM');
            loadTasks();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleDeleteTask(id: string) {
        console.log('Deleting task:', id);
        try {
            await deleteTask(id);
            setTasks(prev => prev.filter(t => t.id !== id));
            console.log('Task deleted successfully');
        } catch (err: any) {
            console.error('Delete failed:', err);
            alert('Failed to delete task: ' + err.message);
        }
    }

    if (!isMounted) return null;

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Board</h2>
                <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            New Task
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Task</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="title">Task Title</Label>
                                <Input
                                    id="title"
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    placeholder="e.g. Design Homepage"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="priority">Priority</Label>
                                <Select value={newTaskPriority} onValueChange={setNewTaskPriority}>
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
                            <Button onClick={handleCreateTask} disabled={loading}>
                                {loading ? 'Creating...' : 'Create Task'}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
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
                            tasks={tasks.filter((t) => t.status === col.id)}
                            deleteTask={handleDeleteTask}
                        />
                    ))}
                </div>
                <DragOverlay>
                    {activeId ? (
                        <TaskCard task={tasks.find((t) => t.id === activeId)!} deleteTask={() => { }} />
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}
