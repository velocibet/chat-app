import { Injectable, HttpException, InternalServerErrorException, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { FriendRequestDto, HandleFriendRequestDto } from './dto/friends.dto';
import { pool } from '../database';

@Injectable()
export class FriendsService {
  /**
   * 친구를 요청합니다.
   * @param username 친구를 요청하는 사용자의 이름
   * @param body 친구를 요청할 사용자의 이름 (receiverId)
   * @param gateway WebSocket 게이트웨이 (실시간 알림 전송용)
   * @returns 친구 요청에 성공하면 "친구를 성공적으로 요청했습니다."를 반환합니다.
   */
  async create(username: string, body: FriendRequestDto, gateway: any) {
    const { receiverUsername } = body;

    if (username === receiverUsername) {
      throw new BadRequestException("자신에게 친구 요청을 보낼 수 없습니다.");
    }

    try {
      const { rows } = await pool.query(`
        INSERT INTO friend_requests (sender_id, receiver_id, status)
        SELECT s.id, r.id, 'pending'
        FROM users s
        JOIN users r ON r.username = $2
        WHERE s.username = $1
        ON CONFLICT (LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id)) 
        DO UPDATE SET 
          status = 'pending',
          sender_id = EXCLUDED.sender_id,
          receiver_id = EXCLUDED.receiver_id,
          updated_at = NOW()
        WHERE friend_requests.status = 'rejected'
        RETURNING id, status;
      `, [username, receiverUsername]);

      if (rows.length === 0) {
        throw new ConflictException("유저가 존재하지 않거나 이미 친구 상태입니다.");
      }

      const receiverResult = await pool.query(
        `SELECT id, username, nickname FROM users WHERE username = $1`,
        [receiverUsername]
      );
      
      if (receiverResult.rows.length > 0) {
        const receiver = receiverResult.rows[0];
        const sender = await pool.query(
          `SELECT id, username, nickname FROM users WHERE username = $1`,
          [username]
        );

        if (sender.rows.length > 0) {
          gateway.sendFriendRequest(receiver.id, {
            senderUsername: username,
            senderNickname: sender.rows[0].nickname,
            senderId: sender.rows[0].id
          });
        }
      }

      return "친구를 성공적으로 요청했습니다.";
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('친구 추가 중 오류가 발생했습니다.', { cause: error });
    }
  }

  /**
   * 친구 요청 상태를 수정합니다.
   * @param username 자신의 이름
   * @param receiverUsername 상대방의 이름
   * @param body 상태 (status)
   * @returns 성공적으로 변경하면 "친구 요청을 성공적으로 처리했습니다."을 반한합니다.
   */
  async update(username: string, receiverUsername: string, body: HandleFriendRequestDto) {
    const { status } = body;

    try {
      const result = await pool.query(`
        UPDATE friend_requests 
        SET 
          status = $1,
          updated_at = NOW()
        WHERE (
          (sender_id = (SELECT id FROM users WHERE username = $2) AND receiver_id = (SELECT id FROM users WHERE username = $3)) OR 
          (sender_id = (SELECT id FROM users WHERE username = $3) AND receiver_id = (SELECT id FROM users WHERE username = $2))
        )
        AND status = 'pending'
        RETURNING sender_id, receiver_id;
      `, [status, username, receiverUsername]
      );

      if (result.rowCount === 0) {
        throw new NotFoundException("존재하지 않거나 이미 처리된 친구 요청입니다.");
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException('친구를 요청을 처리하던 중 오류가 발생했습니다.', { cause: error });
    }

    return "친구 요청을 성공적으로 처리했습니다."
  }

  /**
   * 해당 사용자의 친구 요청 목록을 불러옵니다.
   * @param userId 사용자의 아이디
   * @returns 친구 요청 목록을 반환합니다.
   */
  async findAll(userId: number) {
    const { rows: friends } = await pool.query(
      `SELECT
        u.id,
        u.username,
        u.nickname
      FROM users u
      JOIN friend_requests fr ON (
        (fr.receiver_id = $1 AND u.id = fr.sender_id)
      )
      WHERE fr.status = 'pending'
      `,
      [userId]
    );

    if (friends.length === 0) return [];
    return friends
  }
  
  /**
   * 해당 사용자의 친구 목록을 불러옵니다.
   * @param userId 사용자의 아이디
   * @returns 친구의 목록을 반환합니다.
   */
  async findAllFriends(userId: number) {
    const { rows: friends } = await pool.query(
      `SELECT
        u.id AS "userId",
        u.username,
        u.nickname
      FROM users u
      JOIN friend_requests fr ON (
        (fr.sender_id = $1 AND u.id = fr.receiver_id) OR 
        (fr.receiver_id = $1 AND u.id = fr.sender_id)
      )
      WHERE fr.status = 'accepted'
      `,
      [userId]
    );

    if (friends.length === 0) return [];
    return friends
  }

  /**
   * 친구 요청을 삭제합니다
   * @param username 자신의 이름
   * @param receiverUsername 상대방의 이름
   */
  async remove(username: string, receiverUsername: string) {
    try {
      const { rowCount } = await pool.query(`
          DELETE FROM friend_requests 
          WHERE (
            (sender_id = (SELECT id FROM users WHERE username = $1) AND receiver_id = (SELECT id FROM users WHERE username = $2)) OR 
            (sender_id = (SELECT id FROM users WHERE username = $2) AND receiver_id = (SELECT id FROM users WHERE username = $1))
          );
        `,
        [username, receiverUsername]
      );

      if (rowCount === 0) {
        throw new NotFoundException("삭제할 친구 관계가 존재하지 않습니다.");
      }

      return "친구를 성공적으로 삭제했습니다.";
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('친구 요청을 삭제하던 중 오류가 발생했습니다.', { cause: error });
    }
  }

  /**
   * 상대방을 차단합니다
   * @param username 차단하는 사용자의 이름
   * @param receiverUsername 차단할 사용자의 이름
   * @returns 성공적으로 차단하면 "성공적으로 상대방을 차단했습니다."를 반환합니다.
   */
  async getBlock(username: string, receiverUsername: string) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const { rows: blocks } = await client.query(`
          INSERT INTO blocks (blocker_id, blocked_id)
          SELECT 
            (SELECT id FROM users WHERE username = $1),
            (SELECT id FROM users WHERE username = $2)
          ON CONFLICT (blocker_id, blocked_id) DO NOTHING
          RETURNING id;
        `, [username, receiverUsername]
      );

      if (blocks.length === 0) {
        throw new ConflictException("차단할 수 없는 대상이거나 이미 차단된 유저입니다.");
      }

      const { rows: requests } = await client.query(`
          UPDATE friend_requests 
          SET 
            status = 'rejected',
            updated_at = NOW()
          WHERE (
            (sender_id = (SELECT id FROM users WHERE username = $1) AND receiver_id = (SELECT id FROM users WHERE username = $2)) OR 
            (sender_id = (SELECT id FROM users WHERE username = $2) AND receiver_id = (SELECT id FROM users WHERE username = $1))
          );
        `, [username, receiverUsername]
      );

      await client.query("COMMIT");
      return "성공적으로 상대방을 차단했습니다.";
    } catch (error) {
      await client.query("ROLLBACK");
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('친구 요청을 삭제하던 중 오류가 발생했습니다.', { cause: error });
    } finally {
      await client.release();
    }
  }

  async deleteBlock(username: string, receiverUsername: string) {
    await pool.query(`
      DELETE FROM blocks b
      USING users u1, users u2
      WHERE (
        u1.username = $1
        AND u2.username = $2
        AND b.blocker_id = u1.id
        AND b.blocked_id = u2.id
        )
      `, [username, receiverUsername]);

      return "성공적으로 차단을 해제했습니다."
  }

  async findAllBlocks(userId: number) {
    const { rows } = await pool.query(`
      SELECT 
        b.id,
        b.blocker_id,
        b.blocked_id,
        b.created_at,
        u.username,
        u.nickname
      FROM blocks b
      JOIN users u ON b.blocked_id = u.id
      WHERE b.blocker_id = $1
    `, [userId]);

    return rows;
  }
}
