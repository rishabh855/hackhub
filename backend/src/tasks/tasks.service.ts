import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ChatGateway } from '../chat/chat.gateway';
import {
    canMoveTask,
    canAssignTask,
    canApproveTask,
    canViewTask,
    canEditTask
} from '../auth/permissions';

@Injectable()
export class TasksService {
    constructor(
        private prisma: PrismaService,
        private chatGateway: ChatGateway
    ) { }

    async getUserRole(projectId: string, userId: string): Promise<string> {
        const membership = await this.prisma.projectMember.findUnique({
            where: {
                userId_projectId: {
                    userId: userId,
                    projectId: projectId,
                },
            },
        });

        if (membership) {
            return membership.role;
        }

        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
            select: { teamId: true }
        });

        if (project) {
            const teamMember = await this.prisma.teamMember.findUnique({
                where: {
                    userId_teamId: {
                        userId: userId,
                        teamId: project.teamId
                    }
                }
            });

            if (teamMember) {
                if (teamMember.role === 'OWNER') return 'OWNER';
                if (teamMember.role === 'LEADER') return 'LEADER';
                return 'MEMBER';
            }
        }

        throw new ForbiddenException('You are not a member of this project');
    }

    async createTask(
        userId: string,
        data: {
            title: string;
            projectId: string;
            description?: string;
            priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
            assigneeIds?: string[];
            dueDate?: Date;
            labels?: string[];
            isBlocked?: boolean;
            blockedReason?: string;
        }
    ) {
        const role = await this.getUserRole(data.projectId, userId);
        if (!canAssignTask(role)) {
            throw new ForbiddenException('Only Owners and Leaders can create/assign tasks');
        }

        // Get max position to append new task to the end
        const maxTask = await this.prisma.task.findFirst({
            where: { projectId: data.projectId, status: 'TODO', deletedAt: null },
            orderBy: { position: 'desc' },
        });
        const position = maxTask ? maxTask.position + 1000 : 1000;

        // Resolve assignees
        let finalAssigneeIds: string[] = [];
        if (data.assigneeIds && data.assigneeIds.includes('ALL')) {
            const project = await this.prisma.project.findUnique({
                where: { id: data.projectId },
                select: { teamId: true }
            });
            if (project) {
                const teamMembers = await this.prisma.teamMember.findMany({
                    where: { teamId: project.teamId },
                    select: { userId: true }
                });
                finalAssigneeIds = teamMembers.map(m => m.userId);
            }
        } else if (data.assigneeIds) {
            finalAssigneeIds = data.assigneeIds;
        }

        const task = await this.prisma.task.create({
            data: {
                title: data.title,
                projectId: data.projectId,
                description: data.description,
                priority: data.priority || 'MEDIUM',
                status: 'TODO',
                dueDate: data.dueDate ? new Date(data.dueDate) : null,
                labels: data.labels || [],
                isBlocked: data.isBlocked || false,
                blockedReason: data.blockedReason || null,
                position,
                assigneeId: finalAssigneeIds[0] || null, // Keep for backward compatibility
                assignees: {
                    create: finalAssigneeIds.map(uid => ({
                        userId: uid
                    }))
                }
            },
            include: {
                assignee: true,
                assignees: {
                    include: {
                        user: true
                    }
                }
            }
        });

        // Log activity
        await this.prisma.taskActivity.create({
            data: {
                taskId: task.id,
                userId,
                action: 'CREATED',
                newStatus: 'TODO',
                metadata: {
                    title: task.title,
                    priority: task.priority,
                    assigneeCount: finalAssigneeIds.length
                }
            }
        });

        // Send notifications to assignees
        for (const assigneeId of finalAssigneeIds) {
            if (assigneeId !== userId) {
                const notification = await this.prisma.notification.create({
                    data: {
                        userId: assigneeId,
                        title: 'New Task Assigned',
                        message: `You have been assigned to the task: "${task.title}"`,
                        type: 'TASK_ASSIGNED',
                    }
                });
                // Emit WS to individual user room
                this.chatGateway.server.to(assigneeId).emit('notification', notification);
            }
        }

        // Broadcast to project room
        this.chatGateway.server.to(data.projectId).emit('taskCreated', task);

        return task;
    }

    async getProjectTasks(projectId: string, userId: string) {
        const role = await this.getUserRole(projectId, userId);

        const whereClause: any = {
            projectId,
            deletedAt: null,
        };

        if (role === 'MEMBER') {
            whereClause.assignees = {
                some: {
                    userId,
                },
            };
        }

        return this.prisma.task.findMany({
            where: whereClause,
            include: {
                assignee: true,
                assignees: {
                    include: {
                        user: true
                    }
                },
                activeBy: true,
                reviewedBy: true,
                completedBy: true
            },
            orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
        });
    }

    async updateTask(
        id: string,
        userId: string,
        data: {
            title?: string;
            description?: string;
            status?: string;
            priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
            assigneeIds?: string[];
            dueDate?: Date | null;
            labels?: string[];
            isBlocked?: boolean;
            blockedReason?: string | null;
            position?: number;
        }
    ) {
        const task = await this.prisma.task.findUnique({
            where: { id },
            include: {
                assignees: true,
                project: true
            }
        });
        if (!task || task.deletedAt) {
            throw new NotFoundException('Task not found');
        }

        const role = await this.getUserRole(task.projectId, userId);
        const assigneeUserIds = task.assignees.map(a => a.userId);

        // Security check
        if (!canEditTask(role, assigneeUserIds, userId)) {
            throw new ForbiddenException('You do not have permissions to edit this task');
        }

        const updateData: any = {};
        const activityLogs: any[] = [];
        const notifications: any[] = [];

        // Check workflow transitions if status is changing
        if (data.status && data.status !== task.status) {
            if (!canMoveTask(role, task.status, data.status)) {
                throw new ForbiddenException(`You are not allowed to move task from ${task.status} to ${data.status}`);
            }

            updateData.status = data.status;

            // Tracking active contributors and review state metadata
            if (data.status === 'IN_PROGRESS') {
                updateData.activeById = userId;
                updateData.startedAt = new Date();
            } else if (data.status === 'REVIEW') {
                updateData.reviewedById = userId;
                // If it transitions to REVIEW, create notifications for owners/leaders
                const teamMembers = await this.prisma.teamMember.findMany({
                    where: {
                        teamId: task.project.teamId,
                        role: { in: ['OWNER', 'LEADER'] }
                    },
                    select: { userId: true }
                });

                for (const member of teamMembers) {
                    if (member.userId !== userId) {
                        notifications.push({
                            userId: member.userId,
                            title: 'Review Requested',
                            message: `Task "${task.title}" is ready for review.`,
                            type: 'REVIEW_REQUESTED',
                        });
                    }
                }
            } else if (data.status === 'DONE') {
                updateData.completedById = userId;
                updateData.completedAt = new Date();
                updateData.activeById = null; // Clear active contributor

                // If moving to DONE, notify all assignees
                for (const assigneeId of assigneeUserIds) {
                    if (assigneeId !== userId) {
                        notifications.push({
                            userId: assigneeId,
                            title: 'Task Approved',
                            message: `Task "${task.title}" has been approved and marked as DONE.`,
                            type: 'TASK_APPROVED',
                        });
                    }
                }
            } else if (data.status === 'TODO') {
                updateData.activeById = null;
                updateData.startedAt = null;
            }

            activityLogs.push({
                action: 'STATUS_CHANGED',
                oldStatus: task.status,
                newStatus: data.status,
                metadata: {
                    changedBy: userId,
                }
            });
        }

        // Update other fields if provided
        if (data.title !== undefined) updateData.title = data.title;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.priority !== undefined) updateData.priority = data.priority;
        if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
        if (data.labels !== undefined) updateData.labels = data.labels;
        if (data.isBlocked !== undefined) updateData.isBlocked = data.isBlocked;
        if (data.blockedReason !== undefined) updateData.blockedReason = data.blockedReason;
        if (data.position !== undefined) updateData.position = data.position;

        // Perform transactional update
        const updatedTask = await this.prisma.$transaction(async (tx) => {
            // Assignees update
            if (data.assigneeIds) {
                if (!canAssignTask(role)) {
                    throw new ForbiddenException('Only Owners and Leaders can assign tasks');
                }

                let finalAssigneeIds: string[] = [];
                if (data.assigneeIds.includes('ALL')) {
                    const teamMembers = await tx.teamMember.findMany({
                        where: { teamId: task.project.teamId },
                        select: { userId: true }
                    });
                    finalAssigneeIds = teamMembers.map(m => m.userId);
                } else {
                    finalAssigneeIds = data.assigneeIds;
                }

                // Delete old assignees
                await tx.taskAssignee.deleteMany({
                    where: { taskId: id }
                });

                // Create new assignees
                if (finalAssigneeIds.length > 0) {
                    await tx.taskAssignee.createMany({
                        data: finalAssigneeIds.map(uid => ({
                            userId: uid,
                            taskId: id
                        }))
                    });
                    updateData.assigneeId = finalAssigneeIds[0];
                } else {
                    updateData.assigneeId = null;
                }

                // Log assignment activity
                activityLogs.push({
                    action: 'ASSIGNED',
                    metadata: {
                        assignedUsers: finalAssigneeIds,
                    }
                });

                // Create notifications for new assignees
                const newAssignees = finalAssigneeIds.filter(uid => !assigneeUserIds.includes(uid));
                for (const assigneeId of newAssignees) {
                    if (assigneeId !== userId) {
                        notifications.push({
                            userId: assigneeId,
                            title: 'New Task Assigned',
                            message: `You have been assigned to the task: "${task.title}"`,
                            type: 'TASK_ASSIGNED',
                        });
                    }
                }
            }

            // Update Task
            const t = await tx.task.update({
                where: { id },
                data: updateData,
                include: {
                    assignee: true,
                    assignees: {
                        include: {
                            user: true
                        }
                    },
                    activeBy: true,
                    reviewedBy: true,
                    completedBy: true
                }
            });

            // Write activity logs
            for (const log of activityLogs) {
                await tx.taskActivity.create({
                    data: {
                        taskId: id,
                        userId,
                        action: log.action,
                        oldStatus: log.oldStatus || null,
                        newStatus: log.newStatus || null,
                        metadata: log.metadata || null
                    }
                });
            }

            // Write notifications and trigger real-time
            for (const notif of notifications) {
                const createdNotif = await tx.notification.create({
                    data: notif
                });
                this.chatGateway.server.to(notif.userId).emit('notification', createdNotif);
            }

            return t;
        });

        // Broadcast task update in project room
        this.chatGateway.server.to(task.projectId).emit('taskUpdated', updatedTask);

        return updatedTask;
    }

    async submitReview(id: string, userId: string) {
        return this.updateTask(id, userId, { status: 'REVIEW' });
    }

    async approveTask(id: string, userId: string) {
        return this.updateTask(id, userId, { status: 'DONE' });
    }

    async rejectTask(id: string, userId: string, reason: string) {
        const task = await this.prisma.task.findUnique({
            where: { id },
            include: { assignees: true }
        });
        if (!task || task.deletedAt) {
            throw new NotFoundException('Task not found');
        }

        const role = await this.getUserRole(task.projectId, userId);
        if (!canApproveTask(role)) {
            throw new ForbiddenException('Only Owners and Leaders can reject reviews');
        }

        const assigneeUserIds = task.assignees.map(a => a.userId);

        const updatedTask = await this.prisma.$transaction(async (tx) => {
            const t = await tx.task.update({
                where: { id },
                data: {
                    status: 'IN_PROGRESS',
                    reviewedById: null, // Clear review association
                },
                include: {
                    assignee: true,
                    assignees: {
                        include: {
                            user: true
                        }
                    },
                    activeBy: true,
                    reviewedBy: true,
                    completedBy: true
                }
            });

            // Write rejection activity log
            await tx.taskActivity.create({
                data: {
                    taskId: id,
                    userId,
                    action: 'REJECTED',
                    oldStatus: 'REVIEW',
                    newStatus: 'IN_PROGRESS',
                    metadata: {
                        reason,
                        rejectedBy: userId,
                    }
                }
            });

            // Notify assignees
            for (const assigneeId of assigneeUserIds) {
                if (assigneeId !== userId) {
                    const notification = await tx.notification.create({
                        data: {
                            userId: assigneeId,
                            title: 'Task Rejected',
                            message: `Task "${task.title}" has been rejected. Reason: ${reason}`,
                            type: 'TASK_REJECTED',
                        }
                    });
                    this.chatGateway.server.to(assigneeId).emit('notification', notification);
                }
            }

            return t;
        });

        // Broadcast to project room
        this.chatGateway.server.to(task.projectId).emit('taskUpdated', updatedTask);

        return updatedTask;
    }

    async deleteTask(id: string, userId: string) {
        const task = await this.prisma.task.findUnique({
            where: { id },
            include: { project: true }
        });

        if (!task || task.deletedAt) throw new NotFoundException('Task not found');

        const role = await this.getUserRole(task.projectId, userId);
        if (role !== 'OWNER' && role !== 'LEADER') {
            throw new ForbiddenException('Only Team Owners and Leaders can delete tasks');
        }

        const updatedTask = await this.prisma.task.update({
            where: { id },
            data: { deletedAt: new Date() }
        });

        // Log activity
        await this.prisma.taskActivity.create({
            data: {
                taskId: id,
                userId,
                action: 'DELETED',
                metadata: {
                    deletedBy: userId
                }
            }
        });

        // Broadcast soft delete in project room
        this.chatGateway.server.to(task.projectId).emit('taskDeleted', { id });

        return updatedTask;
    }

    async getUserNotifications(userId: string) {
        return this.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
    }

    async markNotificationAsRead(id: string, userId: string) {
        const notification = await this.prisma.notification.findUnique({
            where: { id }
        });
        if (!notification || notification.userId !== userId) {
            throw new NotFoundException('Notification not found');
        }

        return this.prisma.notification.update({
            where: { id },
            data: { isRead: true }
        });
    }

    async getTaskActivities(taskId: string) {
        return this.prisma.taskActivity.findMany({
            where: { taskId },
            include: { user: true },
            orderBy: { createdAt: 'desc' }
        });
    }
}
