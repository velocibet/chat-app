import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { AuthMiddleware } from './auth.middleware';
import { UsersModule } from './users/users.module';
import { ChatModule } from './chat/chat.module';
import { ChatroomModule } from './chatroom/chatroom.module';
import { FriendsModule } from './friends/friends.module';


@Module({
  imports: [
    UsersModule,
    ChatModule,
    ChatroomModule,
    FriendsModule,
  ]
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .exclude(
        { path: 'users/login', method: RequestMethod.POST },
      )
      .exclude(
        { path: 'users/register', method: RequestMethod.POST },
      )
      .exclude(
        { path: 'users/logout', method: RequestMethod.POST },
      )
      .forRoutes({ path: 'users/*path', method: RequestMethod.ALL }); 
  }
}
