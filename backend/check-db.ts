import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log('--- USERS IN DB ---');
  console.dir(users, { depth: null });

  const teamMembers = await prisma.teamMember.findMany({
    include: {
      user: true,
      team: true,
    }
  });
  console.log('\n--- TEAM MEMBERS IN DB ---');
  console.dir(teamMembers, { depth: null });
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
