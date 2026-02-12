export interface FriendRequestDto {
  receiverUsername: string;
}

export interface HandleFriendRequestDto {
  status: 'accepted' | 'rejected';
}

export interface Friend {
  userId: number;
  username: string;
  nickname: string;
}

export interface Block {
  id: number;
  blocker_id: number;
  blocked_id: number;
  created_at: Date;
  username: string;
  nickname: string;
}
