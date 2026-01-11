import { WebSocketServer, WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { Server, Socket } from 'socket.io';
import { joinDirectRoom, sendMessage, previousMessage, deleteMessage } from './dto/chat.dto';
import { RedisService } from 'src/redis/redis.service';

interface friend {
    id : string;
    username: string;
    nickname: string;
}

@WebSocketGateway({ cors: {
      origin: true
    }, })
  export class ChatGateway {
    @WebSocketServer()
    server: Server;
  constructor(
    private readonly chatService: ChatService,
    private readonly redisService: RedisService
  ) {}

  private connectedUsers = new Map<string, string>();

  async handleConnection(socket: Socket) {
    const userId = socket.handshake.query.userId as string;
    if (!userId) return;

    // const myRoom = `user:${userId}`;
    // socket.join(myRoom);

    this.connectedUsers.set(userId, socket.id);
    await this.chatService.setUserOnline(userId);

    this.server.emit('onlineStatus', {
      userId: Number(userId),
      online: true
    });

    console.log(`User ${userId} online`);
  }

  async handleDisconnect(socket: Socket) {
    for (const [userId, sId] of this.connectedUsers.entries()) {
      if (sId === socket.id) {
        this.connectedUsers.delete(userId);
        this.server.emit('onlineStatus', {
          userId: Number(userId),
          online: false
        });
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  }

  async emitFriendAccepted(body : friend) {
    const { id, username, nickname } = body;
    const socketId = this.connectedUsers.get(String(id));
    
    if (!socketId) {
      return;
    }

    this.server.to(socketId).emit('friendAccepted', {
      id : id,
      username: username,
      nickname: nickname
    });
  }

  @SubscribeMessage('heartbeat')
  async heartbeat(@ConnectedSocket() socket: Socket) {
    const userId = socket.handshake.query.userId as string;
    if (!userId) return;

    await this.chatService.setUserOnline(userId);
  }


  @SubscribeMessage('checkOnline')
  async checkOnline(
    @MessageBody() body: { userId: number },
    @ConnectedSocket() client: Socket
  ) {
    const online = await this.chatService.isOnline(body.userId);
    client.emit('onlineStatus', {
      userId: body.userId,
      online,
    });
  }
  
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
    this.server.to(roomName).emit('newMessage', message);
  }

  @SubscribeMessage('loadMessages')
  async loadMessages(
    @MessageBody() payload,
    @ConnectedSocket() client : Socket
  ) {
    const { fromId, toId, limit, lastId } = payload;
    const roomName = [fromId, toId].sort((a, b) => a - b).join('_');

    const messages = await this.chatService.loadMessages(roomName, limit, lastId);

    // 새로운 메세지 emit
    client.emit('loadMessages', messages);
  }

  @SubscribeMessage('readMessage')
  async readMessage(
    @MessageBody() payload : joinDirectRoom,
    @ConnectedSocket() client : Socket
  ) {
    const { userId1, userId2 } = payload;
    const roomName = [userId1, userId2].sort((a, b) => a - b).join('_');

    await this.chatService.readMessage(userId1, userId2, roomName);
  }

  @SubscribeMessage('deleteMessage')
  async deleteMessage(
    @MessageBody() payload : deleteMessage,
    @ConnectedSocket() client : Socket
  ) {
    const { messageId, userId1, userId2, content } = payload;
    const roomName = [userId1, userId2].sort((a, b) => a - b).join('_');

    await this.chatService.deleteMessage(messageId, roomName, content);
    const messages = await this.chatService.getMessages(roomName);

    this.server.to(roomName).emit('previousMessage', messages);
  }
}
