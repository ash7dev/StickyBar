import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client!: Redis;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const url = this.config.getOrThrow<string>('REDIS_URL');

    this.client = new Redis(url, {
      tls: url.startsWith('rediss://') ? {} : undefined,
      maxRetriesPerRequest: 3,
      lazyConnect: false,
    });

    this.client.on('connect', () => this.logger.log('Redis connecté ✅ (Upstash TLS)'));
    this.client.on('error', (err: Error) => this.logger.error(`Redis erreur : ${err.message}`));
    this.client.on('reconnecting', () => this.logger.warn('Redis reconnexion...'));
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  // Retourne true si la clé a été créée (lock distribué acquis)
  async setNX(key: string, value: string, ttlSeconds: number): Promise<boolean> {
    const result = await this.client.set(key, value, 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    await this.client.expire(key, ttlSeconds);
  }

  async sadd(key: string, ...members: string[]): Promise<number> {
    return this.client.sadd(key, ...members);
  }

  async sismember(key: string, member: string): Promise<boolean> {
    const result = await this.client.sismember(key, member);
    return result === 1;
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    return this.client.srem(key, ...members);
  }

  getClient(): Redis {
    return this.client;
  }
}
