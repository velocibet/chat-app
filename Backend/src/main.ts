import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { TransformInterceptor } from './transform.interceptor';
import { HttpExceptionFilter } from './http-exception.filter';
import { ThrottlerExceptionFilter } from './throttler-exception.filter';
import { sessionMiddleware } from './common/session.config';
import * as express from 'express';
import cookieParser from 'cookie-parser';
import RedisStore from "connect-redis";
import Redis from 'ioredis'; 


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const expressApp = app.getHttpAdapter().getInstance() as express.Express;
  const configService = app.get(ConfigService);

  const redisClient = new Redis({
    host: '127.0.0.1',
    port: 6379,
  });

  const redisStore = new RedisStore({
    client: redisClient as any,
    prefix: 'sess:',
  });

  expressApp.set('trust proxy', 1);

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.setGlobalPrefix('api');
  app.useGlobalFilters(new ThrottlerExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      stopAtFirstError: true,
      exceptionFactory: (errors) => {
        const firstError = errors[0];
        const constraints = firstError.constraints;
        const message = constraints ? Object.values(constraints)[0] : '유효성 검사 실패';
        return new BadRequestException(message);
      },
    }),
  );

  app.use(cookieParser());
  app.use(sessionMiddleware);
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(configService.get<number>('PORT', 8000));
}

bootstrap();