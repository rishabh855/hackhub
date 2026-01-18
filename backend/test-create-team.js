// Native fetch in Node 18+

async function testCreateTeam() {
    console.log("Testing Team Creation...");
    try {
        const res = await fetch('http://localhost:4000/teams', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: 'dev-user-id-123',
                name: 'Script Test Team'
            })
        });

        console.log('Status:', res.status);
        if (!res.ok) {
            const text = await res.text();
            console.error('Error Body:', text);
        } else {
            const json = await res.json();
            console.log('Success:', json);
        }
    } catch (err) {
        console.error('Fetch Error:', err);
    }
}

testCreateTeam();
