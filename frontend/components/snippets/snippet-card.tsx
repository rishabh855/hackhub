'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CodeBlock } from './code-block';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { deleteSnippet } from '@/lib/api';
import { SnippetExplainer } from '../ai/snippet-explainer';

interface Snippet {
    id: string;
    title: string;
    description: string | null;
    language: string;
    code: string;
    user: { name: string | null; image: string | null };
    createdAt: string;
}

interface SnippetCardProps {
    snippet: Snippet;
    onDelete: () => void;
}

export function SnippetCard({ snippet, onDelete }: SnippetCardProps) {
    const handleDelete = async () => {
        try {
            await deleteSnippet(snippet.id);
            onDelete();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <Card className="overflow-hidden">
            <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
                <div>
                    <CardTitle className="text-base font-medium">{snippet.title}</CardTitle>
                    {snippet.description && (
                        <p className="text-xs text-muted-foreground mt-1">{snippet.description}</p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-mono">
                        {snippet.language}
                    </span>
                    <SnippetExplainer code={snippet.code} language={snippet.language} />
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={handleDelete}>
                        <Trash2 className="h-3 w-3" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="bg-muted/30 p-0">
                <div className="px-4 pb-4">
                    <CodeBlock code={snippet.code} language={snippet.language} />
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <span>Shared by {snippet.user.name || 'Unknown'}</span>
                        <span>•</span>
                        <span>{new Date(snippet.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
