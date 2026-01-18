import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class TeamsService {
    constructor(private prisma: PrismaService) { }

    async createTeam(userId: string, name: string) {
        console.log(`Creating team '${name}' for user '${userId}'`);
        try {
            // Transactional: Create Team -> Add Creator as Owner
            return await this.prisma.$transaction(async (tx) => {
                console.log('Starting transaction...');
                const team = await tx.team.create({
                    data: { name },
                });
                console.log('Team created:', team.id);

                await tx.teamMember.create({
                    data: {
                        userId,
                        teamId: team.id,
                        role: 'OWNER',
                    },
                });
                console.log('Team member added');

                return team;
            });
        } catch (error) {
            console.error('Error creating team:', error);
            throw error;
        }
    }

    async getUserTeams(userId: string) {
        return this.prisma.team.findMany({
            where: {
                members: {
                    some: {
                        userId,
                    },
                },
            },
            include: {
                members: true,
            },
        });
    }

    async inviteMember(teamId: string, email: string) {
        console.log(`Inviting ${email} to team ${teamId}`);

        const user = await this.prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            console.log('User not found');
            throw new NotFoundException('User not found');
        }

        const existingMember = await this.prisma.teamMember.findUnique({
            where: {
                userId_teamId: {
                    userId: user.id,
                    teamId,
                },
            },
        });

        if (existingMember) {
            console.log('User already in team');
            throw new ConflictException('User is already a member of this team');
        }

        try {
            const member = await this.prisma.teamMember.create({
                data: {
                    userId: user.id,
                    teamId,
                    role: 'MEMBER',
                },
            });
            console.log('Member created:', member);
            return member;
        } catch (error) {
            console.error('Error adding member:', error);
            throw error;
        }
    }
}
