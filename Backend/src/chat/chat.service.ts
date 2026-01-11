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

    async sendMessage(fromId : number, toId : number, content : string, roomName : string) {
        const result = await pool.query(
                'INSERT INTO messages (room_name, sender_id, receiver_id, content, status) VALUES ($1, $2, $3, $4, $5) RETURNING id',
                [roomName, fromId, toId, content, 'sent']
            );

        const { rows } = await pool.query(
            'SELECT * FROM messages WHERE id = $1',
            [result.rows[0].id]
        );

        return rows[0];
    }

    async getMessages(roomName : string) {
        const { rows } = await pool.query(
            'SELECT * FROM messages WHERE room_name = $1 ORDER BY created_at ASC',
            [roomName]
        )

        return rows;
    }

    async checkStatus(fromId: number, toId: number, roomName: string) {
        const { rows } = await pool.query(
            'SELECT id, status FROM messages WHERE sender_id = $1 AND receiver_id = $2 AND room_name = $3',
            [toId, fromId, roomName]
        );

        for (const item of rows) {
            if (item.status !== "sent") continue;

            await pool.query(
                'UPDATE messages SET status = $1 WHERE id = $2',
                ['delivered', item.id]
            );
        }
    }

    async readMessage(fromId : number, toId: number, roomName: string) {
        await pool.query(
            `UPDATE messages SET status = 'read' WHERE sender_id = $1 AND receiver_id = $2 AND room_name = $3 AND status != 'read'`,
            [toId, fromId, roomName]
        );
    }
    
    async deleteMessage(messageId : number, roomName: string, content : string) {
        await pool.query(
            'DELETE FROM messages WHERE id = $1 AND room_name = $2 AND content = $3',
            [messageId, roomName, content]
        )
    }

    async loadMessages(roomName: string, limit: number, lastId?: Number) {
        if (!lastId) {
            const { rows } = await pool.query(
                'SELECT * FROM messages WHERE room_name = $1 ORDER BY created_at DESC LIMIT $2',
                [roomName, limit]
            )
            return rows.reverse();
        }

        const { rows } = await pool.query(
            'SELECT * FROM messages WHERE room_name = $1 AND id < $2 ORDER BY created_at DESC LIMIT $3',
            [roomName, lastId, limit]
        )

        return rows.reverse();
    }
}
