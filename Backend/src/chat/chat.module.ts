import { Module, forwardRef } from '@nestjs/common';
import { ChatGateway } from './ChatGateway';
import { ChatService } from './chat.service';
import { RedisModule } from 'src/redis/redis.module';
import { ChatController } from './chat.controller';
import { ChatroomService } from 'src/chatroom/chatroom.service';
import { FriendsModule } from 'src/friends/friends.module';
import { FcmModule } from 'src/fcm/fcm.module';

@Module({
  providers: [ChatGateway, ChatService, ChatroomService],
  imports: [
    RedisModule,
    forwardRef(() => FriendsModule),
    FcmModule
  ],
  exports: [ChatService, ChatGateway],
  controllers: [ChatController],
})
export class ChatModule {}