import { Injectable } from '@nestjs/common';
import { pool } from '../database';

@Injectable()
export class ChatService {
    async sendMessage(fromId : number, toId : number, content : string, roomName : string) {
        const result = await pool.query(
            'INSERT INTO messages (room_name, sender_id, receiver_id, content, status) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [roomName, fromId, toId, content, 'sent']
        );

        const { rows } = await pool.query(
            'SELECT * FROM messages WHERE id = $1',
            [result.rows[0].id]
        );

        return rows;
    }

    async getMessages(roomName : string) {
        const { rows } = await pool.query(
            'SELECT * FROM messages WHERE room_name = $1',
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
}
