import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { TypeNotification } from '@prisma/client';
import { NotificationDispatcherService } from '../../notification-dispatcher/notification-dispatcher.service';

interface NotificationPayload {
  userId: string;
  type: string;
  payload: Record<string, unknown>;
  reservationId?: string;
}

@Processor('notification-jobs')
export class NotificationJob {
  private readonly logger = new Logger(NotificationJob.name);

  constructor(private readonly dispatcher: NotificationDispatcherService) {}

  @Process('send-notification')
  async handle(job: Job<NotificationPayload>) {
    const { userId, type, payload, reservationId } = job.data;
    this.logger.log(`[send-notification] userId=${userId} type=${type}`);
    await this.dispatcher.dispatch({
      userId,
      type: type as TypeNotification,
      payload,
      reservationId,
    });
  }
}
