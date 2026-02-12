import { Module } from '@nestjs/common';
import { ChatGateway } from './ChatGateway';
import { ChatService } from './chat.service';
import { RedisModule } from 'src/redis/redis.module';
import { ChatController } from './chat.controller';
import { ChatroomService } from 'src/chatroom/chatroom.service';

@Module({
  providers: [ChatGateway, ChatService, ChatroomService],
  imports: [RedisModule],
  exports: [ChatService, ChatGateway],
  controllers: [ChatController]
})
export class ChatModule {}
