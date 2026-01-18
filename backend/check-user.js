const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Checking for dev user...');
    let user = await prisma.user.findFirst({
        where: { email: 'dev@example.com' },
    });

    if (!user) {
        console.log('Creating dev user...');
        user = await prisma.user.create({
            data: {
                id: 'dev-user-id-123',
                email: 'dev@example.com',
                name: 'Dev User',
                image: 'https://github.com/shadcn.png'
            }
        });
        console.log('User created:', user);
    } else {
        console.log('User already exists:', user);
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
