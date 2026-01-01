import { IsString, IsNumber } from 'class-validator';

export class joinDirectRoom {
  @IsNumber()
  userId1: number;

  @IsNumber()
  userId2: number;
}

export class sendMessage {
  @IsNumber()
  fromId: number;

  @IsNumber()
  toId: number;

  @IsString()
  content: string;
}

export class previousMessage {
  @IsNumber()
  fromId: number;

  @IsNumber()
  toId: number;
}

export class deleteMessage {
  @IsNumber()
  messageId: number;
  
  @IsNumber()
  userId1: number;

  @IsNumber()
  userId2: number;

  @IsString()
  content: string;
}