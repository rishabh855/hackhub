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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createSnippet } from '@/lib/api';
import { Plus } from 'lucide-react';

interface SnippetDialogProps {
    projectId: string;
    userId: string;
    onSnippetCreated: () => void;
}

const LANGUAGES = ['JavaScript', 'TypeScript', 'Python', 'Java', 'HTML', 'CSS', 'SQL', 'JSON', 'Bash'];
const CATEGORIES = ['COMPONENT', 'HOOK', 'UTILITY', 'CONFIG', 'DATABASE', 'API', 'OTHER'];

export function SnippetDialog({ projectId, userId, onSnippetCreated }: SnippetDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        language: 'javascript',
        category: 'OTHER',
        code: ''
    });

    const handleSubmit = async () => {
        if (!formData.title || !formData.code) return;
        setLoading(true);
        try {
            await createSnippet({
                userId,
                projectId,
                title: formData.title,
                description: formData.description,
                language: formData.language,
                category: formData.category,
                code: formData.code
            });
            setOpen(false);
            setFormData({ title: '', description: '', language: 'javascript', category: 'OTHER', code: '' });
            onSnippetCreated();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" /> New Snippet
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Create Code Snippet</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Title</Label>
                        <Input
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g. Auth Middleware Helper"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Language</Label>
                            <Select
                                value={formData.language}
                                onValueChange={(val) => setFormData({ ...formData, language: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {LANGUAGES.map(lang => (
                                        <SelectItem key={lang} value={lang.toLowerCase()}>{lang}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Category</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(val) => setFormData({ ...formData, category: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {CATEGORIES.map(cat => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label>Description (Optional)</Label>
                        <Input
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Short description..."
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label>Code</Label>
                        <Textarea
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            className="font-mono min-h-[200px]"
                            placeholder="// Paste your code here"
                        />
                    </div>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Creating...' : 'Create Snippet'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
