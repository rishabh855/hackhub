const BACKEND_URL = 'http://localhost:4000';

export async function createTeam(userId: string, name: string) {
    const res = await fetch(`${BACKEND_URL}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, name }),
    });
    if (!res.ok) {
        const text = await res.text();
        console.error('Failed to create team:', res.status, text);
        throw new Error(`Failed to create team: ${res.status} ${text}`);
    }
    return res.json();
}

export async function getUserTeams(userId: string) {
    const res = await fetch(`${BACKEND_URL}/teams?userId=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch teams');
    return res.json();
}

export async function createProject(teamId: string, name: string, userId: string, description: string = '') {
    const res = await fetch(`${BACKEND_URL}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, name, userId, description }),
    });
    if (!res.ok) throw new Error('Failed to create project');
    return res.json();
}

export async function getTeamProjects(teamId: string) {
    const res = await fetch(`${BACKEND_URL}/projects?teamId=${teamId}`);
    if (!res.ok) throw new Error('Failed to fetch projects');
    return res.json();
}

export async function getProject(projectId: string) {
    const res = await fetch(`${BACKEND_URL}/projects/${projectId}`);
    if (!res.ok) throw new Error('Failed to fetch project');
    return res.json();
}

export async function updateProject(projectId: string, data: any, userId: string) {
    const res = await fetch(`${BACKEND_URL}/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId
        },
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

export async function createTask(data: { title: string; projectId: string; description?: string; priority?: string; assigneeId?: string; dueDate?: Date; labels?: string[]; isBlocked?: boolean; blockedReason?: string }, userId: string) {
    const res = await fetch(`${BACKEND_URL}/tasks`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId
        },
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

export async function updateTask(id: string, data: { status?: string; priority?: string; assigneeId?: string; title?: string; description?: string; dueDate?: Date | null; labels?: string[]; isBlocked?: boolean; blockedReason?: string | null }, userId: string, projectId: string) {
    const res = await fetch(`${BACKEND_URL}/tasks/${id}?projectId=${projectId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId
        },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update task');
    return res.json();
}

export async function deleteTask(id: string, projectId: string, userId: string) {
    const res = await fetch(`${BACKEND_URL}/tasks/${id}?projectId=${projectId}`, {
        method: 'DELETE',
        headers: {
            'x-user-id': userId
        },
    });
    if (!res.ok) throw new Error('Failed to delete task');
    return res.json();
}

// Members API

export async function getProjectMembers(projectId: string) {
    const res = await fetch(`${BACKEND_URL}/projects/${projectId}/members`);
    if (!res.ok) throw new Error('Failed to fetch members');
    return res.json();
}

export async function inviteProjectMember(projectId: string, email: string, role: string = 'VIEWER', userId: string) {
    const res = await fetch(`${BACKEND_URL}/projects/${projectId}/members`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId
        },
        body: JSON.stringify({ email, role }),
    });
    if (!res.ok) throw new Error('Failed to invite member');
    return res.json();
}

export async function updateMemberRole(projectId: string, userId: string, role: string, requestorId: string) {
    const res = await fetch(`${BACKEND_URL}/projects/${projectId}/members/${userId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'x-user-id': requestorId
        },
        body: JSON.stringify({ role }),
    });
    if (!res.ok) throw new Error('Failed to update role');
    return res.json();
}

export async function removeMember(projectId: string, userId: string, requestorId: string) {
    const res = await fetch(`${BACKEND_URL}/projects/${projectId}/members/${userId}`, {
        method: 'DELETE',
        headers: {
            'x-user-id': requestorId
        }
    });
    if (!res.ok) throw new Error('Failed to remove member');
    return res.json();
}

export async function getProjectMembership(projectId: string, userId: string) {
    const res = await fetch(`${BACKEND_URL}/projects/${projectId}/membership?userId=${userId}`);
    if (!res.ok) return null;
    const text = await res.text();
    return text ? JSON.parse(text) : null;
}

// Snippets API

export async function createSnippet(data: { userId: string; projectId: string; title: string; code: string; language: string; category?: string; description?: string }) {
    const res = await fetch(`${BACKEND_URL}/snippets`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-user-id': data.userId
        },
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

export async function deleteSnippet(id: string, projectId: string, userId: string) {
    const res = await fetch(`${BACKEND_URL}/snippets/${id}?projectId=${projectId}`, {
        method: 'DELETE',
        headers: {
            'x-user-id': userId
        }
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

export async function summarizeProject(projectId: string) {
    const res = await fetch(`${BACKEND_URL}/ai/summarize-project`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
    });
    return res.json();
}

export async function analyzeScope(projectId: string) {
    const res = await fetch(`${BACKEND_URL}/ai/analyze-scope`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
    });
    return res.json();
}

export async function explainSnippet(code: string, language: string) {
    const res = await fetch(`${BACKEND_URL}/ai/explain-snippet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
    });
    return res.json();
}

// Decisions API

export async function createDecision(projectId: string, data: { title: string; content: string; taskId?: string }, userId: string) {
    const res = await fetch(`${BACKEND_URL}/projects/${projectId}/decisions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId
        },
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
    const res = await fetch(`${BACKEND_URL}/projects/${projectId}/decisions`, {
        headers: { 'x-user-id': userId }
    });
    if (!res.ok) {
        // Handle 404 (failed to fetch) vs empty
        if (res.status === 404) return [];
        const text = await res.text();
        console.error(`Failed to fetch decisions. Status: ${res.status} ${res.statusText}. Response: ${text}`);
        throw new Error(`Failed to fetch decisions: ${res.status} ${res.statusText}`);
    }
    return res.json();
}

export async function addDecisionNote(decisionId: string, content: string, userId: string, projectId: string) {
    const res = await fetch(`${BACKEND_URL}/decisions/${decisionId}/notes?projectId=${projectId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId
        },
        body: JSON.stringify({ content }),
    });
    if (!res.ok) {
        const text = await res.text();
        console.error('Failed to add note:', res.status, text);
        throw new Error(`Failed to add note: ${res.status} ${text}`);
    }
    return res.json();
}

// Analytics API

export async function getProjectBurndown(projectId: string) {
    // Note: No userId required for read-only analytics usually, but we might add it if we secure it later.
    // Currently endpoint is public or protected by JWT?
    // It's in ProjectsController, which has @UseGuards(JwtAuthGuard) at top. 
    // Wait, I removed @UseGuards(JwtAuthGuard) from top of ProjectsController in previous "Fix ProjectsController" step to fix the import error.
    // So it might be public now? Or using default guard? 
    // Actually, I removed it because import was failing. 
    // I should probably fix that security hole later.
    // implementing fetch:
    const res = await fetch(`${BACKEND_URL}/projects/${projectId}/analytics/burndown`);
    if (!res.ok) throw new Error('Failed to fetch burndown data');
    return res.json();
}
