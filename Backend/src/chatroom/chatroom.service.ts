import { Injectable, HttpException, InternalServerErrorException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { pool } from '../database';

@Injectable()
export class ChatroomService {
    async create(type: string, userId: number, member?: number, membersArray?: number[], title?: string) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            let roomId: number;

            if (type === "dm") {
                const roomName = [userId, member].sort((a: number, b: number) => a - b).join('_');
                
                const res = await client.query(`
                    WITH upsert_room AS (
                    INSERT INTO room (type, dm_hash)
                    VALUES ('dm', $1)
                    ON CONFLICT (dm_hash) DO UPDATE SET dm_hash = EXCLUDED.dm_hash
                    RETURNING id
                    ),
                    insert_members AS (
                    INSERT INTO room_user (room_id, user_id, role)
                    SELECT id, unnest(ARRAY[$2::int, $3::int]), 'member'::room_user_role FROM upsert_room
                    ON CONFLICT DO NOTHING
                    )
                    SELECT id FROM upsert_room;
                `, [roomName, userId, member]);

                roomId = res.rows[0].id;
            } else if (type === "group") {
                if (!membersArray || membersArray.length === 0) {
                    throw new BadRequestException("그룹 멤버가 필요합니다.");
                }

                const allMembers = Array.from(new Set([userId, ...membersArray.map(Number)]));

                const res = await client.query(`
                    WITH new_room AS (
                    INSERT INTO room (type, owner_user_id, title)
                    VALUES ('group', $1, $2)
                    RETURNING id
                    )
                    INSERT INTO room_user (room_id, user_id, role)
                    SELECT 
                    new_room.id, 
                    m.user_id, 
                    CASE WHEN m.user_id = $1 THEN 'owner'::room_user_role ELSE 'member'::room_user_role END
                    FROM new_room, unnest($3::int[]) AS m(user_id)
                    RETURNING (SELECT id FROM new_room);
                `, [userId, title || '그룹 채팅방', allMembers]);

                roomId = res.rows[0].id;

            } else {
                throw new BadRequestException("유효하지 않은 채팅 타입입니다.");
            }

            await client.query('COMMIT');
            return "성공적으로 채팅방을 생성했습니다.";
        } catch (error) {
            await client.query('ROLLBACK');
            if (error instanceof HttpException) throw error;
            throw new InternalServerErrorException('채팅방 생성 중 오류가 발생했습니다.', { cause: error });
        } finally {
            client.release();
        }
    }

    async findAll(userId: number) {
        const { rows } = await pool.query(`
            SELECT 
                r.id,
                r.type,
                r.title,
                r.owner_user_id,
                r.dm_hash,
                r.created_at,
                r.room_image_url,
                json_agg(
                    json_build_object(
                        'id', ru.id,
                        'room_id', r.id,
                        'userId', u.id,
                        'username', u.username,
                        'nickname', u.nickname,
                        'profileUrlName', u.profile_url_name,
                        'role', ru.role,
                        'joined_at', ru.joined_at,
                        'left_at', ru.left_at
                    )
                ) AS room_users
            FROM room r
            JOIN room_user ru ON ru.room_id = r.id
            JOIN users u ON u.id = ru.user_id
            WHERE r.id IN (
                SELECT room_id
                FROM room_user
                WHERE user_id = $1
            )
            GROUP BY r.id;
            `, [userId]
        );

        return rows;
    }

    async findOne(roomId: number, userId: number) {
        const { rows } = await pool.query(
        `
        SELECT r.id,
            r.type,
            r.title,
            r.owner_user_id,
            r.dm_hash,
            r.created_at,
            r.room_image_url,
            json_agg(
            json_build_object(
                'id', ru.id,
                'room_id', r.id,
                'userId', u.id,
                'username', u.username,
                'nickname', u.nickname,
                'profileUrlName', u.profile_url_name,
                'role', ru.role,
                'joined_at', ru.joined_at,
                'left_at', ru.left_at
            )
            ) AS room_users
        FROM room r
        JOIN room_user ru ON ru.room_id = r.id
        JOIN users u ON ru.user_id = u.id
        WHERE r.id = $1 AND EXISTS (
            SELECT 1 FROM room_user WHERE room_id = r.id AND user_id = $2
        )
        GROUP BY r.id;
        `,
        [roomId, userId]
        );

        if (!rows || rows.length === 0) {
            throw new ForbiddenException('해당 채팅방에 접근 권한이 없습니다.');
        }

        return rows[0];
    }

    async checkImageUser(filename: string, userId: number) {
        const { rowCount } = await pool.query(`
            SELECT ru.id
            FROM room_user ru
            JOIN room r ON r.id = ru.room_id
            WHERE r.room_image_url = $1
                AND ru.user_id = $2
        `, [filename, userId])

        return rowCount > 0;
    }

    async saveImageUrl(userId: number, roomId: number, fileName: string, title: string){
        await pool.query(`
            UPDATE room
            SET room_image_url = $1, title = $3
            WHERE id = $2
        `, [fileName, roomId, title]);
    }
}
