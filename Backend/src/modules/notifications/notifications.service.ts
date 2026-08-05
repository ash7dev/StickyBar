import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import * as webpush from 'web-push';
import { SubscribePushDto } from './dto/subscribe-push.dto';
import { SendTestPushDto } from './dto/send-test-push.dto';
import { PushSubscription } from '@prisma/client';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private vapidPublicKey!: string;
  private vapidPrivateKey!: string;
  private vapidSubject!: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    let publicKey = this.configService.get<string>('VAPID_PUBLIC_KEY');
    let privateKey = this.configService.get<string>('VAPID_PRIVATE_KEY');
    const subject = this.configService.get<string>('VAPID_SUBJECT') || 'mailto:contact@klef.sn';

    if (!publicKey || !privateKey) {
      this.logger.warn('Clés VAPID absentes des variables d\'environnement. Génération automatique d\'une paire VAPID temporaire...');
      const vapidKeys = webpush.generateVAPIDKeys();
      publicKey = vapidKeys.publicKey;
      privateKey = vapidKeys.privateKey;
      this.logger.log(`Clé VAPID Publique générée : ${publicKey}`);
    }

    this.vapidPublicKey = publicKey;
    this.vapidPrivateKey = privateKey;
    this.vapidSubject = subject;

    webpush.setVapidDetails(this.vapidSubject, this.vapidPublicKey, this.vapidPrivateKey);
    this.logger.log('Service Web Push VAPID initialisé avec succès !');
  }

  getVapidPublicKey(): { publicKey: string } {
    return { publicKey: this.vapidPublicKey };
  }

  async subscribe(dto: SubscribePushDto, currentUserId?: string) {
    const targetUserId = dto.userId || currentUserId;

    if (!targetUserId) {
      throw new Error('Un utilisateur valide doit être associé à l\'abonnement Push.');
    }

    const subscription = await this.prisma.pushSubscription.upsert({
      where: { endpoint: dto.endpoint },
      create: {
        endpoint: dto.endpoint,
        p256dh: dto.keys.p256dh,
        auth: dto.keys.auth,
        userId: targetUserId,
        userAgent: dto.userAgent,
        deviceType: dto.deviceType,
      },
      update: {
        p256dh: dto.keys.p256dh,
        auth: dto.keys.auth,
        userId: targetUserId,
        userAgent: dto.userAgent,
        deviceType: dto.deviceType,
      },
    });

    this.logger.log(`Abonnement Push enregistré pour l'utilisateur ${targetUserId}`);
    return { success: true, subscriptionId: subscription.id };
  }

  async unsubscribe(endpoint: string) {
    await this.prisma.pushSubscription.deleteMany({
      where: { endpoint },
    });
    this.logger.log(`Abonnement Push supprimé pour l'endpoint ${endpoint}`);
    return { success: true };
  }

  async sendNotificationToUser(userId: string, title: string, message: string, url: string = '/') {
    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (subscriptions.length === 0) {
      this.logger.warn(`Aucun appareil abonné au Push pour l'utilisateur ${userId}`);
      return { success: false, sentCount: 0 };
    }

    const payload = JSON.stringify({
      title,
      body: message,
      icon: '/icon.svg',
      badge: '/icon.svg',
      data: { url },
    });

    let sentCount = 0;

    await Promise.all(
      subscriptions.map(async (sub: PushSubscription) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        try {
          await webpush.sendNotification(pushSubscription, payload);
          sentCount++;
        } catch (error: any) {
          this.logger.error(`Erreur d'envoi Push vers ${sub.endpoint}: ${error.message}`);
          if (error.statusCode === 410 || error.statusCode === 404) {
            await this.prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
          }
        }
      }),
    );

    return { success: true, sentCount };
  }

  async sendTestNotification(dto: SendTestPushDto, currentUserId?: string) {
    const title = dto.title || 'Klef - Test Notification Push 🚀';
    const message = dto.message || 'Félicitations ! Vos notifications Push Web PWA sont fonctionnelles !';
    const url = dto.url || '/explorer';

    if (dto.endpoint) {
      const sub = await this.prisma.pushSubscription.findUnique({
        where: { endpoint: dto.endpoint },
      });

      if (sub) {
        const payload = JSON.stringify({
          title,
          body: message,
          icon: '/icon.svg',
          badge: '/icon.svg',
          data: { url },
        });

        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
        );
        return { success: true, sentCount: 1 };
      }
    }

    const targetUserId = dto.userId || currentUserId;
    if (targetUserId) {
      return this.sendNotificationToUser(targetUserId, title, message, url);
    }

    const latestSubs = await this.prisma.pushSubscription.findMany({
      take: 5,
      orderBy: { creeLe: 'desc' },
    });

    if (latestSubs.length === 0) {
      return { success: false, message: 'Aucun appareil inscrit pour recevoir la notification de test.' };
    }

    const payload = JSON.stringify({
      title,
      body: message,
      icon: '/icon.svg',
      badge: '/icon.svg',
      data: { url },
    });

    let sentCount = 0;
    for (const sub of latestSubs) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
        );
        sentCount++;
      } catch (err: any) {
        this.logger.error(`Erreur envoi test sur ${sub.endpoint}: ${err.message}`);
      }
    }

    return { success: true, sentCount };
  }
}
