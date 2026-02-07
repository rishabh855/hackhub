import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';

@WebSocketGateway({
    cors: {
        origin: '*', // For development
    },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    constructor(
        private readonly chatService: ChatService,
        private readonly jwtService: JwtService,
        private readonly prisma: PrismaService
    ) { }

    async handleConnection(client: Socket) {
        try {
            const token = client.handshake.auth.token || client.handshake.query.token;
            if (!token) throw new Error('No token provided');

            const payload = this.jwtService.verify(token);
            client.data.user = payload;
            console.log(`[ChatGateway] Client connected: ${client.id}, User: ${payload.sub || payload.userId || payload.email}`);
        } catch (err) {
            console.log(`[ChatGateway] Connection rejected: ${err.message}`);
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        console.log(`[ChatGateway] Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('joinTeam')
    handleJoinTeam(@MessageBody() teamId: string, @ConnectedSocket() client: Socket) {
        client.join(teamId);
        // console.log(`Client ${client.id} joined team ${teamId}`);
        return { event: 'joined', data: teamId };
    }

    @SubscribeMessage('joinProject')
    async handleJoinProject(@MessageBody() projectId: string, @ConnectedSocket() client: Socket) {
        // Verify Membership
        const userId = client.data.user?.sub || client.data.user?.userId;
        if (!userId) {
            return { error: 'Unauthorized' };
        }

        const isMember = await this.chatService.isProjectMember(userId, projectId);
        if (!isMember) {
            console.log(`[ChatGateway] Join refused for user ${userId} to project ${projectId}`);
            return { error: 'Forbidden: Not a member' };
        }

        client.join(projectId); // Join a specific room for the project
        console.log(`[ChatGateway] Client ${client.id} joined project ${projectId}`);
        return { event: 'joinedProject', data: projectId };
    }

    @SubscribeMessage('sendMessage')
    async handleSendMessage(
        @MessageBody() payload: { teamId: string; senderId: string; content: string; projectId?: string },
    ) {
        console.log('[ChatGateway] Received sendMessage:', payload);
        try {
            const message = await this.chatService.saveMessage(
                payload.teamId,
                payload.senderId,
                payload.content,
                payload.projectId,
            );
            console.log('[ChatGateway] Message saved:', message.id);

            // If it's a project message, emit to Project Room
            if (payload.projectId) {
                this.server.to(payload.projectId).emit('receiveMessage', message);
            } else {
                // Otherwise emit to Team Room
                this.server.to(payload.teamId).emit('receiveMessage', message);
            }
            return message;
        } catch (error) {
            console.error('[ChatGateway] Error saving message:', error);
            // Return error to client via Acknowledgement
            return { error: error.message || 'Unknown error' };
        }
    }

    @SubscribeMessage('getHistory')
    async handleGetHistory(@MessageBody() payload: { teamId: string; projectId?: string }) {
        // Support potentially passing just teamId string for backward compat if needed, 
        // but frontend should send object. 
        // Logic: if payload is string, it's just teamId.
        const teamId = typeof payload === 'string' ? payload : payload.teamId;
        const projectId = typeof payload === 'object' ? payload.projectId : undefined;

        return this.chatService.getRecentMessages(teamId, projectId);
    }
    @SubscribeMessage('pinMessage')
    async handlePinMessage(
        @MessageBody() payload: { teamId: string; messageId: string; isPinned: boolean },
    ) {
        const message = await this.chatService.pinMessage(payload.messageId, payload.isPinned);
        // Broadcast to all (including sender) so UI updates
        this.server.to(payload.teamId).emit('messagePinned', message);
        return message;
    }
}
