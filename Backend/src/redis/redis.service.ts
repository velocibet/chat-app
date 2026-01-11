import Redis from 'ioredis';
import { Injectable, OnModuleDestroy } from '@nestjs/common';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis;

  constructor() {
    this.client = new Redis({
      host: '127.0.0.1',
      port: 6379,
    });
  }

  getClient() {
    return this.client;
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}
