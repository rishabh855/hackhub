import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as crypto from 'crypto';
import { ProjectRole } from '../projects/project-role.enum';
import { EmailService } from '../email/email.service';
import { ChatGateway } from '../chat/chat.gateway';

@Injectable()
@Injectable()
export class InvitationsService {
    constructor(
        private prisma: PrismaService,
        private emailService: EmailService,
        private chatGateway: ChatGateway
    ) { }

    async createInvite(userId: string, teamId: string, type: 'EMAIL' | 'LINK' | 'CODE', email?: string) {
        const team = await this.prisma.team.findUnique({ where: { id: teamId } });
        if (!team) throw new NotFoundException('Team not found');

        let token = crypto.randomBytes(32).toString('hex');
        let code: string | null = null;

        if (type === 'CODE') {
            code = 'JOB-' + crypto.randomBytes(2).toString('hex').toUpperCase();
        }

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const invitation = await this.prisma.teamInvitation.create({
            data: {
                token,
                code,
                email,
                teamId,
                inviterId: userId,
                expiresAt,
                role: 'MEMBER', // Team Role
            },
        });

        if (type === 'EMAIL' && email) {
            const inviter = await this.prisma.user.findUnique({ where: { id: userId } });
            const inviterName = inviter?.name || inviter?.email || 'Someone';
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
            const link = `${frontendUrl}/invite/accept?token=${token}`;

            await this.emailService.sendInvitationEmail(email, team.name, link, inviterName);
        }

        return invitation;
    }

    async getPendingInvites(teamId: string) {
        return this.prisma.teamInvitation.findMany({
            where: {
                teamId,
                status: 'PENDING',
            },
            include: { inviter: true }
        });
    }

    async acceptInvite(userId: string, tokenOrCode: string) {
        const invite = await this.prisma.teamInvitation.findFirst({
            where: {
                OR: [
                    { token: tokenOrCode },
                    { code: tokenOrCode }
                ],
                status: 'PENDING',
            },
            include: { team: true }
        });

        if (!invite) {
            throw new NotFoundException('Invalid or expired invitation');
        }

        if (invite.expiresAt < new Date()) {
            await this.prisma.teamInvitation.update({
                where: { id: invite.id },
                data: { status: 'EXPIRED' }
            });
            throw new BadRequestException('Invitation has expired');
        }

        if (invite.email) {
            const user = await this.prisma.user.findUnique({ where: { id: userId } });
            if (user && user.email !== invite.email) {
                throw new BadRequestException('This invitation is for a different email address');
            }
        }

        // Add User to Team
        const existingMember = await this.prisma.teamMember.findUnique({
            where: { userId_teamId: { userId, teamId: invite.teamId } }
        });

        if (existingMember) {
            return { message: 'Already a member', teamId: invite.teamId };
        }

        await this.prisma.$transaction([
            this.prisma.teamMember.create({
                data: {
                    userId,
                    teamId: invite.teamId,
                    role: invite.role as any,
                }
            }),
            this.prisma.teamInvitation.update({
                where: { id: invite.id },
                data: {
                    status: invite.email ? 'USED' : 'PENDING'
                }
            })
        ]);

        // Realtime notification logic
        try {
            const joiningUser = await this.prisma.user.findUnique({
                where: { id: userId },
                select: { name: true, email: true }
            });
            const memberName = joiningUser?.name || joiningUser?.email || 'New Member';
            const teamName = invite.team.name || 'the team';

            // Find other members
            const otherMembers = await this.prisma.teamMember.findMany({
                where: {
                    teamId: invite.teamId,
                    userId: { not: userId }
                },
                select: { userId: true }
            });

            // Create database notifications and emit
            for (const member of otherMembers) {
                const notification = await this.prisma.notification.create({
                    data: {
                        userId: member.userId,
                        title: 'New Team Member Joined',
                        message: `${memberName} has joined team "${teamName}"`,
                        type: 'MEMBER_JOINED',
                    }
                });
                this.chatGateway.server.to(member.userId).emit('notification', notification);
            }

            // Emit memberJoined event to team room so member lists refresh instantly
            this.chatGateway.server.to(invite.teamId).emit('memberJoined', {
                teamId: invite.teamId,
                userId,
                memberName
            });
        } catch (err) {
            console.error('Failed to send joining notifications:', err);
        }

        return { message: 'Joined team successfully', teamId: invite.teamId };
    }
}
