import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

/** Logements gardés par un voyageur (cœur de l'annonce, « Mes gardés »). */
@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Les gardés, du plus récent au plus ancien, avec de quoi afficher une carte. */
  async list(userId: string) {
    return this.prisma.favori.findMany({
      where: { utilisateurId: userId },
      orderBy: { creeLe: 'desc' },
      select: {
        logementId: true,
        creeLe: true,
        logement: {
          select: {
            id: true,
            titre: true,
            ville: true,
            quartier: true,
            type: true,
            prixBase: true,
            capaciteMax: true,
            nombreChambres: true,
            nombreSallesBain: true,
            note: true,
            totalAvis: true,
            videoUrl: true,
            derniereMinuteActive: true,
            statut: true,
            photos: { orderBy: [{ estPrincipale: 'desc' }, { position: 'asc' }], take: 1, select: { url: true } },
          },
        },
      },
    });
  }

  /** Identifiants seuls : de quoi colorer les cœurs sans charger les cartes. */
  async ids(userId: string): Promise<string[]> {
    const rows = await this.prisma.favori.findMany({ where: { utilisateurId: userId }, select: { logementId: true } });
    return rows.map((r) => r.logementId);
  }

  /** Idempotent : garder deux fois le même logement ne crée pas de doublon. */
  async add(userId: string, logementId: string) {
    const exists = await this.prisma.logement.findUnique({ where: { id: logementId }, select: { id: true } });
    if (!exists) throw new NotFoundException('Logement introuvable');
    await this.prisma.favori.upsert({
      where: { utilisateurId_logementId: { utilisateurId: userId, logementId } },
      create: { utilisateurId: userId, logementId },
      update: {},
    });
    return { logementId, garde: true };
  }

  async remove(userId: string, logementId: string) {
    await this.prisma.favori.deleteMany({ where: { utilisateurId: userId, logementId } });
    return { logementId, garde: false };
  }
}
