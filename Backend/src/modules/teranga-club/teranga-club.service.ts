import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CalculateTierUseCase } from '../../domain/teranga-club/use-cases/calculate-tier.use-case';
import { AwardBookingCashbackUseCase } from '../../domain/teranga-club/use-cases/award-booking-cashback.use-case';
import { RedeemCoinsUseCase } from '../../domain/teranga-club/use-cases/redeem-coins.use-case';
import { UnlockBadgeUseCase } from '../../domain/teranga-club/use-cases/unlock-badge.use-case';
import { CodeBadgeTeranga } from '@prisma/client';

@Injectable()
export class TerangaClubService {
  private readonly logger = new Logger(TerangaClubService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getAccountForUser(userId: string) {
    let account = await this.prisma.terangaAccount.findUnique({
      where: { utilisateurId: userId },
      include: {
        badges: { orderBy: { debloqueLe: 'desc' } },
        transactions: { orderBy: { creeLe: 'desc' }, take: 20 },
      },
    });

    if (!account) {
      account = await this.prisma.terangaAccount.create({
        data: { utilisateurId: userId },
        include: {
          badges: true,
          transactions: true,
        },
      });
    }

    // Calculer le nombre de séjours sur 12 mois
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

    const sejoursStats = await this.prisma.reservation.aggregate({
      where: {
        locataireId: userId,
        statut: { in: ['CHECKED_IN', 'COMPLETED'] },
        dateDebut: { gte: twelveMonthsAgo },
      },
      _count: { id: true },
      _sum: { totalLocataire: true },
    });

    const nbSejours = sejoursStats._count.id;
    const gmv12Mois = Number(sejoursStats._sum.totalLocataire || 0);

    const tierInfo = CalculateTierUseCase.execute(gmv12Mois, nbSejours);

    // Mettre à jour si le tier ou gmv a changé
    if (account.tier !== tierInfo.tier || Number(account.gmv12Mois) !== gmv12Mois) {
      account = await this.prisma.terangaAccount.update({
        where: { id: account.id },
        data: { tier: tierInfo.tier, gmv12Mois },
        include: {
          badges: { orderBy: { debloqueLe: 'desc' } },
          transactions: { orderBy: { creeLe: 'desc' }, take: 20 },
        },
      });
    }

    return {
      soldeCoins: account.soldeCoins,
      tier: account.tier,
      cashbackPct: tierInfo.cashbackPct,
      gmv12Mois,
      nbSejours,
      nextTier: tierInfo.nextTier,
      gmvRemainingForNextTier: tierInfo.gmvRemainingForNextTier,
      badges: account.badges,
      transactions: account.transactions,
    };
  }

  async awardBookingCashback(reservationId: string) {
    const useCase = new AwardBookingCashbackUseCase(this.prisma);
    return useCase.execute(reservationId);
  }

  async redeemCoins(userId: string, amount: number, reservationId?: string) {
    const useCase = new RedeemCoinsUseCase(this.prisma);
    return useCase.execute(userId, amount, reservationId);
  }

  async unlockBadge(
    userId: string,
    codeBadge: CodeBadgeTeranga,
    bonusCoins: number,
    libelle: string,
    description: string,
    icone: string,
  ) {
    const useCase = new UnlockBadgeUseCase(this.prisma);
    return useCase.execute(userId, codeBadge, bonusCoins, libelle, description, icone);
  }

  async getQuestsStatus(userId?: string) {
    let unlockedBadges: string[] = [];

    if (userId) {
      const account = await this.prisma.terangaAccount.findUnique({
        where: { utilisateurId: userId },
        select: { badges: { select: { codeBadge: true } } },
      });
      if (account) {
        unlockedBadges = account.badges.map((b) => b.codeBadge);
      }
    }

    const quests = [
      {
        code: CodeBadgeTeranga.FIRST_STAY,
        libelle: 'Premier Voyage',
        description: 'Effectuez votre 1er séjour réservé et validé sur Klef.',
        bonusCoins: 1000,
        icone: '🔑',
        unlocked: unlockedBadges.includes(CodeBadgeTeranga.FIRST_STAY),
      },
      {
        code: CodeBadgeTeranga.AVIS_STAR,
        libelle: 'Avis Étoilé',
        description: 'Laissez un avis détaillé et constructif après votre séjour.',
        bonusCoins: 500,
        icone: '⭐',
        unlocked: unlockedBadges.includes(CodeBadgeTeranga.AVIS_STAR),
      },
      {
        code: CodeBadgeTeranga.PETITE_COTE_CAPTAIN,
        libelle: 'Capitaine de la Petite Côte',
        description: 'Réservez un hébergement à Saly, Somone ou Popenguine.',
        bonusCoins: 1500,
        icone: '🌊',
        unlocked: unlockedBadges.includes(CodeBadgeTeranga.PETITE_COTE_CAPTAIN),
      },
      {
        code: CodeBadgeTeranga.SUPER_PARRAIN,
        libelle: 'Super Parrain Teranga',
        description: 'Invitez un ami qui effectue sa 1ère réservation sur Klef.',
        bonusCoins: 2500,
        icone: '🤝',
        unlocked: unlockedBadges.includes(CodeBadgeTeranga.SUPER_PARRAIN),
      },
    ];

    return quests;
  }
}
