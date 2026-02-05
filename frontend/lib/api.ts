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

export async function createTeam(userId: string, name: string) {
    const headers = await getHeaders();
    const res = await fetch(`${BACKEND_URL}/teams`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name }), // UserId inferred from token
    });
    if (!res.ok) {
        const text = await res.text();
        console.error('Failed to create team:', res.status, text);
        throw new Error(`Failed to create team: ${res.status} ${text}`);
    }
    return res.json();
}

export async function getUserTeams(userId: string) {
    const headers = await getHeaders();
    const res = await fetch(`${BACKEND_URL}/teams`, { headers }); // UserId inferred from token
    if (!res.ok) throw new Error('Failed to fetch teams');
    return res.json();
}

export async function createProject(teamId: string, name: string, userId: string, description: string = '') {
    const headers = await getHeaders();
    const res = await fetch(`${BACKEND_URL}/projects`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ teamId, name, description }), // userId now from auth token
    });
    if (!res.ok) {
        const text = await res.text();
        console.error('Failed to create project:', res.status, text);
        throw new Error(`Failed to create project: ${res.status} ${text}`);
    }
    return res.json();
}

export async function getTeamProjects(teamId: string) {
    const headers = await getHeaders();
    const res = await fetch(`${BACKEND_URL}/projects?teamId=${teamId}`, { headers });
    if (!res.ok) throw new Error('Failed to fetch projects');
    return res.json();
}

export async function getProject(projectId: string) {
    const headers = await getHeaders();
    const res = await fetch(`${BACKEND_URL}/projects/${projectId}`, { headers });
    if (!res.ok) throw new Error('Failed to fetch project');
    return res.json();
}

export async function updateProject(projectId: string, data: any, userId: string) {
    const headers = await getHeaders();

    // Legacy support: send x-user-id if backend still needs it (until full migration)
    headers['x-user-id'] = userId;

    const res = await fetch(`${BACKEND_URL}/projects/${projectId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const text = await res.text();
        console.error('Failed to update project:', res.status, text);
        throw new Error(`Failed to update project: ${res.status} ${text}`);
    }
    return res.json();
}

export async function inviteMember(teamId: string, email: string) {
    const headers = await getHeaders();
    const res = await fetch(`${BACKEND_URL}/teams/${teamId}/members`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ email }),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to invite member');
    }
    return res.json();
}

export async function createTask(data: { title: string; projectId: string; description?: string; priority?: string; assigneeId?: string; dueDate?: Date; labels?: string[]; isBlocked?: boolean; blockedReason?: string }, userId: string) {
    const headers = await getHeaders();
    headers['x-user-id'] = userId;

    const res = await fetch(`${BACKEND_URL}/tasks`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create task');
    return res.json();
}

export async function getProjectTasks(projectId: string) {
    const headers = await getHeaders();
    const res = await fetch(`${BACKEND_URL}/tasks?projectId=${projectId}`, { headers });
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return res.json();
}

export async function updateTask(id: string, data: { status?: string; priority?: string; assigneeId?: string; title?: string; description?: string; dueDate?: Date | null; labels?: string[]; isBlocked?: boolean; blockedReason?: string | null }, userId: string, projectId: string) {
    const headers = await getHeaders();
    headers['x-user-id'] = userId;

    const res = await fetch(`${BACKEND_URL}/tasks/${id}?projectId=${projectId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update task');
    return res.json();
}

export async function deleteTask(id: string, projectId: string, userId: string) {
    const headers = await getHeaders();
    headers['x-user-id'] = userId;

    const res = await fetch(`${BACKEND_URL}/tasks/${id}?projectId=${projectId}`, {
        method: 'DELETE',
        headers,
    });
    if (!res.ok) throw new Error('Failed to delete task');
    return res.json();
}

export async function getProjectMembers(projectId: string) {
    const headers = await getHeaders();
    const res = await fetch(`${BACKEND_URL}/projects/${projectId}/members`, { headers });
    if (!res.ok) throw new Error('Failed to fetch members');
    return res.json();
}

export async function inviteProjectMember(projectId: string, email: string, role: string = 'VIEWER', userId: string) {
    const headers = await getHeaders();
    headers['x-user-id'] = userId;

    const res = await fetch(`${BACKEND_URL}/projects/${projectId}/members`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ email, role }),
    });
    if (!res.ok) throw new Error('Failed to invite member');
    return res.json();
}

