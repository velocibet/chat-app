import { Module, forwardRef } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { ChatModule } from '../chat/chat.module'

@Module({
  imports: [forwardRef(() => ChatModule)],
  controllers: [UsersController],
  providers: [UsersService]
})
export class UsersModule {}
