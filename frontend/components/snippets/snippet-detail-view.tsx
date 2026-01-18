'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CodeBlock } from './code-block';
import { Copy } from 'lucide-react';
import { useState } from 'react';
import { SnippetExplainer } from '../ai/snippet-explainer';

interface Snippet {
    id: string;
    title: string;
    description: string | null;
    language: string;
    category?: string;
    code: string;
    user: { name: string | null; image: string | null };
    createdAt: string;
}

interface SnippetDetailViewProps {
    snippet: Snippet | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SnippetDetailView({ snippet, open, onOpenChange }: SnippetDetailViewProps) {
    const [copied, setCopied] = useState(false);

    if (!snippet) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(snippet.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <DialogTitle className="text-xl">{snippet.title}</DialogTitle>
                            {snippet.description && (
                                <DialogDescription className="mt-1">
                                    {snippet.description}
                                </DialogDescription>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-mono uppercase border">
                                {snippet.category || 'OTHER'}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-mono">
                                {snippet.language}
                            </span>
                        </div>
                    </div>
                </DialogHeader>

                <div className="relative mt-4 group">
                    <div className="absolute right-2 top-2 z-10 flex gap-2">
                        <Button variant="secondary" size="icon" className="h-8 w-8" onClick={handleCopy}>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                    <CodeBlock code={snippet.code} language={snippet.language} />
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Shared by {snippet.user.name || 'Unknown'}</span>
                        <span>•</span>
                        <span>{new Date(snippet.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div>
                        <SnippetExplainer code={snippet.code} language={snippet.language} />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
