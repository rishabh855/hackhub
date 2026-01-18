import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface Task {
    id: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
}

interface Props {
    task: Task;
    deleteTask: (id: string) => void;
    onClick?: () => void;
}

export function TaskCard({ task, deleteTask, onClick }: Props) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const priorityColor = {
        LOW: 'bg-green-100 text-green-800',
        MEDIUM: 'bg-yellow-100 text-yellow-800',
        HIGH: 'bg-red-100 text-red-800',
    }[task.priority] || 'bg-gray-100 text-gray-800';

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="touch-none"
            onClick={onClick}
        >
            <Card className="mb-3 cursor-grab hover:shadow-md transition-shadow">
                <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-sm font-medium leading-none">
                        {task.title}
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-gray-400 hover:text-red-500"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                            e.stopPropagation();
                            deleteTask(task.id);
                        }}
                    >
                        <Trash2 className="h-3 w-3" />
                    </Button>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                    <div className="flex items-center justify-between mt-2">
                        <Badge variant="secondary" className={priorityColor}>
                            {task.priority}
                        </Badge>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