export async function updateMemberRole(projectId: string, userId: string, role: string, requestorId: string) {
    const headers = await getHeaders();
    headers['x-user-id'] = requestorId;

    const res = await fetch(`${BACKEND_URL}/projects/${projectId}/members/${userId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ role }),
    });
    if (!res.ok) throw new Error('Failed to update role');
    return res.json();
}

export async function removeMember(projectId: string, userId: string, requestorId: string) {
    const headers = await getHeaders();
    headers['x-user-id'] = requestorId;

    const res = await fetch(`${BACKEND_URL}/projects/${projectId}/members/${userId}`, {
        method: 'DELETE',
        headers,
    });
    if (!res.ok) throw new Error('Failed to remove member');
    return res.json();
}

export async function getProjectMembership(projectId: string, userId: string) {
    const headers = await getHeaders();
    const res = await fetch(`${BACKEND_URL}/projects/${projectId}/membership?userId=${userId}`, { headers });
    if (!res.ok) return null;
    const text = await res.text();
    return text ? JSON.parse(text) : null;
}

export async function createSnippet(data: { userId: string; projectId: string; title: string; code: string; language: string; category?: string; description?: string }) {
    const headers = await getHeaders();
    headers['x-user-id'] = data.userId;

    const res = await fetch(`${BACKEND_URL}/snippets`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create snippet');
    return res.json();
}

export async function getProjectSnippets(projectId: string) {
    const headers = await getHeaders();
    const res = await fetch(`${BACKEND_URL}/snippets?projectId=${projectId}`, { headers });
    if (!res.ok) throw new Error('Failed to fetch snippets');
    return res.json();
}

export async function deleteSnippet(id: string, projectId: string, userId: string) {
    const headers = await getHeaders();
    headers['x-user-id'] = userId;

    const res = await fetch(`${BACKEND_URL}/snippets/${id}?projectId=${projectId}`, {
        method: 'DELETE',
        headers
    });
    if (!res.ok) throw new Error('Failed to delete snippet');
    return res.json();
}

export async function askAI(message: string, context: any = {}) {
    const headers = await getHeaders();
    const res = await fetch(`${BACKEND_URL}/ai/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message, context }),
    });
    if (!res.ok) throw new Error('Failed to ask AI');
    return res.json();
}

export async function generateAiTasks(description: string) {
    const headers = await getHeaders();
    const res = await fetch(`${BACKEND_URL}/ai/generate-tasks`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ description }),
    });
    if (!res.ok) throw new Error('Failed to generate tasks');
    return res.json();
}

export async function summarizeProject(projectId: string) {
    const headers = await getHeaders();
    const res = await fetch(`${BACKEND_URL}/ai/summarize-project`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ projectId }),
    });
    return res.json();
}

export async function analyzeScope(projectId: string) {
    const headers = await getHeaders();
    const res = await fetch(`${BACKEND_URL}/ai/analyze-scope`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ projectId }),
    });
    return res.json();
}

export async function explainSnippet(code: string, language: string) {
    const headers = await getHeaders();
    const res = await fetch(`${BACKEND_URL}/ai/explain-snippet`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ code, language }),
    });
    return res.json();
}

export async function createDecision(projectId: string, data: { title: string; content: string; taskId?: string }, userId: string) {
    const headers = await getHeaders();
    headers['x-user-id'] = userId;

    const res = await fetch(`${BACKEND_URL}/projects/${projectId}/decisions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const text = await res.text();
        console.error('Failed to create decision:', res.status, text);
        throw new Error(`Failed to create decision: ${res.status} ${text}`);
    }
    return res.json();
}

export async function getProjectDecisionsWithUser(projectId: string, userId: string) {
    const headers = await getHeaders();
    headers['x-user-id'] = userId;

    const res = await fetch(`${BACKEND_URL}/projects/${projectId}/decisions`, { headers });
    if (!res.ok) {
        if (res.status === 404) return [];
        const text = await res.text();
        console.error(`Failed to fetch decisions. Status: ${res.status} ${res.statusText}. Response: ${text}`);
        throw new Error(`Failed to fetch decisions: ${res.status} ${res.statusText}`);
    }
    return res.json();
}

export async function addDecisionNote(decisionId: string, content: string, userId: string, projectId: string) {
    const headers = await getHeaders();
    headers['x-user-id'] = userId;

    const res = await fetch(`${BACKEND_URL}/decisions/${decisionId}/notes?projectId=${projectId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content }),
    });
    if (!res.ok) {
        const text = await res.text();
        console.error('Failed to add note:', res.status, text);
        throw new Error(`Failed to add note: ${res.status} ${text}`);
    }
    return res.json();
}

export async function getProjectBurndown(projectId: string) {
    const headers = await getHeaders();
    const res = await fetch(`${BACKEND_URL}/projects/${projectId}/analytics/burndown`, { headers });
    if (!res.ok) throw new Error('Failed to fetch burndown data');
    return res.json();
}
