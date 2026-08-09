import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { BroadcastNotificationDto, AdminNotificationsQueryDto, CibleNotification } from './dto/admin-notifications.dto';
import { Prisma, StatutNotification, TypeNotification } from '@prisma/client';

@Injectable()
export class AdminNotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async broadcast(dto: BroadcastNotificationDto) {
    const userWhere: Prisma.UtilisateurWhereInput = {
      actif: true,
      ...(dto.cible === CibleNotification.HOSTS && { estProprietaire: true }),
      ...(dto.cible === CibleNotification.TENANTS && { estProprietaire: false }),
    };

    const targetUsers = await this.prisma.utilisateur.findMany({
      where: userWhere,
      select: { id: true },
    });

    const now = new Date();

    const logsData = targetUsers.map((u) => ({
      utilisateurId: u.id,
      canal: dto.canal,
      type: TypeNotification.PAIEMENT_DISPONIBLE, // notification d'information générique
      contenu: `[${dto.titre}] ${dto.message}`,
      statut: StatutNotification.ENVOYE,
      envoyeLe: now,
    }));

    if (logsData.length > 0) {
      await this.prisma.notificationLog.createMany({
        data: logsData,
      });
    }

    return {
      success: true,
      destinatairesTotal: targetUsers.length,
      canal: dto.canal,
      cible: dto.cible,
      message: `Notification transmise à ${targetUsers.length} utilisateur(s)`,
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
