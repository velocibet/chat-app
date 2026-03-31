import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { RedisService } from '../redis/redis.service';
import { pool } from '../database';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';

jest.mock('../database', () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn(),
  },
}));

describe('ChatService', () => {
  let service: ChatService;
  let redisService: RedisService;

  const mockRedisClient = {
    set: jest.fn(),
    mget: jest.fn(),
    exists: jest.fn(),
  };

  const mockRedisService = {
    getClient: jest.fn().mockReturnValue(mockRedisClient),
  };

  const mockChatroomService = {
    findOne: jest.fn(),
  };

  const mockDbClient = {
    query: jest.fn(),
    release: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: RedisService, useValue: mockRedisService },
        { provide: 'ChatroomService', useValue: mockChatroomService },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    redisService = module.get<RedisService>(RedisService);
    
    (pool.connect as jest.Mock).mockResolvedValue(mockDbClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Redis 연동 (Online Status)', () => {
    it('setUserOnline: 유저 상태를 Redis에 30초 동안 저장해야 함', async () => {
      await service.setUserOnline('1');
      expect(mockRedisClient.set).toHaveBeenCalledWith('user:online:1', '1', 'EX', 30);
    });

    it('getUsersStatus: 여러 유저의 온라인 상태를 한 번에 가져와야 함', async () => {
      const userIds = [1, 2];
      mockRedisClient.mget.mockResolvedValue(['1', null]);

      const result = await service.getUsersStatus(userIds);

      expect(result).toEqual([
        { userId: 1, isOnline: true },
        { userId: 2, isOnline: false },
      ]);
      expect(mockRedisClient.mget).toHaveBeenCalledWith('user:online:1', 'user:online:2');
    });
  });

  describe('sendMessage (메시지 전송 및 트랜잭션)', () => {
    it('메시지를 저장하고 읽지 않은 유저들의 unread_count를 올려야 함', async () => {
      const senderId = 1;
      const roomId = 100;
      const activeIds = [1, 2];
      const mockMsg = { id: 50, content: 'hello' };

      mockDbClient.query
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rows: [mockMsg] })
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({});

      const result = await service.sendMessage(senderId, roomId, 'hello', activeIds);

      expect(result).toEqual(mockMsg);
      expect(mockDbClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockDbClient.release).toHaveBeenCalled();
    });

    it('에러 발생 시 ROLLBACK을 호출해야 함', async () => {
      mockDbClient.query.mockResolvedValueOnce({});
      mockDbClient.query.mockRejectedValueOnce(new Error('DB Error'));

      await expect(service.sendMessage(1, 100, 'h', [])).rejects.toThrow('DB Error');
      expect(mockDbClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockDbClient.release).toHaveBeenCalled();
    });
  });

  describe('loadMessages (메시지 페이징 조회)', () => {
    it('lastId가 있을 때 이전 메시지를 쿼리해야 함', async () => {
      const userId = 1;
      const roomId = '100';
      const limit = 10;
      const lastId = 50;

      (pool.query as jest.Mock).mockResolvedValue({ rows: [{ id: 49 }, { id: 48 }] });

      const result = await service.loadMessages(userId, roomId, limit, lastId);

      expect(result[0].id).toBe(48);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('m.id < $2'),
        [roomId, lastId, userId, limit]
      );
    });
  });

  describe('readMessage (읽음 처리)', () => {
    it('성공 시 아무것도 반환하지 않아야 함', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rowCount: 1 });
      await expect(service.readMessage(1, 100)).resolves.toBeUndefined();
    });

    it('권한이 없거나 업데이트 실패 시 UnauthorizedException을 던져야 함', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rowCount: 0 });
      await expect(service.readMessage(1, 100)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getImageUrl', () => {
    it('이미지가 없으면 NotFoundException을 던져야 함', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });
      await expect(service.getImageUrl('123')).rejects.toThrow(NotFoundException);
    });
  });
});