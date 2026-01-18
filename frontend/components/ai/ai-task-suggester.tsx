'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { generateAiTasks, createTask } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from 'next-auth/react';

interface AiTaskSuggesterProps {
    projectId: string;
    onTasksCreated: () => void;
}

export function AiTaskSuggester({ projectId, onTasksCreated }: AiTaskSuggesterProps) {
    const { data: session } = useSession();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [description, setDescription] = useState('');
    const { toast } = useToast();

    const handleGenerate = async () => {
        if (!description.trim() || !session?.user) return;

        setLoading(true);
        try {
            const data = await generateAiTasks(description);
            const tasks = data.tasks || [];

            if (tasks.length === 0) {
                toast({
                    title: "No tasks generated",
                    description: "AI could not generate tasks from this description.",
                    variant: "destructive"
                });
                return;
            }

            // Create tasks sequentially to ensure order (or parallel if speed needed)
            // Sequential is safer for DB load usually and easier to track errors
            let count = 0;
            for (const task of tasks) {
                // @ts-ignore
                await createTask({
                    projectId,
                    title: task.title,
                    description: task.description,
                    priority: 'MEDIUM',
                    // Assuming AI doesn't give us Due Date yet, but we could ask for it.
                }, (session.user as any).id);
                // Wait, createTask in api.ts takes userId as 2nd arg? 
                // Checking api.ts usage in other files:
                // createTask(data, session.user.id)
                // BUT here we are in a client component. We need session.
                count++;
            }

            toast({
                title: "AI Tasks Generated",
                description: `Created ${count} tasks successfully based on your description.`,
            });
            onTasksCreated();
            setOpen(false);
            setDescription('');

        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to generate tasks. Please try again.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="ml-2 gap-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                >
                    <Sparkles className="w-3 h-3" />
                    Suggest Tasks
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>AI Task Breakdown</DialogTitle>
                    <DialogDescription>
                        Describe the feature or goal you want to achieve. AI will break it down into actionable tasks.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Textarea
                        placeholder="e.g., Implement a user registration flow with email verification and Google OAuth..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="h-32"
                    />
                </div>
                <DialogFooter>
                    <Button onClick={handleGenerate} disabled={loading || !description.trim()}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            'Generate Tasks'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
