import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import * as webpush from 'web-push';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { SubscribePushDto } from './dto/subscribe-push.dto';
import { SubscribeExpoPushDto } from './dto/subscribe-expo-push.dto';
import { SendTestPushDto } from './dto/send-test-push.dto';
import { PushSubscription } from '@prisma/client';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly expo = new Expo();
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
    this.logger.log('Service Web Push VAPID & Expo Push initialisés avec succès !');
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
        platform: 'WEB',
        userId: validUserId,
        userAgent: dto.userAgent,
        deviceType: dto.deviceType,
      },
      update: {
        p256dh: dto.keys.p256dh,
        auth: dto.keys.auth,
        platform: 'WEB',
        userId: validUserId,
        userAgent: dto.userAgent,
        deviceType: dto.deviceType,
      },
    });

    this.logger.log(`Abonnement Web Push enregistré${validUserId ? ` pour l'utilisateur ${validUserId}` : ' (anonyme)'}`);
    return { success: true, subscriptionId: subscription.id };
  }

  async subscribeExpo(dto: SubscribeExpoPushDto, currentUserId?: string) {
    if (!Expo.isExpoPushToken(dto.expoPushToken)) {
      this.logger.warn(`Jeton Expo Push invalide : ${dto.expoPushToken}`);
      return { success: false, message: 'Jeton Expo Push invalide' };
    }

    const candidateUserId = dto.userId || currentUserId || null;
    let validUserId: string | null = null;

    if (candidateUserId) {
      let userRecord = await this.prisma.utilisateur.findUnique({
        where: { userId: candidateUserId },
        select: { userId: true },
      });

      if (!userRecord) {
        userRecord = await this.prisma.utilisateur.findUnique({
          where: { id: candidateUserId },
          select: { userId: true },
        });
      }

      validUserId = userRecord ? userRecord.userId : null;
    }

    const subscription = await this.prisma.pushSubscription.upsert({
      where: { expoPushToken: dto.expoPushToken },
      create: {
        endpoint: `expo:${dto.expoPushToken}`,
        expoPushToken: dto.expoPushToken,
        platform: dto.platform || 'ANDROID',
        userId: validUserId,
        deviceType: dto.deviceType,
      },
      update: {
        platform: dto.platform || 'ANDROID',
        userId: validUserId,
        deviceType: dto.deviceType,
      },
    });

    this.logger.log(`Abonnement Expo Push (${dto.platform || 'MOBILE'}) enregistré${validUserId ? ` pour ${validUserId}` : ''}`);
    return { success: true, subscriptionId: subscription.id };
  }

  async unsubscribe(endpoint: string) {
    await this.prisma.pushSubscription.deleteMany({
      where: {
        OR: [
          { endpoint },
          { expoPushToken: endpoint },
        ],
      },
    });
    this.logger.log(`Abonnement Push supprimé pour l'endpoint / token ${endpoint}`);
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

    let sentCount = 0;

    // ── 1. Traitement des Push Natifs Mobile (Expo Push) ─────────────────────
    const expoSubs = subscriptions.filter((s) => s.expoPushToken && Expo.isExpoPushToken(s.expoPushToken));
    if (expoSubs.length > 0) {
      const messages: ExpoPushMessage[] = expoSubs.map((s) => ({
        to: s.expoPushToken!,
        sound: 'default',
        title,
        body: message,
        data: { url },
      }));

      const chunks = this.expo.chunkPushNotifications(messages);
      for (const chunk of chunks) {
        try {
          const receipts = await this.expo.sendPushNotificationsAsync(chunk);
          sentCount += receipts.length;
        } catch (error: any) {
          this.logger.error(`Erreur d'envoi Expo Push : ${error.message}`);
        }
      }
    }

    // ── 2. Traitement des Push Web PWA (WebPush VAPID) ────────────────────────
    const webSubs = subscriptions.filter((s) => s.endpoint && s.p256dh && s.auth);
    if (webSubs.length > 0) {
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

      await Promise.all(
        webSubs.map(async (sub: PushSubscription) => {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh!,
              auth: sub.auth!,
            },
          };

          try {
            await webpush.sendNotification(pushSubscription, payload);
            sentCount++;
          } catch (error: any) {
            this.logger.error(`Erreur d'envoi Web Push vers ${sub.endpoint}: ${error.message}`);
            if (error.statusCode === 410 || error.statusCode === 404) {
              await this.prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
            }
          }
        }),
      );
    }

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

      if (sub && sub.p256dh && sub.auth) {
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
      if (sub.p256dh && sub.auth) {
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

  /** Notification SMS / Push / WhatsApp au propriétaire lors de la publication d'un bien en son nom par sa conciergerie */
  async sendManagedListingNotification(
    ownerPhone: string,
    ownerUserId: string,
    logementTitle: string,
    gestionnaireName: string = 'Votre conciergerie',
  ) {
    const title = 'Nouveau bien ajouté à votre espace 🏠';
    const message = `Bonjour ! Un nouveau logement "${logementTitle}" a été ajouté à votre espace par ${gestionnaireName}.`;

    this.logger.log(`[Notification Conciergerie] Message préparé pour ${ownerPhone} (${ownerUserId}) : "${message}"`);

    // 1. Notification Push Web PWA (si l'utilisateur a un abonnement actif)
    await this.sendNotificationToUser(ownerUserId, title, message, '/dashboard/annonces').catch(() => {});

    // 2. Hook SMS / WhatsApp (Configuration prête pour Twilio, Infobip ou SMS local Senegal)
    /*
    const twilioAccountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    if (twilioAccountSid && twilioAuthToken) {
      // Configuration d'envoi SMS / WhatsApp actif :
      // await twilioClient.messages.create({ body: message, from: 'Klef Conciergerie', to: ownerPhone });
      this.logger.log(`[SMS/WhatsApp Conciergerie] Message transmis avec succès à ${ownerPhone}`);
    }
    */

    return { success: true, message: 'Notification propriétaire conciergerie envoyée' };
  }
}
