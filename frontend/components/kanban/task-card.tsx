import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
    status: string;
    priority: string;
    dueDate?: string | Date;
    assignees?: TaskAssignee[];
    activeBy?: User;
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

    const priorityColor: Record<string, string> = {
        LOW: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400',
        MEDIUM: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
        HIGH: 'bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400',
        URGENT: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50 font-semibold animate-pulse',
    };

    const isAuthorizedToDelete = role === 'OWNER' || role === 'LEADER';

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
                <Card className="mb-3 cursor-grab shadow-sm hover:shadow-md transition-all border border-slate-200/80 dark:border-white/5 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md hover:bg-white/95 dark:hover:bg-zinc-900 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 overflow-hidden relative group">
                    {task.status === 'REVIEW' && (
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-indigo-500" />
                    )}
                    <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0 gap-2">
                        <CardTitle className="text-sm font-medium leading-normal text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-200 transition-colors">
                            {task.title}
                        </CardTitle>
                        {isAuthorizedToDelete && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-gray-400 hover:text-red-500 transition-colors cursor-pointer flex-shrink-0"
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
                    <CardContent className="p-4 pt-2 flex flex-col gap-3">
                        {task.description && (
                            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                                {task.description}
                            </p>
                        )}

                        {/* Working on this contributor label */}
                        {task.status === 'IN_PROGRESS' && task.activeBy && (
                            <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-1 rounded-md border border-indigo-100 dark:border-indigo-950/50 w-fit">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                </span>
                                <span className="font-medium truncate max-w-[150px]">
                                    Working: {task.activeBy.name}
                                </span>
                            </div>
                        )}

                        <div className="flex items-center justify-between mt-1 pt-2 border-t border-slate-100 dark:border-zinc-800">
                            <div className="flex gap-1">
                                <Badge variant="secondary" className={`${priorityColor[task.priority] || 'bg-gray-100 text-gray-800'} text-[10px] px-1.5 py-0.5 rounded shadow-sm border-none`}>
                                    {task.priority}
                                </Badge>
                                {task.dueDate && (
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100/50 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-slate-200/50 dark:border-zinc-700/50">
                                        {new Date(task.dueDate).toLocaleDateString()}
                                    </span>
                                )}
                            </div>

                            {/* Assignees Overlapping Avatars */}
                            {task.assignees && task.assignees.length > 0 && (
                                <div className="flex -space-x-2 overflow-hidden">
                                    {task.assignees.map((assignee) => (
                                        <div key={assignee.userId} title={assignee.user.name}>
                                            <Avatar className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-zinc-900">
                                                <AvatarImage src={assignee.user.image} alt={assignee.user.name} />
                                                <AvatarFallback className="bg-slate-200 dark:bg-zinc-800 text-[10px] font-semibold text-slate-600 dark:text-zinc-400">
                                                    {assignee.user.name?.substring(0, 2).toUpperCase() || 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
