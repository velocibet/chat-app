import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TransformInterceptor } from './transform.interceptor';
import { HttpExceptionFilter } from './http-exception.filter';
import { ThrottlerExceptionFilter } from './throttler-exception.filter';
import * as express from 'express';
import * as dotenv from 'dotenv';
import * as path from 'path';

import RedisStore from "connect-redis";
import session from "express-session";
import Redis from 'ioredis'; 

const cookieParser = require('cookie-parser');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export let sessionMiddleware: any;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const expressApp = app.getHttpAdapter().getInstance() as express.Express;

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

  sessionMiddleware = session({
    store: redisStore,
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.SECURE === 'true',
      sameSite: (process.env.SAMESITE as any) || 'lax',
      maxAge: 1000 * 60 * 60 * 12,
    },
  });

  app.use(cookieParser());
  app.use(sessionMiddleware);
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(process.env.PORT || 3000);
}

bootstrap();