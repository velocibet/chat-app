import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import * as express from 'express';
import * as dotenv from 'dotenv';
dotenv.config();

const cookieParser = require('cookie-parser');
const session = require('express-session');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true,
    credentials: true,
  });
  app.setGlobalPrefix('api');
  
  app.useGlobalPipes(new ValidationPipe(
    {
      whitelist: true,
      forbidNonWhitelisted: true,
      stopAtFirstError: true,

      // 첫번째 에러 메세지만 반환
      exceptionFactory: (errors) => {
      const firstError = errors[0];
      const constraints = firstError.constraints;
      const message = constraints ? Object.values(constraints)[0] : '유효성 검사 실패';
      return new BadRequestException(message);
    }
    }
  ));

  app.use('/uploads/profiles', express.static('uploads/profiles'));
  app.use(cookieParser(process.env.SESSION_SECRET));
  app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60,
      },
    }),
  );

  await app.listen(8000);
}
bootstrap();
