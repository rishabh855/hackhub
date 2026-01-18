import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// Load .env manually
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    console.log(`Loading .env from ${envPath}`);
    const envConfig = fs.readFileSync(envPath).toString();
    envConfig.split('\n').forEach(line => {
        const [key, ...values] = line.split('=');
        if (key && values.length > 0) {
            const val = values.join('=').trim().replace(/^"|"$/g, '');
            process.env[key.trim()] = val;
        }
    });
}

const prisma = new PrismaClient();

const OLD_USER_ID = 'dev-user-id-123';
// ID obtained from user logs
const NEW_USER_ID = '114177359648593537583';
const NEW_USER_EMAIL = 'mypersonalspace.543@gmail.com';
const NEW_USER_NAME = 'whocares';

async function main() {
    console.log(`Migrating data from ${OLD_USER_ID} to ${NEW_USER_ID}...`);

    // 1. Ensure New User Exists
    let newUser = await prisma.user.findUnique({ where: { id: NEW_USER_ID } });
    if (!newUser) {
        console.log('Target user not found. Creating...');
        // Check if email already exists (might have different ID?)
        const existingEmail = await prisma.user.findUnique({ where: { email: NEW_USER_EMAIL } });
        if (existingEmail) {
            console.log(`WARNING: User with email ${NEW_USER_EMAIL} exists but has ID ${existingEmail.id}.`);
            // Update the ID to match the Google ID (dangerous if FKs exist, but here we assume we want to align with Google)
            // Actually, better to just update the migration target to whatever ID the DB has if the emails match.
            // But user said their session has ID 114177... so we must use that.
            console.log('Proceeding to use session ID.');
        }

        newUser = await prisma.user.create({
            data: {
                id: NEW_USER_ID,
                email: NEW_USER_EMAIL,
                name: NEW_USER_NAME,
                image: 'https://lh3.googleusercontent.com/a/ACg8ocKkE2m9GiNBg1fzVYhhEV6XYmp3VOcB4QQC-iI756bKzkTYtg=s96-c'
            }
        });
        console.log('User created.');
    } else {
        console.log('Target user exists.');
    }

    // 2. Migrate Data
    // We need to update foreign keys. Order matters.

    // Team Members
    const teamMembers = await prisma.teamMember.updateMany({
        where: { userId: OLD_USER_ID },
        data: { userId: NEW_USER_ID }
    });
    console.log(`Migrated ${teamMembers.count} team memberships.`);

    // Project Members
    const projectMembers = await prisma.projectMember.updateMany({
        where: { userId: OLD_USER_ID },
        data: { userId: NEW_USER_ID }
    });
    console.log(`Migrated ${projectMembers.count} project memberships.`);

    // Tasks (Assignee)
    const assignedTasks = await prisma.task.updateMany({
        where: { assigneeId: OLD_USER_ID },
        data: { assigneeId: NEW_USER_ID }
    });
    console.log(`Migrated ${assignedTasks.count} assigned tasks.`);

    // Snippets
    const snippets = await prisma.snippet.updateMany({
        where: { userId: OLD_USER_ID },
        data: { userId: NEW_USER_ID }
    });
    console.log(`Migrated ${snippets.count} snippets.`);

    // Sessions/Accounts (Optional, usually handled by auth)

    console.log('Migration complete.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
