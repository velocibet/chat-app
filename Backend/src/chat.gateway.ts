import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { pool } from './database';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
})

@Injectable()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  private makeUniqueKey(userIds: string[]): string {
    return [...userIds].sort().join(':');
  }

  private onlineUsers = new Map<string, string>();

  async handleConnection(client: Socket) {
    console.log('connected', client.id);

    // 프론트에서 접속 후 userid를 등록하게 할 것
    client.on('registerUser', (userId: string) => {
      if (userId) {
        this.onlineUsers.set(userId, client.id);
        console.log(`User ${userId} registered with socket ${client.id}`);
      }
    });
  }

  async handleDisconnect(client: Socket) {
    console.log('disconnected', client.id);
    for (const [userId, socketId] of this.onlineUsers.entries()) {
      if (socketId === client.id) {
        this.onlineUsers.delete(userId);
        break;
      }
    }
  }

  async createRoomIfNotExists(userIds: string[]): Promise<number> {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const uniqueKey = this.makeUniqueKey(userIds);

      const [rows] = await conn.execute(
        'SELECT id FROM rooms WHERE unique_key = ? LIMIT 1',
        [uniqueKey]
      );
      if ((rows as any[]).length > 0) {
        await conn.commit();
        return (rows as any[])[0].id;
      }

      const [res] = await conn.execute(
        'INSERT INTO rooms (unique_key, is_direct) VALUES (?, 1)',
        [uniqueKey]
      );
      const roomId = (res as any).insertId;

      const values = userIds.map((uid) => `(${roomId}, '${uid}')`).join(',');
      await conn.execute(
        `INSERT INTO room_members (roomid, userid) VALUES ${values}`
      );

      await conn.commit();
      return roomId;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  @SubscribeMessage('joinRoom')
  async onJoinRoom(
    @MessageBody() data: { roomId?: number; userIds?: string[]; userId?: string },
    @ConnectedSocket() client: Socket
  ) {
    console.log('joinRoom payload:', data, 'from socket:', client.id);
    let roomId = data.roomId;

    if (!roomId && data.userIds) {
      roomId = await this.createRoomIfNotExists(data.userIds);
    }

    if (!roomId) {
      client.emit('error', { message: 'roomId 필요' });
      return;
    }

    client.join(String(roomId));

    const [rows] = await pool.execute(
      `
      SELECT m.userid, u.username, u.nickname, m.content, m.created_at
      FROM messages m
      JOIN users u ON m.userid = u.userid
      WHERE m.roomid = ?
      ORDER BY m.created_at ASC
      `,
      [roomId]
    );

    const mapped = (rows as any[]).map((r) => ({
      userid: r.userid,
      username: r.username,
      nickname: r.nickname,
      content: r.content,
      createdAt: r.created_at
        ? new Date(r.created_at).toISOString()
        : new Date().toISOString(),
    }));

    client.emit('previousMessages', mapped);

    const [members] = await pool.execute(
      'SELECT userid FROM room_members WHERE roomid = ?',
      [roomId]
    );
    client.emit('roomMembers', (members as any[]).map((m) => m.userid));

    client.emit('joinedRoom', { roomId });
  }

  @SubscribeMessage('sendMessage')
  async onMessage(
    @MessageBody() payload: { roomId: number; userId: string; content: string },
    @ConnectedSocket() client: Socket
  ) {
    console.log('sendMessage payload from', client.id, payload);
    const { roomId, userId, content } = payload;
    if (!roomId || !userId || !content) {
      client.emit('error', { message: 'invalid payload' });
      return;
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      await conn.execute(
        'INSERT INTO messages (roomid, userid, content) VALUES (?, ?, ?)',
        [roomId, userId, content]
      );
      await conn.execute(
        'UPDATE rooms SET last_message_at = CURRENT_TIMESTAMP WHERE id = ?',
        [roomId]
      );

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      client.emit('error', { message: 'message save failed' });
      return;
    } finally {
      conn.release();
    }

    const [userRow] = await pool.execute(
      'SELECT username FROM users WHERE userid = ? LIMIT 1',
      [userId]
    );
    const username = (userRow as any[])[0]?.username || 'Unknown';

    const msgForEmit = {
      roomId,
      userid: userId,
      username,
      content,
      createdAt: new Date().toISOString(),
    };

    this.server.to(String(roomId)).emit('receiveMessage', msgForEmit);
  }

  @SubscribeMessage('sendFriendRequest')
  async onSendFriendRequest(
    @MessageBody() data: { fromUserId: string; toUserName: string },
    @ConnectedSocket() client: Socket
  ) {
    const { fromUserId, toUserName } = data;
    if (!fromUserId || !toUserName) {
      client.emit('error', { message: 'invalid payload' });
      return;
    }

    const [rows] = await pool.execute(
      'SELECT userid FROM users WHERE username = ? LIMIT 1',
      [toUserName]
    );

    if ((rows as any[]).length < 1) {
      client.emit('error', { message: 'user not found' });
      return;
    }

    const receiverId = (rows as any[])[0].userid;

    const [existingRequests] = await pool.execute(
      'SELECT * FROM friend_requests WHERE senderid = ? AND receiverid = ?',
      [fromUserId, receiverId]
    );

    const [existingFriends] = await pool.execute(
      'SELECT * FROM friends WHERE (user_min = ? AND user_max = ?) OR (user_min = ? AND user_max = ?)',
      [fromUserId, receiverId, receiverId, fromUserId]
    );


    if ((existingRequests as any[]).length > 0) {
      client.emit('error', { message: 'friend request already sent' });
      return;
    }

    if ((existingFriends as any[]).length > 0) {
      client.emit('error', { message: 'already friends' });
      return;
    }

    try {
      await pool.execute(
        'INSERT INTO friend_requests (senderid, receiverid, status) VALUES (?, ?, ?)',
        [fromUserId, receiverId, 'pending']
      );
      client.emit('friendRequestSent', { toUserName });

      // 수신자가 접속 중이면 즉시 알림 보내기
      const targetSocketId = this.onlineUsers.get(receiverId);
      if (targetSocketId) {
        const [senderRow] = await pool.execute(
          'SELECT username FROM users WHERE userid = ? LIMIT 1',
          [fromUserId]
        );
        const senderName = (senderRow as any[])[0]?.username || 'Unknown';
        this.server.to(targetSocketId).emit('friendRequestReceived', {
          fromUserId,
          fromUserName: senderName,
        });
      }
    } catch (err) {
      console.error(err);
      client.emit('error', { message: 'friend request failed' });
    }
  }

  @SubscribeMessage('respondFriendRequest')
  async onRespondFriendRequest(
    @MessageBody() data: { requestId: number; accepted: boolean },
    @ConnectedSocket() client: Socket
  ) {
    const { requestId, accepted } = data;

    try {
      // 요청 상태 업데이트
      await pool.execute(
        'UPDATE friend_requests SET status = ? WHERE id = ?',
        [accepted ? 'accepted' : 'rejected', requestId]
      );

      if (accepted) {
        const [rows]: any = await pool.execute(
          'SELECT senderid, receiverid FROM friend_requests WHERE id = ?',
          [requestId]
        );

        if (rows.length > 0) {
          if (rows.length === 0) {
            client.emit('error', { message: 'Friend request not found' });
            return;
          }

          const { senderid, receiverid } = rows[0];
          const [a, b] = [senderid, receiverid].sort();

          await pool.execute(
            'DELETE FROM friend_requests WHERE (senderid = ? AND receiverid = ?) OR (senderid = ? AND receiverid = ?)',
            [senderid, receiverid, receiverid, senderid]
          );

          try {
            await pool.execute(
              'INSERT INTO friends (user_min, user_max) VALUES (?, ?)',
              [a, b]
            );
          } catch (err: any) {
            if (err.code !== 'ER_DUP_ENTRY') throw err;
          }

          const senderSocket = this.onlineUsers.get(senderid);
          const receiverSocket = this.onlineUsers.get(receiverid);

          const payload = { senderid, receiverid, message: '친구 요청이 수락되었습니다.' };

          if (senderSocket) this.server.to(senderSocket).emit('friendAccepted', payload);
          if (receiverSocket) this.server.to(receiverSocket).emit('friendAccepted', payload);
        }
      }

      client.emit('friendRequestUpdated', {
        requestId,
        status: accepted ? 'accepted' : 'rejected',
      });
    } catch (err) {
      console.error('respondFriendRequest error:', err);
      client.emit('error', { message: 'Failed to process friend request' });
    }
  }
}
