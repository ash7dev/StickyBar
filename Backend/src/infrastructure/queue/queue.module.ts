import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { QueueService } from './queue.service';
import { CronJobsService } from './cron-jobs.service';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        const url = config.getOrThrow<string>('REDIS_URL');
        const parsed = new URL(url);
        return {
          redis: {
            host: parsed.hostname,
            port: parseInt(parsed.port, 10),
            password: parsed.password,
            username: parsed.username || 'default',
            tls: parsed.protocol === 'rediss:' ? {} : undefined,
            maxRetriesPerRequest: null, // Requis par Bull
            enableReadyCheck: false,
            connectTimeout: 10_000,
            retryStrategy: (times: number) => {
              if (times > 10) return null; // Stop après 10 essais
              return Math.min(times * 200, 5000);
            },
          },
        };
      },
      inject: [ConfigService],
    }),

    BullModule.registerQueue(
      { name: 'reservation-jobs' },
      { name: 'notification-jobs' },
      { name: 'absence-jobs' },
    ),
  ],
  providers: [QueueService, CronJobsService],
  exports: [QueueService, BullModule],
})
export class QueueModule {}
