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

console.log('DATABASE_URL is:', process.env.DATABASE_URL ? 'DEFINED' : 'UNDEFINED');
if (process.env.DATABASE_URL) {
    console.log('URL starts with:', process.env.DATABASE_URL.substring(0, 15) + '...');
} else {
    console.error('DATABASE_URL is missing!');
    process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
    console.log('Checking for users in the database...');
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
        console.log(`- ID: ${user.id}, Email: ${user.email}, Name: ${user.name}`);
    });

    if (users.length > 0) {
        console.log('\nChecking for teams...');
        const teams = await prisma.team.findMany({
            include: { members: true }
        });
        console.log(`Found ${teams.length} teams.`);
        teams.forEach(team => {
            console.log(`- Team: ${team.name} (ID: ${team.id})`);
            team.members.forEach(m => {
                console.log(`  - Member: ${m.userId} (${m.role})`);
            });
        });
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
