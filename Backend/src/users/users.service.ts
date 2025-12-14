import { Inject, Injectable, HttpException, ConflictException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { pool } from '../database';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
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
  userId : number;
  currentPassword : string;
  changePassword : string;
}

interface AcountDelete {
  userId : number;
  currentPassword : string;
}

@Injectable()
export class UsersService {
  // 회원가입
  async register(body : Register) {
    const { username, password, email } = body;
    try {
      // 아이디 중복 확인
      const [existingUsername] = await pool.execute<RowDataPacket[]>(
        'SELECT id FROM users WHERE username = ?',
        [username]
      )

      if ((existingUsername).length > 0) throw new ConflictException('이미 사용 중인 아이디입니다.');

      // 이메일 중복 확인
      const [existingEmail] = await pool.execute<RowDataPacket[]>(
        'SELECT id FROM users WHERE email = ?',
        [email]
      )

      if ((existingEmail).length > 0) throw new ConflictException('이미 사용 중인 이메일입니다.');

      if (password.length < 7) throw new ConflictException('비밀번호는 최소 8글자 이상이어야 합니다.');

      // 비밀번호 해싱
      const hashedPassword = await argon2.hash(password);

      // 사용자 등록
      const [result] = await pool.execute<ResultSetHeader>(
        'INSERT INTO users (username, nickname, password, email) VALUES (?, ?, ?, ?)',
        [username, username, hashedPassword, email]
      );

      // 등록된 사용자 ID 반환
      return { userId: result.insertId, username: username };
    } catch (error) {
      // 예외 처리
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new InternalServerErrorException('오류가 발생했습니다.');
      }
    }
  }

  // 로그인
  async login(body : Login) {
    const { username, password } = body;
    try {
      // 사용자 조회
      const [users] = await pool.execute<RowDataPacket[]>(
        'SELECT id, username, nickname, password FROM users WHERE username = ?',
        [username]
      );

      if (users.length === 0) {
        throw new BadRequestException('존재하지 않는 아이디입니다.');
      }

      const user = users[0];
      console.log(user);

      // 비밀번호 검증
      const passwordValid = await argon2.verify(user.password, password);
      if (!passwordValid) {
        throw new BadRequestException('비밀번호가 올바르지 않습니다.');
      }

      // 로그인 성공
      return { userId: user.id, username: user.username, nickname: user.nickname };
    } catch (error) {
      // 예외 처리
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new InternalServerErrorException('오류가 발생했습니다.');
      }
    }
  }

  // 친구 목록 불러오기
  async checkFriend(userId: string) {
    const [requests] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM friend_requests WHERE senderId = ? OR receiverId = ?',
      [userId, userId]
    );

    const friends : RowDataPacket[] = [];

    if (requests.length > 0) {
      for (const request of requests) {
        if (request.status === 'accepted') {
          const friendId = request.senderId === userId ? request.receiverId : request.senderId;
          const [friendData] = await pool.execute<RowDataPacket[]>(
            'SELECT id, username, nickname FROM users WHERE id = ?',
            [friendId]
          );

          if (friendData.length > 0) {
            friends.push(friendData[0]);
          }
        }
      }
    }

    return friends;
  }

  // 친구 요청 보내기
  async sendFriendRequest(body : FriendRequest) {
    const { userId, friendName } = body;
    try {
      const [friends] = await pool.execute<RowDataPacket[]>(
        'SELECT id FROM users WHERE username = ?',
        [friendName]
      );

      if (friends.length === 0) {
        throw new BadRequestException('존재하지 않는 사용자입니다.');
      }
      
      const friendId = friends[0].id;

      if (userId === friendId) {
        throw new BadRequestException('자기 자신에게는 친구 요청을 보낼 수 없습니다.');
      }
      
      const [existingRequest] = await pool.execute<RowDataPacket[]>(
        'SELECT * FROM friend_requests WHERE (senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?)',
        [userId, friendId, friendId, userId]
      );
      
      if (existingRequest.length > 0) {
        if (existingRequest[0].senderId === userId) {
          if (existingRequest[0].status === 'accepted') {
            throw new ConflictException('이미 친구인 사용자입니다.');
          } else {
            throw new ConflictException('이미 친구 요청을 보냈습니다.');
          }
        } else if (existingRequest[0].receiverId === userId) {
          await pool.execute<ResultSetHeader>(
            'UPDATE friend_requests SET status = ? WHERE senderId = ? AND receiverId = ?',
            ['accepted', friendId, userId]
          );
          return { userId: userId, friendId: friendId, status: 'accepted'};
        }
      }

      await pool.execute<ResultSetHeader>(
        'INSERT INTO friend_requests (senderId, receiverId, status) VALUES (?, ?, ?)',
        [userId, friendId, 'pending']
      );

      return { userId: userId, friendId: friendId, status: 'pending'};
    } catch (error) {
      // 예외 처리
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new InternalServerErrorException('오류가 발생했습니다.');
      }
    }
  }

  async updateProfile(userid : string, username : string, nickname: string) {
    try {
      const [users] = await pool.execute<RowDataPacket[]>(
        'SELECT nickname FROM users WHERE id = ? ',
        [Number(userid)]
      )

      if (users.length < 1) {
        throw new BadRequestException('유저가 존재하지 않습니다.');
      }

      await pool.execute(
        'UPDATE users SET nickname = ? WHERE id = ?',
        [nickname, Number(userid)]
      )

      return
    } catch (error) {
      // 예외 처리
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new InternalServerErrorException('오류가 발생했습니다.');
      }
    }
  }

  async changePassword(body : ChangePassword) {
    const { userId, currentPassword, changePassword } = body;

    try {
      const [users] = await pool.execute<RowDataPacket[]>(
        'SELECT * FROM users WHERE id = ?',
        [userId]
      )
      if (users.length < 1) throw new BadRequestException("로그인 후 이용해주세요.");

      const user = users[0];
      if (!await argon2.verify(user.password, currentPassword)) throw new BadRequestException("현재 비밀번호가 올바르지 않습니다.");
      if (changePassword.length < 7) throw new ConflictException('비밀번호는 최소 8글자 이상이어야 합니다.');

      const hashedNewPassword = await argon2.hash(changePassword);
      await pool.execute(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedNewPassword, userId]
      );

      return { ok : true } ;
    } catch (error) {
      // 예외 처리
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new InternalServerErrorException('오류가 발생했습니다.');
      }
    }
  }

  async getDelete(body : AcountDelete) {
    const { userId, currentPassword } = body;

    try {
      const [users] = await pool.execute<RowDataPacket[]>(
        'SELECT * FROM users WHERE id = ?',
        [userId]
      )
      if (users.length < 1) throw new BadRequestException("로그인 후 이용해주세요.");

      const user = users[0];
      if (!await argon2.verify(user.password, currentPassword)) throw new BadRequestException("현재 비밀번호가 올바르지 않습니다.");

      const conn = await pool.getConnection();
      await conn.beginTransaction();
      try {
        await conn.execute('DELETE FROM friend_requests WHERE senderId = ? OR receiverId = ?', [userId, userId]);
        await conn.execute('DELETE FROM users WHERE id = ?', [userId]);
        await conn.execute('DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?', [userId, userId]);
        await conn.commit();
      } catch (e) { // yee~ 율곡 2 yee~
        await conn.rollback();
        throw e;
      } finally {
        conn.release();
      }

      return { ok : true }
    } catch (error) {
      // 예외 처리
      if (error instanceof HttpException) {
        throw error;
      } else {
        throw new InternalServerErrorException('오류가 발생했습니다.');
      }
    }
  }

  async checkProfile(userid : number) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT id, username, nickname FROM users WHERE id = ?',
      [userid]
    )

    const user = rows[0]
    const result = {
      userid: user.id,
      username: user.username,
      nickname: user.nickname
    };

    return result;
  };
}