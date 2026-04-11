import { UseGuards, Inject, forwardRef } from '@nestjs/common';
import { OnGatewayInit, WebSocketServer, WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { ChatroomService } from '../chatroom/chatroom.service';
import { Server, Socket } from 'socket.io';
import { joinDirectRoom, sendMessage, previousMessage, deleteMessage } from './dto/chat.dto';
import { RedisService } from '../redis/redis.service';
import { FcmService } from '../fcm/fcm.service';
import { sessionMiddleware } from '../common/session.config';
import { socketOk, socketFail } from '../socket.response';
import { AuthWsGuard } from '../guards/AuthWsGuard';
import { FriendsService } from '../friends/friends.service';

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
    @Inject(forwardRef(() => ChatroomService))
    private readonly chatroomService: ChatroomService,
    private readonly friendsService: FriendsService,
    private readonly fcmService: FcmService,
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

    socket.data.userId = userId;
    
    await this.chatService.setUserOnline(userId.toString());
    this.connectedUsers.set(userId, socket.id);
    socket.join(`user:${userId}`);

    const friends = await this.friendsService.findAll(userId); 

    friends.forEach(friend => {
      this.server.to(`user:${friend.userId}`).emit('user_status_changed', {
        userId: Number(userId),
        isOnline: true
      });
    });

    console.log(`User ${userId} online`);
  }

  async handleDisconnect(socket: Socket) {
    const userId = socket.request.session?.user?.userId;
    
    const friends = await this.friendsService.findAll(userId);
    
    friends.forEach(friend => {
      this.server.to(`user:${friend.userId}`).emit('user_status_changed', {
        userId: Number(userId),
        isOnline: false
      });
    });

    this.connectedUsers.delete(userId.toString());
    console.log(`User ${userId} disconnect`);
  }

  @SubscribeMessage('heartbeat')
  async heartbeat(@ConnectedSocket() socket: Socket) {
    const userId = socket.request.session?.user?.userId;
    if (!userId) return;

    await this.chatService.setUserOnline(userId);
  }

  // @SubscribeMessage('checkOnline')
  // async handleGetStatus(
  //   @ConnectedSocket() socket: Socket,
  //   @MessageBody() data: { userIds: number[] }
  // ) {
  //   const statuses = await this.chatService.getUsersStatus(data.userIds);
  //   return statuses;
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
  async sendMessage(@MessageBody() payload: sendMessage, @ConnectedSocket() client: Socket) {
    const { userId } = client.request.session?.user;
    const { roomId, content } = payload;
    const roomName = `room:${roomId}`;
    const connectedSockets = await this.server.in(roomName).fetchSockets();
    const activeUserIds = connectedSockets.map(s => Number(s.data.userId)).filter(id => !!id);

    const [message, memberIds] = await Promise.all([
      this.chatService.sendMessage(userId, roomId, content, activeUserIds),
      this.chatroomService.getMemberIds(roomId)
    ]);

    const senderName = '새 메시지';

    const blockedUserIds = await this.chatService.getBlockedUsersInRoom(userId, memberIds);
    const blockedSocketIds = blockedUserIds.map(id => this.connectedUsers.get(id.toString())).filter(sid => !!sid);

    this.server.to(roomName).except(blockedSocketIds).emit('newMessage', socketOk('ok', message));

    const offlineIds: number[] = memberIds.map(id => Number(id)).filter(mId => mId !== Number(userId) && !activeUserIds.includes(mId));
    offlineIds.forEach(mId => {
      this.server.to(`user:${mId}`).emit('unreadUpdate', { roomId });
    });

    if (offlineIds.length > 0) {
      const tokens = await this.fcmService.getPushTokens(offlineIds);
      if (tokens.length > 0) {
        await this.fcmService.sendPush(tokens as string[], senderName, content || '메시지가 도착했습니다.', { roomId: String(roomId) });
      }
    }
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
