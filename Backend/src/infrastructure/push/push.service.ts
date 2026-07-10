import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

// Requires: npm install web-push @types/web-push
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-explicit-any
const webPush: any | null = (() => {
  try { return require('web-push'); } catch { return null; }
})();

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  data?: Record<string, unknown>;
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly ready: boolean;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const vapidPublic  = config.get<string>('VAPID_PUBLIC_KEY', '');
    const vapidPrivate = config.get<string>('VAPID_PRIVATE_KEY', '');
    const vapidEmail   = config.get<string>('VAPID_EMAIL', 'contact@immoloc.sn');

    if (webPush && vapidPublic && vapidPrivate) {
      webPush.setVapidDetails(`mailto:${vapidEmail}`, vapidPublic, vapidPrivate);
      this.ready = true;
    } else {
      this.logger.warn('[Push] Non configuré — installez web-push et définissez VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY');
      this.ready = false;
    }
  }

  async sendToUser(userId: string, payload: PushPayload): Promise<number> {
    if (!this.ready || !webPush) return 0;

    const subscriptions = await this.prisma.pushSubscription.findMany({ where: { userId } });
    if (!subscriptions.length) return 0;

    let sent = 0;
    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webPush!.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify(payload),
          );
          sent++;
        } catch (e: any) {
          if (e?.statusCode === 410) {
            await this.prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => null);
          } else {
            this.logger.warn(`[Push] Échec envoi ${sub.endpoint}: ${e?.message}`);
          }
        }
      }),
    );

    return sent;
  }
}
