import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { BroadcastNotificationDto, AdminNotificationsQueryDto, CibleNotification } from './dto/admin-notifications.dto';
import { Prisma, StatutNotification, TypeNotification, CanalNotification } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AdminNotificationsService {
  private readonly logger = new Logger(AdminNotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async broadcast(dto: BroadcastNotificationDto) {
    const userWhere: Prisma.UtilisateurWhereInput = {
      actif: true,
      ...(dto.cible === CibleNotification.HOSTS && { estProprietaire: true }),
      ...(dto.cible === CibleNotification.TENANTS && { estProprietaire: false }),
    };

    const targetUsers = await this.prisma.utilisateur.findMany({
      where: userWhere,
      select: { id: true, userId: true },
    });

    const now = new Date();

    const logsData = targetUsers.map((u) => ({
      utilisateurId: u.id,
      canal: dto.canal,
      type: TypeNotification.PAIEMENT_DISPONIBLE,
      contenu: `[${dto.titre}] ${dto.message}`,
      statut: StatutNotification.ENVOYE,
      envoyeLe: now,
    }));

    if (logsData.length > 0) {
      await this.prisma.notificationLog.createMany({
        data: logsData,
      });
    }

    // 🚀 ENVOI REEL DE LA NOTIFICATION PUSH WEB / MOBILE
    let pushSentCount = 0;
    if (dto.canal === CanalNotification.PUSH) {
      for (const u of targetUsers) {
        try {
          const pushRes = await this.notificationsService.sendNotificationToUser(
            u.id,
            dto.titre,
            dto.message,
            '/explorer',
          );
          pushSentCount += pushRes.sentCount || 0;
        } catch (err: any) {
          this.logger.error(`Échec envoi Push pour utilisateur ${u.id}: ${err.message}`);
        }
      }

      // Fallback : si aucun utilisateur spécifique n'a d'abonnement ciblé, tenter l'envoi sur tous les appareils récents
      if (pushSentCount === 0) {
        const testRes = await this.notificationsService.sendTestNotification({
          title: dto.titre,
          message: dto.message,
          url: '/explorer',
        });
        if ('sentCount' in testRes) {
          pushSentCount = testRes.sentCount || 0;
        }
      }
    }

    return {
      success: true,
      destinatairesTotal: targetUsers.length,
      pushSentCount,
      canal: dto.canal,
      cible: dto.cible,
      message: `Notification enregistrée (${targetUsers.length} comptes) et ${pushSentCount} appareil(s) Push notifié(s)`,
    };
  }

  async listLogs(dto: AdminNotificationsQueryDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;

    const where: Prisma.NotificationLogWhereInput = {
      ...(dto.canal && { canal: dto.canal }),
      ...(dto.statut && { statut: dto.statut }),
    };

    const [total, logs] = await Promise.all([
      this.prisma.notificationLog.count({ where }),
      this.prisma.notificationLog.findMany({
        where,
        include: {
          utilisateur: {
            select: { id: true, prenom: true, nom: true, email: true, telephone: true },
          },
        },
        orderBy: { creeLe: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
