import { IsString } from 'class-validator';

export class FriendRequestDto {
  @IsString()
  receiverUsername: string;
}

export class HandleFriendRequestDto {
  @IsString()
  status: 'accepted' | 'rejected'
}