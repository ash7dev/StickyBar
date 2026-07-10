import { Module } from '@nestjs/common';
import { NotificationDispatcherService } from './notification-dispatcher.service';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { PushModule } from '../push/push.module';

@Module({
  imports: [WhatsAppModule, PushModule],
  providers: [NotificationDispatcherService],
  exports: [NotificationDispatcherService],
})
export class NotificationDispatcherModule {}
