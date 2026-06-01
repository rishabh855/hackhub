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
    role: string;
}

export function KanbanColumn({ id, title, tasks, deleteTask, onTaskClick, role }: Props) {
    const { setNodeRef } = useDroppable({ id });

    return (
        <div className="bg-slate-100/60 dark:bg-white/5 hover:bg-slate-100/80 dark:hover:bg-white/10 transition-colors duration-200 rounded-xl p-4 w-80 flex-shrink-0 flex flex-col h-full border border-slate-200/80 dark:border-white/10">
            <h3 className="font-semibold mb-4 text-slate-800 dark:text-slate-200 flex items-center justify-between">
                {title}
                <span className="bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 text-xs px-2 py-1 rounded-full border border-slate-300/30 dark:border-white/5">
                    {tasks.length}
                </span>
            </h3>
            <div ref={setNodeRef} className="flex-1 overflow-y-auto min-h-0 pr-1">
                <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {tasks.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500/50 text-sm italic border-2 border-dashed border-slate-200 dark:border-white/10 rounded-lg m-2 p-4">
                            Drop tasks here
                        </div>
                    ) : (
                        tasks.map((task) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                deleteTask={deleteTask}
                                onClick={() => onTaskClick?.(task)}
                                role={role}
                            />
                        ))
                    )}
                </SortableContext>
            </div>
        </div>
    );
}
