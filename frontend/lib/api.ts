const BACKEND_URL = 'http://localhost:4000';

export async function createTeam(userId: string, name: string) {
    const res = await fetch(`${BACKEND_URL}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, name }),
    });
    if (!res.ok) throw new Error('Failed to create team');
    return res.json();
}

export async function getUserTeams(userId: string) {
    const res = await fetch(`${BACKEND_URL}/teams?userId=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch teams');
    return res.json();
}

export async function createProject(teamId: string, name: string, description: string = '') {
    const res = await fetch(`${BACKEND_URL}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, name, description }),
    });
    if (!res.ok) throw new Error('Failed to create project');
    return res.json();
}

export async function getTeamProjects(teamId: string) {
    const res = await fetch(`${BACKEND_URL}/projects?teamId=${teamId}`);
    if (!res.ok) throw new Error('Failed to fetch projects');
    return res.json();
}

export async function inviteMember(teamId: string, email: string) {
    const res = await fetch(`${BACKEND_URL}/teams/${teamId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to invite member');
    }
    return res.json();
}

// Tasks API

export async function createTask(data: { title: string; projectId: string; description?: string; priority?: string; assigneeId?: string }) {
    const res = await fetch(`${BACKEND_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create task');
    return res.json();
}

export async function getProjectTasks(projectId: string) {
    const res = await fetch(`${BACKEND_URL}/tasks?projectId=${projectId}`);
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return res.json();
}

export async function updateTask(id: string, data: { status?: string; priority?: string; assigneeId?: string; title?: string; description?: string }) {
    const res = await fetch(`${BACKEND_URL}/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update task');
    return res.json();
}

export async function deleteTask(id: string) {
    const res = await fetch(`${BACKEND_URL}/tasks/${id}`, {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete task');
    return res.json();
}

// Snippets API

export async function createSnippet(data: { userId: string; projectId: string; title: string; code: string; language: string; description?: string }) {
    const res = await fetch(`${BACKEND_URL}/snippets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create snippet');
    return res.json();
}

export async function getProjectSnippets(projectId: string) {
    const res = await fetch(`${BACKEND_URL}/snippets?projectId=${projectId}`);
    if (!res.ok) throw new Error('Failed to fetch snippets');
    return res.json();
}

export async function deleteSnippet(id: string) {
    const res = await fetch(`${BACKEND_URL}/snippets/${id}`, {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete snippet');
    return res.json();
}
// AI API

export async function askAI(message: string, context: any = {}) {
    const res = await fetch(`${BACKEND_URL}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, context }),
    });
    if (!res.ok) throw new Error('Failed to ask AI');
    return res.json();
}

export async function generateAiTasks(description: string) {
    const res = await fetch(`${BACKEND_URL}/ai/generate-tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
    });
    if (!res.ok) throw new Error('Failed to generate tasks');
    return res.json();
}

export async function explainSnippet(code: string, language: string) {
    const res = await fetch(`${BACKEND_URL}/ai/explain-snippet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
    });
    if (!res.ok) throw new Error('Failed to explain snippet');
    return res.json();
}
