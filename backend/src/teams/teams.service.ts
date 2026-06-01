import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ChatGateway } from '../chat/chat.gateway';

@Injectable()
export class TeamsService {
    constructor(
        private prisma: PrismaService,
        private chatGateway: ChatGateway
    ) { }

    async createTeam(userId: string, name: string) {
        console.log(`Creating team '${name}' for user '${userId}'`);
        try {
            const userExists = await this.prisma.user.findUnique({ where: { id: userId } });
            console.log(`User ${userId} exists in DB: ${!!userExists}`);

            if (!userExists) {
                // Fallback: This shouldn't happen if Guard works, but just in case
                throw new NotFoundException(`User ${userId} does not exist in the database.`);
            }

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
                members: {
                    include: {
                        user: true
                    }
                },
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

            // Realtime notification logic
            try {
                const team = await this.prisma.team.findUnique({
                    where: { id: teamId },
                    select: { name: true }
                });
                const teamName = team?.name || 'the team';
                const memberName = user.name || user.email || 'New Member';

                // Find other members
                const otherMembers = await this.prisma.teamMember.findMany({
                    where: {
                        teamId,
                        userId: { not: user.id }
                    },
                    select: { userId: true }
                });

                // Create database notifications and emit
                for (const other of otherMembers) {
                    const notification = await this.prisma.notification.create({
                        data: {
                            userId: other.userId,
                            title: 'New Team Member Joined',
                            message: `${memberName} has joined team "${teamName}"`,
                            type: 'MEMBER_JOINED',
                        }
                    });
                    this.chatGateway.server.to(other.userId).emit('notification', notification);
                }

                // Emit memberJoined event to team room
                this.chatGateway.server.to(teamId).emit('memberJoined', {
                    teamId,
                    userId: user.id,
                    memberName
                });
            } catch (err) {
                console.error('Failed to send joining notifications:', err);
            }

            return member;
        } catch (error) {
            console.error('Error adding member:', error);
            throw error;
        }
    }

    async deleteTeam(teamId: string, userId: string) {
        // Check if user is OWNER
        const member = await this.prisma.teamMember.findUnique({
            where: { userId_teamId: { userId, teamId } }
        });

        if (!member || member.role !== 'OWNER') {
            throw new NotFoundException('Only Team Owners can delete the team');
        }

        return this.prisma.team.delete({
            where: { id: teamId }
        });
    }

    async removeMember(teamId: string, userId: string, memberIdToRemove: string) {
        // Check if requester is OWNER
        const requester = await this.prisma.teamMember.findUnique({
            where: { userId_teamId: { userId, teamId } }
        });

        if (!requester || requester.role !== 'OWNER') {
            throw new NotFoundException('Only Team Owners can remove members');
        }

        // Get member to remove to verify they exist and check logic
        const member = await this.prisma.teamMember.findUnique({
            where: { id: memberIdToRemove }
        });

        if (!member || member.teamId !== teamId) {
            throw new NotFoundException('Member not found in this team');
        }

        const deletedMember = await this.prisma.teamMember.delete({
            where: { id: memberIdToRemove }
        });

        // Emit memberRemoved event so lists refresh instantly in real-time
        try {
            this.chatGateway.server.to(teamId).emit('memberRemoved', {
                teamId,
                memberId: memberIdToRemove,
                userId: member.userId
            });
        } catch (err) {
            console.error('Failed to emit memberRemoved socket event:', err);
        }

        return deletedMember;
    }

    async updateMemberRole(teamId: string, userId: string, memberIdToUpdate: string, role: string) {
        // Only OWNER can promote/demote
        const requester = await this.prisma.teamMember.findUnique({
            where: { userId_teamId: { userId, teamId } }
        });

        if (!requester || requester.role !== 'OWNER') {
            throw new ForbiddenException('Only Team Owners can manage member roles');
        }

        // Validate role values
        const allowedRoles = ['OWNER', 'LEADER', 'MEMBER'];
        if (!allowedRoles.includes(role)) {
            throw new BadRequestException('Invalid role. Allowed roles are: OWNER, LEADER, MEMBER');
        }

        return this.prisma.teamMember.update({
            where: { id: memberIdToUpdate },
            data: { role }
        });
    }
}
