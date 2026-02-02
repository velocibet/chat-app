import { Injectable } from '@nestjs/common';
import { pool } from '../database';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class ChatService {
    constructor(
        private readonly redisService: RedisService
    ) {}

    async setUserOnline(userId: string) {
        const redis = this.redisService.getClient();
        await redis.set(
            `user:online:${userId}`,
            '1',
            'EX',
            30,
        );
    }

    async isOnline(userId: number): Promise<boolean> {
        const redis = this.redisService.getClient();
        const result = await redis.exists(`user:online:${userId}`);
        return result === 1;
    }

    async getFriends(userId: string): Promise<number[]> {
        const { rows } = await pool.query(
            'SELECT friend_id FROM friends WHERE user_id = $1',
            [userId]
        );
        
        return rows.map(row => row.friend_id);
    }

    async isRoomMember(userId: number, roomId: number) {
        const { rowCount } = await pool.query(
            `SELECT 1 FROM room_user WHERE user_id = $1 AND room_id = $2`,
            [userId, roomId]
        );

        return rowCount > 0;
    }

    async sendMessage(senderId: number, roomId: number, content: string) {
        const { rows } = await pool.query(
            `INSERT INTO messages (room_id, sender_id, content, status)
            VALUES ($1, $2, $3, $4)
            RETURNING *`,
            [roomId, senderId, content, 'sent']
        );

        return rows[0];
    }

    async getMessages(roomId: number) {
        const { rows } = await pool.query(
            'SELECT * FROM messages WHERE room_id = $1 ORDER BY created_at ASC',
            [roomId]
        )

        return rows;
    }

    // async readMessage(fromId : number, toId: number, roomName: string) {
    //     await pool.query(
    //         `UPDATE messages SET status = 'read' WHERE sender_id = $1 AND receiver_id = $2 AND room_name = $3 AND status != 'read'`,
    //         [toId, fromId, roomName]
    //     );
    // }
    
    async deleteMessage(messageId : number, roomId: number, content : string) {
        const { rows } = await pool.query(
            'DELETE FROM messages WHERE id = $1 AND room_id = $2 AND content = $3 RETURNING id',
            [messageId, roomId, content]
        );

        return rows[0];
    }

    async loadMessages(roomId: string, limit: number, lastId?: number) {
        const params = lastId ? [roomId, lastId, limit] : [roomId, limit];
        const query = lastId
            ? `SELECT * FROM messages 
            WHERE room_id = $1 AND id < $2 
            ORDER BY created_at DESC LIMIT $3`
            : `SELECT * FROM messages 
            WHERE room_id = $1 
            ORDER BY created_at DESC LIMIT $2`;

        const { rows } = await pool.query(query, params);
        return rows.reverse();
    }

    async saveImageUrl(userId: number, roomId: number, url: string) {
        const result = await pool.query(`
            INSERT INTO messages (room_id, sender_id, content, status, isfile)
            VALUES ($1, $2, $3, 'sent', 1)
            RETURNING id, room_id, sender_id, content, status, isfile, created_at
            `,
            [roomId, userId, url]
        );

        return result.rows[0];
    }


    async getImageUrl(messageId: string){
        const id = Number(messageId); // 숫자로 변환
        const result = await pool.query(
        "SELECT content FROM messages WHERE id = $1 AND isfile = $2",
        [id, 1]
        );

        if (!result.rows.length) throw new Error(`메시지 ID ${messageId}에 대한 이미지가 존재하지 않습니다.`);

        return result.rows[0].content;
    }

    async checkImageUser(filename: string, userId: number) {
        const { rows } = await pool.query(`
            SELECT EXISTS (
                SELECT 1 
                FROM messages m
                JOIN room_user ru ON m.room_id = ru.room_id
                WHERE m.content = $1 
                AND m.isfile = 1
                AND ru.user_id = $2
            ) as "hasAccess";
        `, [filename, userId]);

        return rows && rows[0] ? !!rows[0].hasaccess || !!rows[0].hasAccess : false;
    }
}
