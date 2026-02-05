'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createProject } from '@/lib/api';
import { Plus } from 'lucide-react';
import { useUser } from '@/hooks/use-user';

interface CreateProjectDialogProps {
    teamId: string;
    onProjectCreated: () => void;
}

export function CreateProjectDialog({ teamId, onProjectCreated }: CreateProjectDialogProps) {
    const { session } = useUser();
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleCreate() {
        // @ts-ignore
        if (!name.trim() || !session?.user?.id) return;

        setLoading(true);
        try {
            // @ts-ignore
            await createProject(teamId, name, session.user.id, description);
            setOpen(false);
            setName('');
            setDescription('');
            onProjectCreated();
        } catch (error) {
            console.error('Failed to create project:', error);
            // @ts-ignore
            const errorMessage = error?.message || 'Failed to create project';
            alert(`Error: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create Project
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create a new project</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Project Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. AI Assistant"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="desc">Description (Optional)</Label>
                        <Input
                            id="desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Short summary..."
                        />
                    </div>
                    <Button onClick={handleCreate} disabled={loading}>
                        {loading ? 'Creating...' : 'Create Project'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
