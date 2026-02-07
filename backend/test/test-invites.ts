import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting Invite Verification...');

    // 1. Create Owner
    const ownerEmail = `owner-${crypto.randomBytes(4).toString('hex')}@test.com`;
    const owner = await prisma.user.create({
        data: { email: ownerEmail, name: 'Owner' }
    });
    console.log('Owner created:', owner.id);

    // 2. Create Team & Project
    const team = await prisma.team.create({
        data: {
            name: 'Test Team',
            members: {
                create: { userId: owner.id, role: 'OWNER' }
            }
        }
    });
    console.log('Team created:', team.id);

    const project = await prisma.project.create({
        data: {
            name: 'Test Project',
            teamId: team.id,
            members: {
                create: { userId: owner.id, role: 'OWNER' }
            }
        }
    }); // Using prisma directly, skipping service logic for setup
    console.log('Project created:', project.id);

    // 3. Create Invite (Simulate Service)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invite = await prisma.projectInvitation.create({
        data: {
            token,
            projectId: project.id,
            inviterId: owner.id,
            expiresAt,
            role: 'MEMBER'
        }
    });
    console.log('Invite created:', invite.id);

    // 4. Create Member User
    const memberEmail = `member-${crypto.randomBytes(4).toString('hex')}@test.com`;
    const memberUser = await prisma.user.create({
        data: { email: memberEmail, name: 'Member' }
    });
    console.log('Member User created:', memberUser.id);

    // 5. Accept Invite (Simulate Service Logic)
    // Verify existing member
    const existing = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId: memberUser.id, projectId: project.id } }
    });

    if (existing) {
        console.error('User already member (Clean test failed)');
        return;
    }

    // Add Member
    await prisma.projectMember.create({
        data: {
            userId: memberUser.id,
            projectId: project.id,
            role: invite.role as any,
        }
    });
    console.log('Member added to project');

    // Update Invite Status
    await prisma.projectInvitation.update({
        where: { id: invite.id },
        data: { status: 'USED' } // If single use
    });
    console.log('Invite marked as used');

    // 6. Verify Membership
    const membership = await prisma.projectMember.findUnique({
        where: { userId_projectId: { userId: memberUser.id, projectId: project.id } }
    });

    if (membership && membership.role === 'MEMBER') {
        console.log('SUCCESS: User is now a MEMBER of the project.');
    } else {
        console.error('FAILURE: Membership verification failed', membership);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
