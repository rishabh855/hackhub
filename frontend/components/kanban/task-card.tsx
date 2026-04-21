import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface Task {
    id: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
    dueDate?: string | Date;
}

interface Props {
    task: Task;
    deleteTask: (id: string) => void;
    onClick?: () => void;
    role: string;
}

export function TaskCard({ task, deleteTask, onClick, role }: Props) {
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
            <motion.div
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
                <Card className="mb-3 cursor-grab hover:shadow-lg transition-all border border-white/5 bg-white/5 backdrop-blur-md hover:bg-white/10 hover:border-indigo-500/50 hover:shadow-[0_0_15px_rgba(79,70,229,0.15)] overflow-hidden relative group">
                    <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm font-medium leading-none text-slate-200 group-hover:text-indigo-200 transition-colors">
                            {task.title}
                        </CardTitle>
                        {role === 'OWNER' && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-gray-400 hover:text-red-500 transition-colors"
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    deleteTask(task.id);
                                }}
                            >
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent className="p-4 pt-2 relative z-10">
                        <div className="flex items-center justify-between mt-2">
                            {task.description && (
                                <p className="text-sm text-slate-400 line-clamp-2 mr-2 mb-2">
                                    {task.description}
                                </p>
                            )}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                            <Badge variant="secondary" className={`${priorityColor} shadow-sm`}>
                                {task.priority}
                            </Badge>
                            {task.dueDate && (
                                <span className="text-xs text-slate-400 bg-white/5 border border-white/10 px-2 py-1 rounded">
                                    {new Date(task.dueDate).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
