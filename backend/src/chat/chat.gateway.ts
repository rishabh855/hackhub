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
        console.log(`Client ${client.id} joined team ${teamId}`);
        return { event: 'joined', data: teamId };
    }

    @SubscribeMessage('sendMessage')
    async handleSendMessage(
        @MessageBody() payload: { teamId: string; senderId: string; content: string },
    ) {
        const message = await this.chatService.saveMessage(
            payload.teamId,
            payload.senderId,
            payload.content,
        );
        this.server.to(payload.teamId).emit('receiveMessage', message);
        return message;
    }

    @SubscribeMessage('getHistory')
    async handleGetHistory(@MessageBody() teamId: string) {
        return this.chatService.getRecentMessages(teamId);
    }
}
