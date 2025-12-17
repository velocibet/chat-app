import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import * as express from 'express';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import session from 'express-session';
const cookieParser = require('cookie-parser');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const expressApp = app.getHttpAdapter().getInstance() as express.Express;

  // nginx 프록시 신뢰
  expressApp.set('trust proxy', 1);

  app.enableCors({
    origin: true, //['https://velocibet.com', 'https://www.velocibet.com'],
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

  if (!process.env.SESSION_SECRET) {
    console.error("SESSION_SECRET is not defined");
  }

  app.use('/uploads/profiles', express.static('uploads/profiles'));
  app.use(cookieParser());
  app.use(
    session({
      secret: process.env.SESSION_SECRET!,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 1000 * 60 * 60 * 12,
      },
    }),
  );

  await app.listen(8000);
}
bootstrap();
