async function test() {
    const userId = 'dev-user-id-123'; // Hardcoded dev ID from auth.ts
    const baseUrl = 'http://localhost:4000';

    console.log(`Checking teams for user ${userId}...`);
    try {
        const res = await fetch(`${baseUrl}/teams?userId=${userId}`);
        if (res.ok) {
            const teams = await res.json();
            console.log('Teams:', JSON.stringify(teams, null, 2));
        } else {
            console.log('Failed to fetch teams:', res.status, res.statusText);
            const text = await res.text();
            console.log('Response:', text);
        }
    } catch (e) {
        console.error('Error fetching teams (server might be down):', e.message);
    }

    // Attempt creation
    console.log(`\nAttempting to create team...`);
    try {
        const res = await fetch(`${baseUrl}/teams`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, name: 'Test Team Script ' + Date.now() })
        });
        if (res.ok) {
            const team = await res.json();
            console.log('Team created:', JSON.stringify(team, null, 2));
        } else {
            console.log('Failed to create team:', res.status, res.statusText);
            const text = await res.text();
            console.log('Response:', text);
        }
    } catch (e) {
        console.error('Error creating team:', e.message);
    }
}

test();
