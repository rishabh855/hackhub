import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({
    cors: {
        origin: '*', // For development
    },
})
export class ChatGateway {
    @WebSocketServer()
    server: Server;

    constructor(private readonly chatService: ChatService) { }

    @SubscribeMessage('joinTeam')
    handleJoinTeam(@MessageBody() teamId: string, @ConnectedSocket() client: Socket) {
        client.join(teamId);
        // console.log(`Client ${client.id} joined team ${teamId}`);
        return { event: 'joined', data: teamId };
    }

    @SubscribeMessage('joinProject')
    handleJoinProject(@MessageBody() projectId: string, @ConnectedSocket() client: Socket) {
        client.join(projectId); // Join a specific room for the project
        // console.log(`Client ${client.id} joined project ${projectId}`);
        return { event: 'joinedProject', data: projectId };
    }

    @SubscribeMessage('sendMessage')
    async handleSendMessage(
        @MessageBody() payload: { teamId: string; senderId: string; content: string; projectId?: string },
    ) {
        const message = await this.chatService.saveMessage(
            payload.teamId,
            payload.senderId,
            payload.content,
            payload.projectId,
        );
        // If it's a project message, emit to Project Room
        if (payload.projectId) {
            this.server.to(payload.projectId).emit('receiveMessage', message);
        } else {
            // Otherwise emit to Team Room
            this.server.to(payload.teamId).emit('receiveMessage', message);
        }
        return message;
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
