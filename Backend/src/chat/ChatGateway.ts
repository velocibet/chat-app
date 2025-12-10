import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { Socket } from 'socket.io';
import { joinDirectRoom, sendMessage, previousMessage } from './dto/chat.dto';

@WebSocketGateway({ cors: true })
export class ChatGateway {
  constructor(private readonly chatService: ChatService) {}

  @SubscribeMessage('joinDirectRoom')
  async handleJoinPrivateRoom(
    @MessageBody() payload : joinDirectRoom,
    @ConnectedSocket() client : Socket
  ) {
    const { userId1, userId2 } = payload;
    const roomName = [userId1, userId2].sort((a, b) => a - b).join('_');

    client.join(roomName);

    const checkStatus = await this.chatService.checkStatus(userId1, userId2, roomName);
    const messages = await this.chatService.getMessages(roomName);

    client.emit('previousMessage', messages);
    client.emit('joinedRoom', roomName);
  }

  @SubscribeMessage('sendMessage')
  async sendMessage(
    @MessageBody() payload : sendMessage,
    @ConnectedSocket() client : Socket
  ) {
    const { fromId, toId, content } = payload;
    const roomName = [fromId, toId].sort((a, b) => a - b).join('_');

    // DB 행 추가
    const message = await this.chatService.sendMessage(fromId, toId, content, roomName);

    // 새로운 메세지 emit
    client.to(roomName).emit('newMessage', message);
    client.emit('newMessage', message);
  }
}
