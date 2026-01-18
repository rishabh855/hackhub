'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CodeBlock } from './code-block';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { deleteSnippet } from '@/lib/api';
import { SnippetExplainer } from '../ai/snippet-explainer';
import { useState } from 'react';
import { SnippetDetailView } from './snippet-detail-view';

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

interface SnippetCardProps {
    snippet: Snippet;
    onDelete: () => void;
}

export function SnippetCard({ snippet, onDelete }: SnippetCardProps) {
    const [showDetails, setShowDetails] = useState(false);

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent opening details when deleting
        try {
            await deleteSnippet(snippet.id);
            onDelete();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <>
            <SnippetDetailView
                snippet={snippet}
                open={showDetails}
                onOpenChange={setShowDetails}
            />
            <Card className="overflow-hidden hover:border-primary/50 transition-colors cursor-pointer" onClick={() => setShowDetails(true)}>
                <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
                    <div>
                        <CardTitle className="text-base font-medium">{snippet.title}</CardTitle>
                        {snippet.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{snippet.description}</p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-mono uppercase border">
                            {snippet.category || 'OTHER'}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-mono">
                            {snippet.language}
                        </span>
                        <div onClick={(e) => e.stopPropagation()}>
                            <SnippetExplainer code={snippet.code} language={snippet.language} />
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={handleDelete}>
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="bg-muted/30 p-0">
                    <div className="px-4 pb-4 max-h-[200px] overflow-hidden relative">
                        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-muted/30 to-transparent pointer-events-none" />
                        <CodeBlock code={snippet.code} language={snippet.language} />
                    </div>
                    <div className="px-4 pb-2 flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <span>Shared by {snippet.user.name || 'Unknown'}</span>
                        <span>•</span>
                        <span>{new Date(snippet.createdAt).toLocaleDateString()}</span>
                    </div>
                </CardContent>
            </Card>
        </>
    );
}
