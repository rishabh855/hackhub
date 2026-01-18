const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = 'dummy@example.com';
    const upsertUser = await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
            email,
            name: 'Dummy User',
            image: 'https://github.com/identicons/dummy.png',
        },
    });
    console.log('Dummy user created:', upsertUser);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
