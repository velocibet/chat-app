import { Inject, Injectable, HttpException, ConflictException, BadRequestException, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { pool } from '../database';

interface Login {
  username: string;
  password: string;
}

@Injectable()
export class AdminService {
    async login(body : Login) {
        const { username, password } = body;
        try {
          // 사용자 조회
          const { rows: users } = await pool.query(
            'SELECT id, username, nickname, password FROM users WHERE username = $1',
            [username]
          );
    
          if (users.length === 0) {
            throw new BadRequestException('존재하지 않는 아이디입니다.');
          }

          const user = users[0];
          
          // 관리자 유저 검증
          const { rows: adminusers } = await pool.query(
            'SELECT * FROM admin_users WHERE "userId" = $1',
            [user.id]
          );

          if (adminusers.length === 0) {
            throw new UnauthorizedException('접근할수 없는 경로입니다.');
          }
    
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
}
