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
    const candidateUserId = dto.userId || currentUserId || null;

    // Vérifie que l'utilisateur existe en base (par userId Supabase OU par id Prisma)
    let validUserId: string | null = null;
    if (candidateUserId) {
      // Cherche d'abord par userId (champ Supabase Auth ID)
      let userRecord = await this.prisma.utilisateur.findUnique({
        where: { userId: candidateUserId },
        select: { userId: true },
      });

      // Fallback : cherche par id (UUID Prisma)
      if (!userRecord) {
        userRecord = await this.prisma.utilisateur.findUnique({
          where: { id: candidateUserId },
          select: { userId: true },
        });
      }

      validUserId = userRecord ? userRecord.userId : null;
      if (!validUserId) {
        this.logger.warn(`Utilisateur non trouvé pour Push subscription (candidateId: ${candidateUserId})`);
      }
    }

    const subscription = await this.prisma.pushSubscription.upsert({
      where: { endpoint: dto.endpoint },
      create: {
        endpoint: dto.endpoint,
        p256dh: dto.keys.p256dh,
        auth: dto.keys.auth,
        userId: validUserId,
        userAgent: dto.userAgent,
        deviceType: dto.deviceType,
      },
      update: {
        p256dh: dto.keys.p256dh,
        auth: dto.keys.auth,
        userId: validUserId,
        userAgent: dto.userAgent,
        deviceType: dto.deviceType,
      },
    });

    this.logger.log(`Abonnement Push enregistré${validUserId ? ` pour l'utilisateur ${validUserId}` : ' (anonyme)'}`);
    return { success: true, subscriptionId: subscription.id };
  }

  async unsubscribe(endpoint: string) {
    await this.prisma.pushSubscription.deleteMany({
      where: { endpoint },
    });
    this.logger.log(`Abonnement Push supprimé pour l'endpoint ${endpoint}`);
    return { success: true };
  }

  async sendNotificationToUser(targetUserIdentifier: string, title: string, message: string, url: string = '/') {
    // 1. Détermine le Supabase userId et l'UUID Prisma pour être sûr d'attraper l'abonnement
    let targetUserId = targetUserIdentifier;
    let targetPrismaId = targetUserIdentifier;

    const user = await this.prisma.utilisateur.findFirst({
      where: {
        OR: [{ userId: targetUserIdentifier }, { id: targetUserIdentifier }],
      },
      select: { id: true, userId: true },
    });

    if (user) {
      targetUserId = user.userId;
      targetPrismaId = user.id;
    }

    const subscriptions = await this.prisma.pushSubscription.findMany({
      where: {
        OR: [
          { userId: targetUserId },
          { userId: targetPrismaId },
        ],
      },
    });

    if (subscriptions.length === 0) {
      this.logger.warn(`Aucun appareil abonné au Push pour l'utilisateur ${targetUserIdentifier}`);
      return { success: false, sentCount: 0 };
    }

    const payload = JSON.stringify({
      title,
      body: message,
      icon: '/icon.svg',
      badge: '/icon.svg',
      sound: '/notification.mp3',
      silent: false,
      vibrate: [200, 100, 200, 100, 200, 100, 400],
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
      sound: '/notification.mp3',
      silent: false,
      vibrate: [200, 100, 200, 100, 200, 100, 400],
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

  // ── Helpers de Push notifications Métier ───────────────────────────────────

  /** Push pour le workflow Réservation & États des lieux */
  async sendReservationPush(userId: string, title: string, body: string, url: string = '/reservations') {
    return this.sendNotificationToUser(userId, title, body, url);
  }

  /** Push pour les mises à jour de dossier KYC */
  async sendKycPush(userId: string, isVerified: boolean, reason?: string) {
    const title = isVerified ? 'Identité vérifiée avec succès ! 🛡️' : 'Mise à jour dossier d\'identité KYC ⚠️';
    const body = isVerified
      ? 'Votre dossier KYC a été validé par l\'équipe Klef. Vous pouvez publier et réserver sans restriction !'
      : `Votre dossier KYC requiert une attention : ${reason || 'Veuillez vérifier vos documents.'}`;
    return this.sendNotificationToUser(userId, title, body, '/parametres');
  }

  /** Push pour les nouveaux avis reçus */
  async sendReviewPush(userId: string, rating: number, logementTitle: string, url: string = '/logements') {
    const stars = '⭐'.repeat(Math.round(rating));
    const title = `Nouveau commentaire reçu ${stars}`;
    const body = `Un voyageur a laissé une note de ${rating}/5 pour votre logement "${logementTitle}".`;
    return this.sendNotificationToUser(userId, title, body, url);
  }

  /** Push pour les litiges & réclamations */
  async sendDisputePush(userId: string, title: string, body: string, url: string = '/dashboard') {
    return this.sendNotificationToUser(userId, title, body, url);
  }

  /** Push pour le portefeuille & virements */
  async sendWalletPush(userId: string, amount: number, isProcessed: boolean, details?: string) {
    const title = isProcessed ? 'Virement exécuté avec succès 💳' : 'Demande de retrait enregistrée ⏳';
    const body = isProcessed
      ? `Votre virement de ${amount.toLocaleString('fr-FR')} FCFA a été traité.`
      : `Votre demande de retrait de ${amount.toLocaleString('fr-FR')} FCFA est en cours de traitement.`;
    return this.sendNotificationToUser(userId, title, body, '/parametres');
  }
}
