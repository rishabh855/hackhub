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
}

export function KanbanColumn({ id, title, tasks, deleteTask }: Props) {
    const { setNodeRef } = useDroppable({ id });

    return (
        <div className="bg-gray-50 rounded-lg p-4 w-80 flex-shrink-0 flex flex-col h-full border">
            <h3 className="font-semibold mb-4 text-gray-700 flex items-center justify-between">
                {title}
                <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
                    {tasks.length}
                </span>
            </h3>
            <div ref={setNodeRef} className="flex-1 overflow-y-auto min-h-[100px]">
                <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    {tasks.map((task) => (
                        <TaskCard key={task.id} task={task} deleteTask={deleteTask} />
                    ))}
                </SortableContext>
            </div>
        </div>
    );
}
