'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { acceptInvite } from '@/lib/invitations';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

function AcceptInviteContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');
    const code = searchParams.get('code');

    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [projectId, setProjectId] = useState<string | null>(null);

    const handleAccept = async () => {
        const value = token || code;
        if (!value) {
            setStatus('error');
            setMessage('No invitation token or code found.');
            return;
        }

        setStatus('loading');
        try {
            const res = await acceptInvite(value);
            setStatus('success');
            setMessage(res.message);
            if (res.teamId) {
                setProjectId(res.teamId);
            }
            toast.success('Joined team successfully!');
        } catch (err: any) {
            setStatus('error');
            setMessage(err.message || 'Failed to join project');
            toast.error(err.message || 'Failed to join project');
        }
    };

    // Auto-accept if token is present (Link click)
    useEffect(() => {
        if (token && status === 'idle') {
            handleAccept();
        }
    }, [token, status]);

    if (status === 'loading') {
        return (
            <div className="flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <p>Joining project...</p>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <CheckCircle className="w-16 h-16 text-green-500" />
                <h2 className="text-2xl font-bold">Successfully Joined!</h2>
                <p className="text-muted-foreground">{message}</p>
                {projectId && (
                    <Button onClick={() => router.push(`/teams/${projectId}/projects`)}>
                        Go to Team
                    </Button>
                )}
                {/* Note: In real app, we need to know teamId to redirect correctly. 
                    The API response could return TeamID or we lookup. 
                    For now, redirect to home or dashboard */}
                <Button variant="outline" onClick={() => router.push('/dashboard')}>
                    Go to Dashboard
                </Button>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <XCircle className="w-16 h-16 text-red-500" />
                <h2 className="text-2xl font-bold">Failed to Join</h2>
                <p className="text-muted-foreground">{message}</p>
                <Button variant="outline" onClick={() => router.push('/dashboard')}>
                    Return to Dashboard
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center space-y-4">
            <h2 className="text-xl font-semibold">Join Project</h2>
            <p>You have been invited to join a project.</p>
            <Button onClick={handleAccept}>
                Accept Invitation
            </Button>
        </div>
    );
}

export default function AcceptInvitePage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-center">Team Invitation</CardTitle>
                </CardHeader>
                <CardContent>
                    <Suspense fallback={<div>Loading...</div>}>
                        <AcceptInviteContent />
                    </Suspense>
                </CardContent>
            </Card>
        </div>
    );
}
