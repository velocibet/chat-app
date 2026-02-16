import { UseGuards } from '@nestjs/common';
import { OnGatewayInit, WebSocketServer, WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { ChatroomService } from 'src/chatroom/chatroom.service';
import { Server, Socket } from 'socket.io';
import { joinDirectRoom, sendMessage, previousMessage, deleteMessage } from './dto/chat.dto';
import { RedisService } from 'src/redis/redis.service';
import { sessionMiddleware } from '../main';
import { socketOk, socketFail } from '../socket.response';
import { AuthWsGuard } from 'src/auth/guards/AuthWsGuard';

@UseGuards(AuthWsGuard)
@WebSocketGateway({ cors: {
      origin: true,
      credentials: true
    }, })
  export class ChatGateway implements OnGatewayInit {
    @WebSocketServer()
    server: Server;
  constructor(
    private readonly chatService: ChatService,
    private readonly redisService: RedisService,
    private readonly chatroomService: ChatroomService
  ) {}

  private connectedUsers = new Map<string, string>();

  afterInit(server: Server) {
    server.use((socket: any, next) => {
      sessionMiddleware(socket.request, {} as any, (err: any) => {
        if (err) return next(err);
        next();
      });
    });
  }

  async handleConnection(socket: Socket) {
    const userId = socket.request.session?.user?.userId;

    if (!userId) {
      const result = socketOk("로그인 후 이용해주세요.");
      socket.emit('error', result);
      socket.disconnect(true);

      return
    }
    
    this.connectedUsers.set(userId, socket.id);
    socket.join(`user:${userId}`);
    console.log(`User ${userId} online`);
  }

  async handleDisconnect(socket: Socket) {
    const userId = socket.request.session?.user?.userId;
    
    this.connectedUsers.delete(userId);
    console.log(`User ${userId} disconnect`);
  }

  // @SubscribeMessage('heartbeat')
  // async heartbeat(@ConnectedSocket() socket: Socket) {
  //   const userId = socket.handshake.query.userId as string;
  //   if (!userId) return;

  //   await this.chatService.setUserOnline(userId);
  // }


  // @SubscribeMessage('checkOnline')
  // async checkOnline(
  //   @MessageBody() body: { userId: number },
  //   @ConnectedSocket() client: Socket
  // ) {
  //   const online = await this.chatService.isOnline(body.userId);
  //   client.emit('onlineStatus', {
  //     userId: body.userId,
  //     online,
  //   });
  // }
  
  @SubscribeMessage('joinDirectRoom')
  async handleJoinPrivateRoom(
    @MessageBody() payload : joinDirectRoom,
    @ConnectedSocket() client : Socket
  ) {
    const { userId } = client.request.session?.user;
    const { roomId } = payload;

    console.log(`User ${userId} joining room ${roomId}`);

    const isMember = await this.chatService.isRoomMember(userId, roomId);
    if (!isMember) {
      console.log(`User ${userId} not a member of room ${roomId}`);
      client.emit('joinDirectRoom', socketFail('권한 없는 채팅방입니다.'));
      return;
    }

    client.join(`room:${roomId}`);
    console.log(`User ${userId} successfully joined room ${roomId}`);
    client.emit('joinDirectRoom', socketOk('입장 성공'));
  }

  @SubscribeMessage('leaveRoom')
  async handleLeavePrivateRoom(
    @MessageBody() payload: joinDirectRoom,
    @ConnectedSocket() client: Socket
  ) {
    const { userId } = client.request.session?.user;
    const { roomId } = payload;

    console.log(`User ${userId} leaving room ${roomId}`);

    const isMember = await this.chatService.isRoomMember(userId, roomId);
    if (!isMember) {
      console.log(`User ${userId} not a member of room ${roomId}`);
      client.emit('leaveRoom', socketFail('권한 없는 채팅방입니다.'));
      return;
    }

    client.leave(`room:${roomId}`);
    console.log(`User ${userId} successfully left room ${roomId}`);
    client.emit('leaveRoom', socketOk('퇴장 성공'));
  }

  @SubscribeMessage('sendMessage')
  async sendMessage(
    @MessageBody() payload : sendMessage,
    @ConnectedSocket() client : Socket
  ) {
    const { userId } = client.request.session?.user;
    const { roomId, content } = payload;

    const message = await this.chatService.sendMessage(userId, roomId, content);
    const room = await this.chatroomService.findOne(roomId, userId);

    const blockedSocketIds: string[] = [];
    for (const member of room.room_users) {
      const isBlocked = await this.chatService.isBlocked(+member.user_id, +userId);
      if (isBlocked) {
        const socketId = this.connectedUsers.get(member.user_id);
        if (socketId) blockedSocketIds.push(socketId);
      }
    }

    this.server
      .to(`room:${roomId}`)
      .except(blockedSocketIds)
      .emit('newMessage', socketOk('ok', message));
  }

  @SubscribeMessage('loadMessages')
  async loadMessages(
    @MessageBody() payload,
    @ConnectedSocket() client : Socket
  ) {
    const userId = client.request.session?.user?.userId;
    const { roomId, limit, lastId } = payload;
    const messages = await this.chatService.loadMessages(userId, roomId, limit, lastId);

    client.emit('loadMessages', socketOk('ok', messages));
  }

  @SubscribeMessage('readMessage')
  async readMessage(
    @MessageBody() payload : joinDirectRoom,
    @ConnectedSocket() client : Socket
  ) {
    // const { userId1, userId2 } = payload;
    // const roomName = [userId1, userId2].sort((a, b) => a - b).join('_');

    // await this.chatService.readMessage(userId1, userId2, roomName);
  }

  @SubscribeMessage('deleteMessage')
  async deleteMessage(
    @MessageBody() payload : deleteMessage,
    @ConnectedSocket() client : Socket
  ) {
    const { messageId, roomId, content } = payload;

    const message = await this.chatService.deleteMessage(messageId, roomId, content);

    this.server.to(`room:${roomId}`).emit('deletedMessage', socketOk('ok', message));
  }

  /**
   * 친구 요청 알림을 실시간으로 전송합니다.
   * @param receiverId 받는 사람의 ID
   * @param data 친구 요청 정보
   */
  sendFriendRequest(receiverId: number | string, data: any) {
    this.server.to(`user:${receiverId}`).emit('friendRequest', socketOk('친구 요청을 받았습니다.', data));
  }

  async updateRoomList(userId: number){
    const data = await this.chatService.findRooms(userId);
    
    this.server.to(`user:${userId}`).emit("newRoomList", socketOk("ok", data));
  }
}
