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
