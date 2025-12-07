import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

import cors from 'cors';
import * as express from 'express';
import * as dotenv from 'dotenv';
dotenv.config();

const cookieParser = require('cookie-parser');
const session = require('express-session');

import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true,
    credentials: true,
  });
  app.setGlobalPrefix('api');
  app.use('/uploads/profiles', express.static('uploads/profiles'));
  app.use(cookieParser());
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
