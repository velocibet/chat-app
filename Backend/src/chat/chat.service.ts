import { Injectable } from '@nestjs/common';
import { pool } from '../database';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

@Injectable()
export class ChatService {
    async sendMessage(fromId : number, toId : number, content : string, roomName : string) {
        const [result] = await pool.execute<ResultSetHeader>(
            'INSERT INTO messages (room_name, sender_id, receiver_id, content, status) VALUES (?, ?, ?, ?, ?)',
            [roomName, fromId, toId, content, 'sent']
        );

        const [rows] = await pool.execute<RowDataPacket[]>(
            'SELECT * FROM messages WHERE id = ?',
            [result.insertId]
        );

        return rows;
    }

    async getMessages(roomName : string) {
        const [rows] = await pool.execute<RowDataPacket[]>(
            'SELECT * FROM messages WHERE room_name = ?',
            [roomName]
        )

        return rows;
    }

    async checkStatus(fromId : number, toId: Number, roomName: string) {
        const [rows] = await pool.execute(
            'UPDATE messages SET status = ? WHERE sender_id = ? AND receiver_id = ? AND room_name = ?',
            ['delivered', toId, fromId, roomName]
        );
    }
}
