import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ChatroomService } from './chatroom.service';
import { ChatGateway } from '../chat/ChatGateway';
import { pool } from '../database';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

jest.mock('../database', () => ({
  pool: {
    query: jest.fn(),
    connect: jest.fn(),
  },
}));

describe('ChatroomService', () => {
  let service: ChatroomService;
  let chatGateway: ChatGateway;

  const mockChatGateway = {
    updateRoomList: jest.fn(),
  };

  const mockClient = {
    query: jest.fn(),
    release: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatroomService,
        { provide: ChatGateway, useValue: mockChatGateway },
      ],
    }).compile();

    service = module.get<ChatroomService>(ChatroomService);
    chatGateway = module.get<ChatGateway>(ChatGateway);

    (pool.connect as jest.Mock).mockResolvedValue(mockClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create (채팅방 생성)', () => {
    it('자기 자신과 DM을 생성하려 하면 BadRequestException을 던져야 함', async () => {
      await expect(service.create('dm', 1, 1)).rejects.toThrow(BadRequestException);
    });

    it('DM 생성 성공 시 COMMIT을 호출하고 방 ID를 반환해야 함', async () => {
      const userId = 1;
      const memberId = 2;
      
      mockClient.query
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rows: [{ id: 101 }] })
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rows: [{ user_id: 1 }, { user_id: 2 }] });

      const result = await service.create('dm', userId, memberId);

      expect(result.data).toBe(101);
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockChatGateway.updateRoomList).toHaveBeenCalledTimes(2);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('그룹 채팅 생성 시 멤버가 없으면 BadRequestException을 던져야 함', async () => {
      await expect(service.create('group', 1, undefined, [])).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne (방 상세 조회)', () => {
    it('권한이 없는 방에 접근 시 ForbiddenException을 던져야 함', async () => {
      (pool.query as jest.Mock).mockResolvedValue({ rows: [] });

      await expect(service.findOne(999, 1)).rejects.toThrow(ForbiddenException);
    });

    it('방 정보를 정상적으로 반환해야 함', async () => {
      const mockRoom = { id: 1, title: 'Test Room', room_users: [] };
      (pool.query as jest.Mock).mockResolvedValue({ rows: [mockRoom] });

      const result = await service.findOne(1, 1);
      expect(result).toEqual(mockRoom);
    });
  });

  // describe('leave (방 나가기)', () => {
  //   it('존재하지 않는 방일 경우 BadRequestException을 던져야 함', async () => {
  //     mockClient.query.mockResolvedValueOnce({ rowCount: 0 });

  //     await expect(service.leave(1, 999)).rejects.toThrow(BadRequestException);
  //   });

  //   it('방장일 경우 방 전체를 삭제(deleted_at 업데이트)해야 함', async () => {
  //     const roomId = 100;
  //     const ownerId = 1;

  //     mockClient.query
  //       .mockResolvedValueOnce({ rowCount: 1, rows: [{ type: 'group', owner_user_id: ownerId }] })
  //       .mockResolvedValueOnce({})
  //       .mockResolvedValueOnce({})
  //       .mockResolvedValueOnce({})
  //       .mockResolvedValueOnce({ rows: [{ user_id: 1 }] })
  //       .mockResolvedValueOnce({})
  //       .mockResolvedValueOnce({});

  //     await service.leave(ownerId, roomId);

  //     expect(mockClient.query).toHaveBeenCalledWith(
  //       expect.stringContaining('UPDATE room SET deleted_at'),
  //       expect.any(Array)
  //     );
  //     expect(mockChatGateway.updateRoomList).toHaveBeenCalledWith(1);
  //   });
  // });

  describe('kick (강퇴)', () => {
    it('자기 자신을 강퇴하려 하면 BadRequestException을 던져야 함', async () => {
      await expect(service.kick(1, 100, 1)).rejects.toThrow(BadRequestException);
    });

    it('방장이 아닐 경우 UnauthorizedException을 던져야 함', async () => {
      (pool.query as jest.Mock).mockResolvedValueOnce({ rowCount: 0 });

      await expect(service.kick(2, 100, 3)).rejects.toThrow(UnauthorizedException);
    });
  });
});