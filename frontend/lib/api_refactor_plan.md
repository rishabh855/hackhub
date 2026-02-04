import { createClient } from '@/lib/supabase';

const BACKEND_URL = 'http://localhost:4000';

const getHeaders = async (multipart = false) => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = {};
    
    if (!multipart) {
        headers['Content-Type'] = 'application/json';
    }
    
    if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    return headers;
};

// ... rewrite functions ...
export async function createTeam(userId: string, name: string) {
    const headers = await getHeaders();
    const res = await fetch(`${BACKEND_URL}/teams`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name }),
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
    const res = await fetch(`${BACKEND_URL}/teams`, { headers });
    if (!res.ok) throw new Error('Failed to fetch teams');
    return res.json();
}

// ... other functions ...
export async function createProject(teamId: string, name: string, userId: string, description: string = '') {
    const headers = await getHeaders();
    const res = await fetch(`${BACKEND_URL}/projects`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ teamId, name, description }), // userId implicitly ignored by backend if we update backend logic
    });
    if (!res.ok) throw new Error('Failed to create project');
    return res.json();
}
// Note: I need to verify if "projects" endpoint on backend is updated to use AuthGuard? 
// Not yet. Only TeamsController is updated. 
// I should ONLY update createTeam and getUserTeams for now?
// Or I should update Backend ProjectsController too?
// The user user flow was "Login -> Teams -> Create Team".
// So createTeam is the blocker.
// But after that, they will likely fetch projects.
