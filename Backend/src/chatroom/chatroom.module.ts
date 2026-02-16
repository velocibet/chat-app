import { Module, forwardRef } from '@nestjs/common';
import { ChatroomController } from './chatroom.controller';
import { ChatroomService } from './chatroom.service';
import { ChatModule } from 'src/chat/chat.module';

@Module({
  imports: [forwardRef(() => ChatModule)],
  controllers: [ChatroomController],
  providers: [ChatroomService]
})
export class ChatroomModule {}
