import { Module } from '@nestjs/common';
import { ChatGateway } from './ChatGateway';
import { ChatService } from './chat.service';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  providers: [ChatGateway, ChatService],
  imports: [RedisModule],
  exports: [ChatService, ChatGateway]
})
export class ChatModule {}
