import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FriendsService } from './friends.service';
import { FriendsController } from './friends.controller';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [
    forwardRef(() => ChatModule),
    ConfigModule
  ],
  controllers: [FriendsController],
  providers: [FriendsService],
  exports: [FriendsService]
})
export class FriendsModule {}
