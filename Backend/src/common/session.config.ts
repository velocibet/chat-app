// src/common/session.config.ts
import session from "express-session";
import RedisStore from "connect-redis";
import Redis from 'ioredis';

const redisClient = new Redis({
  host: '127.0.0.1',
  port: 6379,
});

const redisStore = new RedisStore({
  client: redisClient as any,
  prefix: 'sess:',
});

export const sessionMiddleware = session({
  store: redisStore,
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.SECURE === 'true',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 12,
  },
});