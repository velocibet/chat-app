import { Inject, Injectable, HttpException, ConflictException, BadRequestException, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { pool } from '../database';
import { NotFound } from '@aws-sdk/client-s3';
import crypto from 'crypto';
import { RegisterDto, LoginDto, ChangePasswordDto, DeleteDto } from './dto/users.dto';
import { RedisService } from 'src/redis/redis.service';

interface LoginLog {
  username: string;
  ip: string;
  agent: string;
  success: 0 | 1;
}

@Injectable()
export class UsersService {
  constructor(
    private readonly redisService: RedisService
  ) {}
  
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
    const {
      // 유저 정보 값
      username, password, email, privacyAgreement,
      // 암호화 관련 값
      publicKey, encryptedPrivateKey, encryptedServerSeed, encryptionSalt, encryptionIv, seedEncryptionIv,
      // 유저 식별 값
      clientId
    } = body;

    // 개인정보처리방침에 동의하지 않았다면 가입 불가
    if (!privacyAgreement) {
      throw new BadRequestException('개인정보처리방침에 동의해야 가입할 수 있습니다.');
    }

    // clientId로부터 임시 시드 검증
    const redis = this.redisService.getClient();
    const tempSeedKey = `temp_seed:${clientId}`;
    const tempSeed = await redis.get(tempSeedKey);

    if (!tempSeed) {
      throw new BadRequestException('세션이 만료되었습니다. 회원가입을 다시 시작해주세요.');
    }

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
        SELECT email, used_at
        FROM email_verifications
        WHERE email = $1
      `, [email])

      if (existingVerify.length < 1 || !existingVerify[0].used_at) throw new UnauthorizedException("이메일 인증을 완료해주세요.");

      if (password.length < 7) throw new ConflictException('비밀번호는 최소 8글자 이상이어야 합니다.');

      const hashedPassword = await argon2.hash(password);

      const userResult = await client.query(
        `INSERT INTO users (
          username,
          nickname,
          password,
          email
          ) VALUES ($1, $2, $3, $4)
          RETURNING id, user_id`,
        [
          username,
          username,
          hashedPassword,
          email
        ]
      );

      // const newUserId = userResult.rows[0].id;

      const newInternalId = userResult.rows[0].id;
      const newUserUuid = userResult.rows[0].user_id;

      await client.query(
        `INSERT INTO user_security_keys (
          user_id, 
          public_key, 
          encrypted_private_key, 
          encryption_salt, 
          encryption_iv,
          encrypted_server_seed,
          seed_encryption_iv
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          newInternalId,
          publicKey,
          encryptedPrivateKey,
          encryptionSalt,
          encryptionIv,
          encryptedServerSeed,
          seedEncryptionIv
        ]
      );

      // serverSeed는 Redis에서만 임시로 관리 (TTL 없음, 계정 당 1개 유지)
      const sessionSeedKey = `session_seed:${newUserUuid}`;
      await redis.set(sessionSeedKey, tempSeed);
      
      // 등록용 임시 시드 삭제
      await redis.del(tempSeedKey);

      await client.query('COMMIT');
      return {
        userId: newUserUuid,
        username: username,
        serverSeed: tempSeed
      };
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
    const redis = this.redisService.getClient();

    // 유저 정보와 보안 키 정보를 JOIN으로 한꺼번에 가져옴
    const { rows: users } = await pool.query(
      `SELECT 
          u.id, u.username, u.nickname, u.password,
          sk.public_key, sk.encrypted_private_key, sk.encryption_salt, sk.encryption_iv,
          sk.encrypted_server_seed, sk.seed_encryption_iv
      FROM users u
      LEFT JOIN user_security_keys sk ON u.id = sk.user_id
      WHERE u.username = $1`,
      [username]
    );

    if (users.length === 0) {
      throw new UnauthorizedException('아이디 또는 비밀번호가 올바르지 않습니다.');
    }

    const user = users[0];

    // 비밀번호 검증 (Argon2)
    const passwordValid = await argon2.verify(user.password, password);
    if (!passwordValid) {
      throw new UnauthorizedException('아이디 또는 비밀번호가 올바르지 않습니다.');
    }

    // 기존 시드(oldServerSeed) 및 새 시드(newServerSeed) 처리
    const sessionSeedKey = `session_seed:${user.id}`;
    const oldServerSeed = await redis.get(sessionSeedKey);
    
    // 새 시드 생성
    const newServerSeed = crypto.randomBytes(32).toString('hex');
    await redis.set(sessionSeedKey, newServerSeed);

    // 고유 세션 아이디 생성 (UUID)
    const sessionId = crypto.randomUUID();
    const sessionKey = `session:${sessionId}`;

    // Redis에 세션 데이터 저장 (7일 만료)
    const sessionData = {
      userId: user.id,
      username: user.username,
      nickname: user.nickname,
      serverSeed: newServerSeed,
    };

    await redis.set(
      sessionKey, 
      JSON.stringify(sessionData), 
      'EX', 
      60 * 60 * 24 * 7
    );

    return {
      success: true,
      userId: user.id,
      username: user.username,
      nickname: user.nickname,

      // 클라이언트가 개인키를 복구하고 재암호화(Key Rotation)할 수 있도록 재료 전달
      security: {
        publicKey: user.public_key,
        encryptedPrivateKey: user.encrypted_private_key,
        encryptionSalt: user.encryption_salt,
        encryptionIv: user.encryption_iv,
        encryptedServerSeed: user.encrypted_server_seed,
        seedEncryptionIv: user.seed_encryption_iv,
        oldServerSeed: oldServerSeed,
        newServerSeed: newServerSeed
      }
    };
  }

  /**
   * 클라이언트 등록 세션을 위한 임시 시드를 발급합니다.
   * @param clientId 클라이언트에서 생성한 UUID
   * @returns 발급된 serverSeed (hex 문자열)
   */
  async generateSeed(clientId: string) {
    const redis = this.redisService.getClient();
    const serverSeed = crypto.randomBytes(32).toString('hex');
    const tempSeedKey = `temp_seed:${clientId}`;

    // 10분 TLS 제한
    const expirationSeconds = 600;

    await redis.set(tempSeedKey, serverSeed, 'EX', expirationSeconds);

    return { serverSeed };
  }

  /**
   * 암호화 키 해독에 필요한 ServerSeed를 UserId와 매핑시켜 저장합니다.
   * 클라이언트는 ServerSeed를 알아야만 개인 키를 해독할수 있습니다.
   * @param userId 
   * @param serverSeed 
   * @returns 
   */
  async saveSessionSeed(userId: number, serverSeed: string) {
    const redis = this.redisService.getClient();

    const key = `user_seed:${userId}`;
    const expirationSeconds = 3600 * 24; // 24시간

    await redis.set(key, serverSeed, 'EX', expirationSeconds);

    // ServerSeed 값 덮어쓰기
    // 이전 ServerSeed는 사용 불가
    return { success: true, message: "Server seed saved to Redis" };
  }
  
  /**
   * 사용자의 프로필을 업데이트 합니다.
   * @param userId 사용자의 아이디
   * @param username 사용자의 이름
   * @param nickname 사용자의 닉네임
   */
  async updateProfile(userId: number, username: string, nickname: string, bio?: string, fileName?: string) {
    const client = await pool.connect();
    try {
      const { rows: users } = await client.query(
        'SELECT nickname FROM users WHERE id = $1;',
        [userId]
      );

      if (users.length < 1) throw new NotFoundException('유저가 존재하지 않습니다.');

      if (fileName) {
        const result = await client.query(`
          UPDATE users
          SET nickname = $1, profile_url_name = $3, bio = $4
          WHERE id = $2
          RETURNING id AS userId, username, nickname, bio, profile_url_name AS profileUrlName;
          `, [nickname, userId, fileName, bio]
        );

        return result.rows[0];
      } else {
        const result = await client.query(`
          UPDATE users
          SET nickname = $1, bio = $3
          WHERE id = $2
          RETURNING id AS userId, username, nickname, bio, profile_url_name AS profileUrlName;
          `, [nickname, userId, bio]
        );

        return result.rows[0];
      }
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

    if (!rows[0]) throw new UnauthorizedException("권한이 없습니다.");

    const user = rows[0];

    const redis = this.redisService.getClient();
    const result = await redis.exists(`user:online:${userId}`);

    const data = {
      userId: user.id,
      username: user.username,
      nickname: user.nickname,
      bio: user.bio,
      profileUrlName: user.profile_url_name,
      isOnline: result === 1,
    };

    return data;
  }


  /**
   * 로그인 후 Key Rotation으로 개인키를 업데이트합니다.
   * @param userId 사용자 아이디
   * @param body 새로운 암호화된 개인키 정보
   */
  async updatePrivateKey(userId: number, body: any) {
    const { publicKey, encryptedPrivateKey, encryptionSalt, encryptionIv } = body;
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `UPDATE user_security_keys
         SET public_key = $1,
             encrypted_private_key = $2,
             encryption_salt = $3,
             encryption_iv = $4
         WHERE user_id = $5`,
        [publicKey, encryptedPrivateKey, encryptionSalt, encryptionIv, userId]
      );

      await client.query('COMMIT');
      return { success: true, message: "개인키가 성공적으로 업데이트되었습니다." };
    } catch (error) {
      await client.query('ROLLBACK');
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('개인키 업데이트 중 오류가 발생했습니다.', { cause: error });
    } finally {
      client.release();
    }
  }

  /**
   * 저장된 푸시 토큰을 사용자별로 등록/업데이트합니다.
   * @param userId 사용자 아이디
   * @param token FCM에서 발급받은 토큰 문자열
   * @param deviceType (선택) 디바이스 유형
   */
  async savePushToken(userId: number, token: string, deviceType?: string) {
    if (!token) return;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { rows } = await client.query(
        `SELECT id FROM user_push_tokens WHERE "userId" = $1 AND token = $2`,
        [userId, token]
      );

      if (rows.length > 0) {
        await client.query(
          `UPDATE user_push_tokens
           SET "deviceType" = $2, "updatedAt" = NOW()
           WHERE id = $3`,
          [token, deviceType, rows[0].id]
        );
      } else {
        await client.query(
          `INSERT INTO user_push_tokens ("userId", token, "deviceType")
           VALUES ($1::int, $2::text, $3::text)`,
          [userId, token, deviceType]
        );
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  }

  /**
   * 주어진 사용자 목록에 속한 모든 토큰을 가져옵니다.
   */
  async getPushTokens(userIds: number[]) {
    if (!userIds || userIds.length === 0) return [];
    const { rows } = await pool.query(
      `SELECT token FROM user_push_tokens WHERE "userId" = ANY($1::int[])`,
      [userIds]
    );
    const tokens = Array.from(new Set(rows.map(r => r.token)));
    return tokens;
  }
}
