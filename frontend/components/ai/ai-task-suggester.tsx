'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { generateAiTasks, createTask } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

interface AiTaskSuggesterProps {
    projectId: string;
    onTasksCreated: () => void;
}

export function AiTaskSuggester({ projectId, onTasksCreated }: AiTaskSuggesterProps) {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleGenerate = async () => {
        setLoading(true);
        try {
            // Mock description - in real app, fetch project details
            const data = await generateAiTasks("This is a software project.");
            const tasks = data.tasks || [];

            for (const task of tasks) {
                await createTask({
                    projectId,
                    title: task.title,
                    description: task.description,
                    priority: 'MEDIUM'
                });
            }

            toast({
                title: "AI Tasks Generated",
                description: `Created ${tasks.length} tasks successfully.`,
            });
            onTasksCreated();

        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to generate tasks.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            variant="outline"
            size="sm"
            className="ml-2 gap-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
            onClick={handleGenerate}
            disabled={loading}
        >
            <Sparkles className="w-3 h-3" />
            {loading ? 'Generating...' : 'AI Suggest Tasks'}
        </Button>
    );
}
