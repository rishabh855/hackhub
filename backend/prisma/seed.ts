import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const devUser = await prisma.user.upsert({
        where: { email: 'dev@example.com' },
        update: {},
        create: {
            id: 'dev-user-id-123',
            email: 'dev@example.com',
            name: 'Dev User',
            image: 'https://github.com/shadcn.png'
        },
    })
    console.log({ devUser })
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
