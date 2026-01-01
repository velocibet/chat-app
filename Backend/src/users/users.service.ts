import { Inject, Injectable, HttpException, ConflictException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { pool } from '../database';
import { ppid } from 'process';

interface Register {
  username: string;
  password: string;
  email: string;
}

interface Login {
  username: string;
  password: string;
}

interface FriendRequest {
  userId: string;
  friendName: string;
}

interface ChangePassword {
  userId: number;
  currentPassword: string;
  changePassword: string;
}

interface AcountDelete {
  userId: number;
  currentPassword: string;
}

@Injectable()
export class UsersService {

  // 회원가입
  async register(body: Register) {
    const { username, password, email } = body;
    try {
      const { rows: existingUsername } = await pool.query(
        'SELECT id FROM users WHERE username = $1',
        [username]
      );

      if (existingUsername.length > 0) throw new ConflictException('이미 사용 중인 아이디입니다.');

      const { rows: existingEmail } = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingEmail.length > 0) throw new ConflictException('이미 사용 중인 이메일입니다.');

      if (password.length < 7) throw new ConflictException('비밀번호는 최소 8글자 이상이어야 합니다.');

      const hashedPassword = await argon2.hash(password);

      const result = await pool.query(
        'INSERT INTO users (username, nickname, password, email) VALUES ($1, $2, $3, $4) RETURNING id',
        [username, username, hashedPassword, email]
      );

      return { userId: result.rows[0].id, username: username };

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new InternalServerErrorException('오류가 발생했습니다.');
      }
    }
  }

  // 로그인
  async login(body: Login) {
    const { username, password } = body;
    try {
      const { rows: users } = await pool.query(
        'SELECT id, username, nickname, password FROM users WHERE username = $1',
        [username]
      );

      if (users.length === 0) throw new BadRequestException('존재하지 않는 아이디입니다.');

      const user = users[0];

      const passwordValid = await argon2.verify(user.password, password);
      if (!passwordValid) throw new BadRequestException('비밀번호가 올바르지 않습니다.');

      return { userId: user.id, username: user.username, nickname: user.nickname };

    } catch (error) {
      if (error instanceof HttpException) throw error;
      else throw new InternalServerErrorException('오류가 발생했습니다.');
    }
  }

  // 로그인 로그 남기기
  async insertLoginLog(username: string, ip: string, agent: string, success: number) {
    await pool.query(
      'INSERT INTO login_logs (username, ip, agent, success) VALUES ($1, $2, $3, $4)',
      [username, ip, agent, success]
    );
  }

  // 친구 목록 불러오기
  async checkFriend(userId: string) {
    const { rows: requests } = await pool.query(
      'SELECT * FROM friend_requests WHERE sender_id = $1 OR receiver_id = $2',
      [userId, userId]
    );

    const friends: any = [];

    if (requests.length > 0) {
      for (const request of requests) {
        if (request.status === 'accepted') {
          const friendId = request.sender_id === userId ? request.receiver_id : request.sender_id;
          const { rows: friendData } = await pool.query(
            'SELECT id, username, nickname FROM users WHERE id = $1',
            [friendId]
          );

          if (friendData.length > 0) friends.push(friendData[0]);
        }
      }
    }

    return friends;
  }

  // 친구 요청 보내기
  async sendFriendRequest(body: FriendRequest) {
    const { userId, friendName } = body;
    try {
      const { rows: friends } = await pool.query(
        'SELECT id FROM users WHERE username = $1',
        [friendName]
      );

      if (friends.length === 0) throw new BadRequestException('존재하지 않는 사용자입니다.');

      const friendId = friends[0].id;
      if (userId === friendId) throw new BadRequestException('자기 자신에게는 친구 요청을 보낼 수 없습니다.');

      const { rows: existingRequest } = await pool.query(
        'SELECT * FROM friend_requests WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $3 AND receiver_id = $4)',
        [userId, friendId, friendId, userId]
      );

      if (existingRequest.length > 0) {
        if (existingRequest[0].sender_id === userId) {
          if (existingRequest[0].status === 'accepted') throw new ConflictException('이미 친구인 사용자입니다.');
          else throw new ConflictException('이미 친구 요청을 보냈습니다.');
        } else if (existingRequest[0].receiver_id === userId) {
          await pool.query(
            'UPDATE friend_requests SET status = $1 WHERE sender_id = $2 AND receiver_id = $3',
            ['accepted', friendId, userId]
          );
          return { userId, friendId, status: 'accepted' };
        }
      }

      await pool.query(
        'INSERT INTO friend_requests (sender_id, receiver_id, status) VALUES ($1, $2, $3)',
        [userId, friendId, 'pending']
      );

      return { userId, friendId, status: 'pending' };

    } catch (error) {
      if (error instanceof HttpException) throw error;
      else throw new InternalServerErrorException('오류가 발생했습니다.');
    }
  }

  async getFriendRequests(userid: string) {
    try {
      const { rows } = await pool.query(
        `SELECT * FROM friend_requests WHERE receiver_id = $1 AND status = 'pending'`,
        [userid]
      );

      let requests: { userId: number; username: string; nickname: string }[] = [];

      if (rows.length > 0) {
        for (const row of rows) {
          const { rows: users } = await pool.query(
            'SELECT * FROM users WHERE id = $1',
            [row.sender_id]
          );

          requests.push({
            userId: users[0].id!,
            username: users[0].username!,
            nickname: users[0].nickname!
          });
        }
      }

      return requests;

    } catch (error) {
      if (error instanceof HttpException) throw error;
      else throw new InternalServerErrorException('오류가 발생했습니다.');
    }
  }

  async rejectRequest(userid: string, friendId: string) {
    try {
      const { rows } = await pool.query(
        'SELECT * FROM friend_requests WHERE sender_id = $1 AND receiver_id = $2',
        [friendId, userid]
      );

      await pool.query(
        'DELETE FROM friend_requests WHERE id = $1',
        [rows[0]!.id]
      );

      return { ok: true };

    } catch (error) {
      if (error instanceof HttpException) throw error;
      else throw new InternalServerErrorException('오류가 발생했습니다.');
    }
  }

  async acceptRequest(userid: string, friendId: string) {
    try {
      const { rows } = await pool.query(
        'SELECT * FROM friend_requests WHERE sender_id = $1 AND receiver_id = $2',
        [friendId, userid]
      );

      await pool.query(
        'UPDATE friend_requests SET status = $1 WHERE id = $2',
        ['accepted', rows[0]!.id]
      );

      const { rows: friends } = await pool.query(
        'SELECT * FROM users WHERE id = $1',
        [friendId]
      );

      return {
        ok: true,
        body: {
          id: friends[0].id,
          username: friends[0].username,
          nickname: friends[0].nickname
        }
      };

    } catch (error) {
      if (error instanceof HttpException) throw error;
      else throw new InternalServerErrorException('오류가 발생했습니다.');
    }
  }

  async updateProfile(userid: string, username: string, nickname: string) {
    try {
      const { rows: users } = await pool.query(
        'SELECT nickname FROM users WHERE id = $1',
        [Number(userid)]
      );

      if (users.length < 1) throw new BadRequestException('유저가 존재하지 않습니다.');

      await pool.query(
        'UPDATE users SET nickname = $1 WHERE id = $2',
        [nickname, Number(userid)]
      );

    } catch (error) {
      if (error instanceof HttpException) throw error;
      else throw new InternalServerErrorException('오류가 발생했습니다.');
    }
  }

  async changePassword(body: ChangePassword) {
    const { userId, currentPassword, changePassword } = body;

    try {
      const { rows: users } = await pool.query(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );

      if (users.length < 1) throw new BadRequestException("로그인 후 이용해주세요.");

      const user = users[0];
      if (!await argon2.verify(user.password, currentPassword)) throw new BadRequestException("현재 비밀번호가 올바르지 않습니다.");
      if (changePassword.length < 7) throw new ConflictException('비밀번호는 최소 8글자 이상이어야 합니다.');

      const hashedNewPassword = await argon2.hash(changePassword);
      await pool.query(
        'UPDATE users SET password = $1 WHERE id = $2',
        [hashedNewPassword, userId]
      );

      return { ok: true };

    } catch (error) {
      if (error instanceof HttpException) throw error;
      else throw new InternalServerErrorException('오류가 발생했습니다.');
    }
  }

  async getDelete(body: AcountDelete) {
    const { userId, currentPassword } = body;

    try {
      const { rows: users } = await pool.query(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );

      if (users.length < 1) throw new BadRequestException("로그인 후 이용해주세요.");

      const user = users[0];
      if (!await argon2.verify(user.password, currentPassword)) throw new BadRequestException("현재 비밀번호가 올바르지 않습니다.");

      const client = await pool.connect();
      await client.query('BEGIN');

      try {
        await client.query('DELETE FROM friend_requests WHERE sender_id = $1 OR receiver_id = $2', [userId, userId]);
        await client.query('DELETE FROM users WHERE id = $1', [userId]);
        await client.query('DELETE FROM messages WHERE sender_id = $1 OR receiver_id = $2', [userId, userId]);
        await client.query('COMMIT');

      } catch (e) {
        await client.query('ROLLBACK');
        throw e;

      } finally {
        client.release();
      }

      return { ok: true };

    } catch (error) {
      if (error instanceof HttpException) throw error;
      else throw new InternalServerErrorException('오류가 발생했습니다.');
    }
  }

  async checkProfile(userid: number) {
    const { rows } = await pool.query(
      'SELECT id, username, nickname FROM users WHERE id = $1',
      [userid]
    );

    const user = rows[0];

    return {
      userid: user.id,
      username: user.username,
      nickname: user.nickname
    };
  }
}
