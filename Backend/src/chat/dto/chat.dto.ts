import { IsString, IsNumber } from 'class-validator';

export class joinDirectRoom {
  @IsNumber()
  roomId: number;
}

export class sendMessage {
  @IsNumber()
  senderId: number;

  @IsNumber()
  roomId: number;

  @IsString()
  content: string;

  @IsNumber()
  isfile: number;
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
  roomId: number;

  @IsString()
  content: string;
}

