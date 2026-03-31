import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { RedisService } from '../redis/redis.service';
import { pool } from '../database';
import * as argon2 from 'argon2';
import { BadRequestException, ConflictException } from '@nestjs/common';

jest.mock('../database', () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn(),
  },
}));

jest.mock('argon2');

describe('UsersService', () => {
  let service: UsersService;
  let redisService: RedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: RedisService,
          useValue: {
            getClient: jest.fn().mockReturnValue({
              exists: jest.fn(),
            }),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    redisService = module.get<RedisService>(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('존재하지 않는 유저 정보로 로그인 시 BadRequestException을 던져야 함', async () => {
      const loginDto = { username: 'nonexistent', password: 'password123' };
      
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      await expect(service.login(loginDto)).rejects.toThrow(BadRequestException);
    });

    it('비밀번호가 일치하지 않으면 BadRequestException을 던져야 함', async () => {
      const loginDto = { username: 'user1', password: 'wrongpassword' };
      const mockUser = { id: 1, username: 'user1', password: 'hashed_password' };

      (pool.query as jest.Mock).mockResolvedValue({ rows: [mockUser] });
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(BadRequestException);
    });

    it('로그인 성공 시 유저 정보를 반환해야 함', async () => {
      const loginDto = { username: 'user1', password: 'correct_password' };
      const mockUser = { id: 1, username: 'user1', nickname: 'nick1', password: 'hashed_password' };

      (pool.query as jest.Mock).mockResolvedValue({ rows: [mockUser] });
      (argon2.verify as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(result).toEqual({
        success: true,
        userId: 1,
        username: 'user1',
        nickname: 'nick1',
      });
    });
  });

  describe('register', () => {
    it('개인정보 동의를 안 하면 BadRequestException을 던져야 함', async () => {
      const registerDto = { 
        username: 'newuser', 
        password: 'password123', 
        email: 'test@test.com', 
        privacyAgreement: false 
      };

      await expect(service.register(registerDto)).rejects.toThrow(BadRequestException);
    });

    it('이미 존재하는 아이디일 경우 ConflictException을 던져야 함', async () => {
      const registerDto = { 
        username: 'existing', 
        password: 'password123', 
        email: 'test@test.com', 
        privacyAgreement: true 
      };

      const clientMock = {
        query: jest.fn()
          .mockResolvedValueOnce({ rows: [] })
          .mockResolvedValueOnce({ rows: [{ id: 1 }] }),
        release: jest.fn(),
      };
      (pool.connect as jest.Mock).mockResolvedValue(clientMock);

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });
  });
});