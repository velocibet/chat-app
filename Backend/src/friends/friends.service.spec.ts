import { Test, TestingModule } from '@nestjs/testing';
import { FriendsService } from './friends.service';
import { ChatService } from '../chat/chat.service';
import { pool } from '../database';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

jest.mock('../database', () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn(),
  },
}));

describe('FriendsService', () => {
  let service: FriendsService;
  let chatService: ChatService;

  const mockChatService = {
    getUsersStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FriendsService,
        { provide: ChatService, useValue: mockChatService },
      ],
    }).compile();

    service = module.get<FriendsService>(FriendsService);
    chatService = module.get<ChatService>(ChatService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create (친구 요청)', () => {
    const mockGateway = {
      sendFriendRequest: jest.fn(),
    };

    it('자기 자신에게 친구 요청을 보내면 BadRequestException을 던져야 함', async () => {
      const username = 'user1';
      const body = { receiverUsername: 'user1' };

      await expect(service.create(username, body, mockGateway)).rejects.toThrow(BadRequestException);
    });

    it('친구 요청 성공 시 성공 메시지를 반환하고 게이트웨이 알림을 보내야 함', async () => {
      const sender = 'user1';
      const receiver = 'user2';
      const body = { receiverUsername: receiver };

      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ id: 10, status: 'pending' }] })
        .mockResolvedValueOnce({ rows: [{ id: 2, username: receiver, nickname: 'nick2' }] })
        .mockResolvedValueOnce({ rows: [{ id: 1, username: sender, nickname: 'nick1' }] });

      const result = await service.create(sender, body, mockGateway);

      expect(result).toBe('친구를 성공적으로 요청했습니다.');
      expect(mockGateway.sendFriendRequest).toHaveBeenCalledWith(2, {
        senderUsername: sender,
        senderNickname: 'nick1',
        senderId: 1,
      });
    });

    it('이미 친구이거나 유저가 없어서 INSERT 실패 시 ConflictException을 던져야 함', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({ rows: [] });

      await expect(service.create('u1', { receiverUsername: 'u2' }, mockGateway)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAllFriends (친구 목록 조회)', () => {
    it('친구 목록과 함께 온라인 상태를 병합하여 반환해야 함', async () => {
      const userId = 1;
      const mockFriends = [
        { userId: 2, username: 'friend1', nickname: 'f1' },
        { userId: 3, username: 'friend2', nickname: 'f2' },
      ];
      const mockStatuses = [
        { userId: 2, isOnline: true },
        { userId: 3, isOnline: false },
      ];

      (pool.query as jest.Mock).mockResolvedValue({ rows: mockFriends });
      mockChatService.getUsersStatus.mockResolvedValue(mockStatuses);

      const result = await service.findAllFriends(userId);

      expect(result).toHaveLength(2);
      expect(result[0].isOnline).toBe(true);
      expect(result[1].isOnline).toBe(false);
    });
  });

  describe('getBlock (차단하기)', () => {
    it('차단 성공 시 트랜잭션을 커밋하고 메시지를 반환해야 함', async () => {
      const clientMock = {
        query: jest.fn()
          .mockResolvedValueOnce({})
          .mockResolvedValueOnce({ rows: [{ id: 100 }] })
          .mockResolvedValueOnce({ rows: [] })
          .mockResolvedValueOnce({}),
        release: jest.fn(),
      };
      (pool.connect as jest.Mock).mockResolvedValue(clientMock);

      const result = await service.getBlock('me', 'enemy');

      expect(result).toBe('성공적으로 상대방을 차단했습니다.');
      expect(clientMock.query).toHaveBeenCalledWith('COMMIT');
      expect(clientMock.release).toHaveBeenCalled();
    });

    it('이미 차단된 유저인 경우 ConflictException을 던지고 롤백해야 함', async () => {
      const clientMock = {
        query: jest.fn()
          .mockResolvedValueOnce({})
          .mockResolvedValueOnce({ rows: [] })
          .mockResolvedValueOnce({}),
        release: jest.fn(),
      };
      (pool.connect as jest.Mock).mockResolvedValue(clientMock);

      await expect(service.getBlock('me', 'enemy')).rejects.toThrow(ConflictException);
      expect(clientMock.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });
});