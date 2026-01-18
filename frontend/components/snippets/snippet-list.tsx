'use client';

import { useEffect, useState } from 'react';
import { getProjectSnippets } from '@/lib/api';
import { SnippetDialog } from './snippet-dialog';
import { SnippetCard } from './snippet-card';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';

import { useRef } from 'react';
import { getProjectMembership } from '@/lib/api';

export function SnippetList({ projectId }: { projectId: string }) {
    const { data: session } = useSession();
    const [snippets, setSnippets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState<string | null>(null);

    const loadSnippets = async () => {
        try {
            const data = await getProjectSnippets(projectId);
            setSnippets(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (projectId) {
            loadSnippets();
            if (session?.user) {
                // @ts-ignore
                getProjectMembership(projectId, session.user.id).then(m => {
                    if (m) setRole(m.role);
                });
            }
        }
    }, [projectId, session]);

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    const isViewer = role === 'VIEWER';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Shared Snippets</h3>
                {session?.user && !isViewer && (
                    <SnippetDialog
                        projectId={projectId}
                        // @ts-ignore
                        userId={session.user.id}
                        onSnippetCreated={loadSnippets}
                    />
                )}
            </div>

            {snippets.length === 0 ? (
                <div className="text-center py-12 border rounded-lg border-dashed bg-muted/20">
                    <p className="text-muted-foreground">No snippets shared yet. Share some code!</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {snippets.map(snippet => (
                        <SnippetCard
                            key={snippet.id}
                            snippet={snippet}
                            onDelete={loadSnippets}
                            projectId={projectId}
                            role={role || 'VIEWER'}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
