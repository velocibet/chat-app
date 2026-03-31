import { Module, forwardRef } from '@nestjs/common';
import { ChatroomController } from './chatroom.controller';
import { ChatroomService } from './chatroom.service';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [forwardRef(() => ChatModule)],
  controllers: [ChatroomController],
  providers: [ChatroomService],
  exports: [ChatroomService]
})
export class ChatroomModule {}