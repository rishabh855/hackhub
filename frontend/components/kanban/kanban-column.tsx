import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TaskCard } from './task-card';

interface Task {
    id: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
}

interface Props {
    id: string;
    title: string;
    tasks: Task[];
    deleteTask: (id: string) => void;
    onTaskClick?: (task: Task) => void;
}

export function KanbanColumn({ id, title, tasks, deleteTask, onTaskClick }: Props) {
    const { setNodeRef } = useDroppable({ id });

    return (
        <div className="bg-indigo-50/30 dark:bg-indigo-950/10 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/20 transition-colors duration-200 rounded-xl p-4 w-80 flex-shrink-0 flex flex-col h-full border border-indigo-100/50 dark:border-indigo-900/20">
            <h3 className="font-semibold mb-4 text-gray-700 flex items-center justify-between">
                {title}
                <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
                    {tasks.length}
                </span>
            </h3>
            <div ref={setNodeRef} className="flex-1 overflow-y-auto min-h-0 pr-1">
                <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {tasks.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-muted-foreground/40 text-sm italic border-2 border-dashed border-indigo-100/50 dark:border-indigo-900/20 rounded-lg m-2 p-4">
                            Drop tasks here
                        </div>
                    ) : (
                        tasks.map((task) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                deleteTask={deleteTask}
                                onClick={() => onTaskClick?.(task)}
                            />
                        ))
                    )}
                </SortableContext>
            </div>
        </div>
    );
}
