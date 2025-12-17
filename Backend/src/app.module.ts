import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AuthMiddleware } from './auth.middleware';
import { UsersModule } from './users/users.module';
import { ChatModule } from './chat/chat.module';
import { join } from 'path';
import { AdminModule } from './admin/admin.module';


@Module({
  imports: [
    UsersModule,
    ChatModule,
    // ServeStaticModule.forRoot({
    //   rootPath: join(__dirname, '..', 'nuxt-dist')
    // }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads', // 브라우저에서 접근할 URL prefix
    }),
    AdminModule,
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
