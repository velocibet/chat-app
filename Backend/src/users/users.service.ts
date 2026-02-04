import { Inject, Injectable, HttpException, ConflictException, BadRequestException, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { pool } from '../database';
import { NotFound } from '@aws-sdk/client-s3';
import crypto from 'crypto';
import { RegisterDto, LoginDto, ChangePasswordDto, DeleteDto } from './dto/users.dto';

interface LoginLog {
  username: string;
  ip: string;
  agent: string;
  success: 0 | 1;
}

@Injectable()
export class UsersService {
  async createToken(email: string) {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    const expiresAt = new Date(
      Date.now() + 30 * 60 * 1000 // 30분
    );

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      await client.query(
        `DELETE FROM email_verifications WHERE email = $1`,
        [email]
      );

      await client.query(
        `INSERT INTO email_verifications (email, token_hash, expires_at)
        VALUES ($1, $2, $3)`,
        [email, tokenHash, expiresAt]
      );

      await client.query('COMMIT');
      return token;
    } catch (error) {
      await client.query('ROLLBACK');
      throw new InternalServerErrorException("알수 없는 오류가 발생했습니다.", {cause: error})
    } finally {
      client.release();
    }
  }

  async verifyToken(token: string) {
    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const { rowCount } = await pool.query(`
      UPDATE email_verifications
      SET used_at = NOW()
      WHERE token_hash = $1
        AND used_at IS NULL
        AND expires_at > NOW();
      `, [tokenHash])
    
    if (rowCount < 1) throw new BadRequestException("이미 사용되거나 만료된 인증입니다.");
    
    return "성공적으로 인증을 성공했습니다.";
  }

  /**
   * 새로운 사용자를 등록합니다. (회원가입 로직)
   * @param body 회원가입에 필요한 정보 (username, password, email)
   * @returns 생성된 사용자의 ID와 계정명을 반환합니다.
   */
  async register(body: RegisterDto) {
    const { username, password, email } = body;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const { rows: existingUsername } = await client.query(
        'SELECT id FROM users WHERE username = $1',
        [username]
      );

      if (existingUsername.length > 0) throw new ConflictException('이미 사용 중인 아이디입니다.');

      const { rows: existingEmail } = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingEmail.length > 0) throw new ConflictException('이미 사용 중인 이메일입니다.');

      const { rows: existingVerify } = await client.query(`
        SELECT email, used_at FROM email_verifications WHERE email = $1
      `, [email])

      if (existingVerify.length < 1 || !existingEmail[0].used_at) throw new UnauthorizedException("이메일 인증을 완료해주세요.");

      if (password.length < 7) throw new ConflictException('비밀번호는 최소 8글자 이상이어야 합니다.');

      const hashedPassword = await argon2.hash(password);

      const result = await client.query(
        'INSERT INTO users (username, nickname, password, email) VALUES ($1, $2, $3, $4) RETURNING id',
        [username, username, hashedPassword, email]
      );

      await client.query('COMMIT');
      return { userId: result.rows[0].id, username: username };
    } catch (error) {
      await client.query('ROLLBACK');
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException('회원가입 처리중 오류가 발생했습니다.', { cause: error });
    } finally {
      client.release();
    }
  }

  /**
   * 계정에 로그인합니다.
   * @param body 로그인에 필요한 정보 (username, password)
   * @returns 로그인의 성공 여부, 사용자의 아이디, 이름, 닉네임을 반환합니다.
   */
  async login(body: LoginDto) {
    const { username, password } = body;
    const { rows: users } = await pool.query(
      'SELECT id, username, nickname, password FROM users WHERE username = $1',
      [username]
    );

    if (users.length === 0) throw new BadRequestException('아이디 또는 비밀번호가 올바르지 않습니다.');

    const user = users[0];

    const passwordValid = await argon2.verify(user.password, password);
    if (!passwordValid) throw new BadRequestException('아이디 또는 비밀번호가 올바르지 않습니다.');

    return { success: true, userId: user.id, username: user.username, nickname: user.nickname };
  }
  
  /**
   * 사용자의 프로필을 업데이트 합니다.
   * @param userId 사용자의 아이디
   * @param username 사용자의 이름
   * @param nickname 사용자의 닉네임
   */
  async updateProfile(userId: number, username: string, nickname: string, fileName: string) {
    const client = await pool.connect();
    try {
      const { rows: users } = await client.query(
        'SELECT nickname FROM users WHERE id = $1;',
        [userId]
      );

      if (users.length < 1) throw new NotFoundException('유저가 존재하지 않습니다.');

      const result = await client.query(
        'UPDATE users SET nickname = $1, profile_url_name = $3 WHERE id = $2 RETURNING id AS userId, username, nickname, bio, profile_url_name AS profileUrlName;',
        [nickname, userId, fileName]
      );

      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException('계정 정보를 변경하던 중 오류가 발생했습니다.', { cause: error });
    } finally {
      client.release();
    }
  }

  /**
   * 로그인 로그를 DB에 저장합니다.
   * @param body DB에 저장할 사용자의 정보 (username, ip, agent, success)
   * @returns 사용자의 아이디, 이름, 닉네임을 반환합니다.
   */
  async insertLoginLog(body: LoginLog) {
    const {username, ip, agent, success} = body;

    await pool.query(
      'INSERT INTO login_logs (username, ip, agent, success) VALUES ($1, $2, $3, $4)',
      [username, ip, agent, success]
    );
  }

  /**
   * 사용자의 비밀번호를 변경합니다.
   * @param userId 사용자의 userId
   * @param body 현재 비밀번호와 변경할 비밀번호 (currentPassword, changePassword)
   * @returns 
   */
  async changePassword(userId: number, body: ChangePasswordDto) {
    const { currentPassword, changePassword } = body;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      const { rows: users } = await client.query(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );

      if (users.length < 1) throw new BadRequestException("로그인 후 이용해주세요.");

      const user = users[0];
      if (!await argon2.verify(user.password, currentPassword)) throw new BadRequestException("현재 비밀번호가 올바르지 않습니다.");
      if (changePassword.length < 7) throw new ConflictException('비밀번호는 최소 8글자 이상이어야 합니다.');

      const hashedNewPassword = await argon2.hash(changePassword);
      await client.query(
        'UPDATE users SET password = $1 WHERE id = $2',
        [hashedNewPassword, userId]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException('비밀번호를 변경하던 중 오류가 발생했습니다.', { cause: error });
    } finally {
      client.release();
    }
    return "비밀번호 변경에 성공했습니다."
  }
  
  /**
   * 사용자의 계정을 삭제합니다.
   * @param userId 사용자의 아이디 (userId)
   * @param body 사용자의 현재 계정 비밀번호 (currentPassword)
   * @returns 계정을 삭제하는데 성공하면 "계정을 성공적으로 삭제했습니다."를 반환합니다.
   */
  async remove(userId, body: DeleteDto) {
    const { currentPassword } = body;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const { rows: users } = await client.query(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );

      if (users.length < 1) throw new UnauthorizedException("로그인 후 이용해주세요.");

      const user = users[0];
      if (!await argon2.verify(user.password, currentPassword)) throw new UnauthorizedException("현재 비밀번호가 올바르지 않습니다.");

      await client.query('DELETE FROM friend_requests WHERE sender_id = $1 OR receiver_id = $1', [userId]);
      await client.query('DELETE FROM messages WHERE sender_id = $1 OR receiver_id = $1', [userId]);
      await client.query('DELETE FROM users WHERE id = $1', [userId]);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException('계정을 삭제하던 중 오류가 발생했습니다.', { cause: error });
    } finally {
      client.release();
    }
    
    return "계정을 성공적으로 삭제했습니다.";
  }

  /**
   * 사용자의 정보를 불러옵니다
   * @param userId 사용자의 현재 아이디
   * @returns 사용자의 정보를 반환합니다 (userId, username, nickname)
   */
  async findOneById(userId: number) {
    const { rows } = await pool.query(
      `SELECT id, username, nickname, bio, profile_url_name FROM users WHERE id = $1`,
      [userId]
    );

    const user = rows[0];
    const data = {
      userId: user.id,
      username: user.username,
      nickname: user.nickname,
      bio: user.bio,
      profileUrlName: user.profile_url_name
    }

    return data;
  }
}
