import { createClient } from '@/lib/supabase';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

async function getHeaders() {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    return headers;
}

export interface CreateInviteParams {
    teamId: string;
    type: 'EMAIL' | 'LINK' | 'CODE';
    email?: string;
}

export async function createInvite(data: CreateInviteParams) {
    const headers = await getHeaders();
    const res = await fetch(`${BACKEND_URL}/invitations/create`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to create invitation');
    }
    return res.json();
}

export async function getPendingInvites(teamId: string) {
    const headers = await getHeaders();
    const res = await fetch(`${BACKEND_URL}/invitations/pending/${teamId}`, {
        method: 'GET',
        headers,
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to fetch pending invites');
    }
    return res.json();
}

export async function acceptInvite(tokenOrCode: string) {
    const headers = await getHeaders();
    const res = await fetch(`${BACKEND_URL}/invitations/accept`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ tokenOrCode }),
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to accept invitation');
    }
    return res.json();
}
