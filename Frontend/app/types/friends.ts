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