import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { AuthMiddleware } from './auth.middleware';
import { UsersModule } from './users/users.module';
import { ChatModule } from './chat/chat.module';
import { ChatroomModule } from './chatroom/chatroom.module';
import { FriendsModule } from './friends/friends.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { FcmModule } from './fcm/fcm.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60 * 1000,
        limit: 100,
      },
    ]),
    UsersModule,
    ChatroomModule,
    FriendsModule,
    FcmModule,
    ChatModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
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
