import { Module, forwardRef } from '@nestjs/common';
import { ChatGateway } from './ChatGateway';
import { ChatService } from './chat.service';
import { RedisModule } from '../redis/redis.module';
import { ChatController } from './chat.controller';
import { ChatroomService } from '../chatroom/chatroom.service';
import { FriendsModule } from '../friends/friends.module';
import { FcmModule } from '../fcm/fcm.module';
import { ChatroomModule } from '../chatroom/chatroom.module';

@Module({
  imports: [
    RedisModule,
    forwardRef(() => FriendsModule),
    forwardRef(() => ChatroomModule),
    FcmModule
  ],
  providers: [
    ChatGateway, 
    ChatService, 
  ],
  exports: [ChatService, ChatGateway],
  controllers: [ChatController],
})
export class ChatModule {}