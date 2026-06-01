import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.team.findMany({
    include: {
      members: {
        include: {
          user: true
        }
      }
    }
  });
  console.log('--- TEAMS WITH MEMBERS & USERS ---');
  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
