import { Module } from '@nestjs/common';
import { ChatGateway } from './ChatGateway';
import { ChatService } from './chat.service';

@Module({
  providers: [ChatGateway, ChatService],
  exports: [ChatService, ChatGateway]
})
export class ChatModule {}
