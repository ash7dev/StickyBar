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

    // Récupérer le code de parrainage de l'utilisateur
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: userId },
      select: { codeParrainage: true },
    });

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
      codeParrainage: utilisateur?.codeParrainage ?? null,
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
        requiredTier: 'BRONZE',
        unlocked: unlockedBadges.includes(CodeBadgeTeranga.FIRST_STAY),
      },
      {
        code: CodeBadgeTeranga.AVIS_STAR,
        libelle: 'Avis Étoilé',
        description: 'Laissez un avis détaillé et constructif après votre séjour.',
        bonusCoins: 500,
        icone: '⭐',
        requiredTier: 'BRONZE',
        unlocked: unlockedBadges.includes(CodeBadgeTeranga.AVIS_STAR),
      },
      {
        code: CodeBadgeTeranga.PETITE_COTE_CAPTAIN,
        libelle: 'Capitaine de la Petite Côte',
        description: 'Réservez un hébergement à Saly, Somone, Ngaparou ou Popenguine.',
        bonusCoins: 1500,
        icone: '🌊',
        requiredTier: 'SILVER',
        unlocked: unlockedBadges.includes(CodeBadgeTeranga.PETITE_COTE_CAPTAIN),
      },
      {
        code: CodeBadgeTeranga.SUPER_PARRAIN,
        libelle: 'Super Parrain Teranga',
        description: 'Invitez un ami qui effectue sa 1ère réservation sur Klef.',
        bonusCoins: 2500,
        icone: '🤝',
        requiredTier: 'SILVER',
        unlocked: unlockedBadges.includes(CodeBadgeTeranga.SUPER_PARRAIN),
      },
      {
        code: CodeBadgeTeranga.GRAND_RESIDENT,
        libelle: 'Grand Résident',
        description: 'Effectuez un séjour de 7 nuits ou plus sur Klef.',
        bonusCoins: 5000,
        icone: '🏕️',
        requiredTier: 'GOLD',
        unlocked: unlockedBadges.includes(CodeBadgeTeranga.GRAND_RESIDENT),
      },
      {
        code: CodeBadgeTeranga.LEGENDE_SENEGAL,
        libelle: 'Légende du Sénégal',
        description: 'Réservez des séjours dans au moins 3 villes ou destinations différentes.',
        bonusCoins: 5000,
        icone: '👑',
        requiredTier: 'GOLD',
        unlocked: unlockedBadges.includes(CodeBadgeTeranga.LEGENDE_SENEGAL),
      },
      {
        code: CodeBadgeTeranga.CERCLE_MILLION,
        libelle: 'Cercle du Million',
        description: 'Atteignez 1 000 000 FCFA de réservations cumulées sur 12 mois.',
        bonusCoins: 10000,
        icone: '💎',
        requiredTier: 'GOLD',
        unlocked: unlockedBadges.includes(CodeBadgeTeranga.CERCLE_MILLION),
      },
    ];

    return quests;
  }

  async claimQuest(userId: string, code: CodeBadgeTeranga) {
    const account = await this.prisma.terangaAccount.findUnique({
      where: { utilisateurId: userId },
      include: { badges: true },
    });

    const isAlreadyUnlocked = account?.badges.some((b) => b.codeBadge === code);
    if (isAlreadyUnlocked) {
      return {
        success: true,
        claimed: false,
        alreadyClaimed: true,
        message: 'Vous avez déjà débloqué ce badge !',
      };
    }

    let isEligible = false;
    let bonusCoins = 0;
    let libelle = '';
    let description = '';
    let icone = '';
    let actionRequired: 'RESERVE' | 'REVIEW' | 'EXPLORE' | 'SHARE' = 'RESERVE';
    let notEligibleReason = '';

    switch (code) {
      case CodeBadgeTeranga.FIRST_STAY: {
        libelle = 'Premier Voyage';
        description = 'Félicitations pour votre 1er séjour réservé et validé sur Klef !';
        icone = '🔑';
        bonusCoins = 1000;
        actionRequired = 'RESERVE';
        const staysCount = await this.prisma.reservation.count({
          where: {
            locataireId: userId,
            statut: { in: ['CHECKED_IN', 'COMPLETED'] },
          },
        });
        isEligible = staysCount >= 1;
        notEligibleReason = 'Effectuez votre 1er séjour validé sur Klef pour débloquer cette quête !';
        break;
      }
      case CodeBadgeTeranga.AVIS_STAR: {
        libelle = 'Avis Étoilé';
        description = 'Merci d\'avoir partagé votre expérience avec la communauté Klef !';
        icone = '⭐';
        bonusCoins = 500;
        actionRequired = 'REVIEW';
        const reviewsCount = await this.prisma.avis.count({
          where: { auteurId: userId },
        });
        isEligible = reviewsCount >= 1;
        notEligibleReason = 'Laissez un avis sur l\'un de vos séjours passés pour débloquer ce badge !';
        break;
      }
      case CodeBadgeTeranga.PETITE_COTE_CAPTAIN: {
        libelle = 'Capitaine de la Petite Côte';
        description = 'Séjour Petite Côte validé !';
        icone = '🌊';
        bonusCoins = 1500;
        actionRequired = 'EXPLORE';
        const petiteCoteRes = await this.prisma.reservation.findFirst({
          where: {
            locataireId: userId,
            statut: { in: ['CHECKED_IN', 'COMPLETED'] },
            logement: {
              OR: [
                { ville: { contains: 'Saly', mode: 'insensitive' } },
                { ville: { contains: 'Somone', mode: 'insensitive' } },
                { ville: { contains: 'Popenguine', mode: 'insensitive' } },
                { ville: { contains: 'Mbour', mode: 'insensitive' } },
              ],
            },
          },
        });
        isEligible = !!petiteCoteRes;
        notEligibleReason = 'Réservez un hébergement à Saly, Somone, Ngaparou ou Popenguine pour débloquer cette quête !';
        break;
      }
      case CodeBadgeTeranga.SUPER_PARRAIN: {
        libelle = 'Super Parrain Teranga';
        description = 'Votre parrainage a été validé !';
        icone = '🤝';
        bonusCoins = 2500;
        actionRequired = 'SHARE';
        const filleulAvecSejour = await this.prisma.utilisateur.findFirst({
          where: {
            parrainId: userId,
            reservationsLocataire: {
              some: { statut: { in: ['CHECKED_IN', 'COMPLETED'] } },
            },
          },
        });
        isEligible = !!filleulAvecSejour;
        notEligibleReason = 'Invitez un ami qui effectue sa première réservation validée sur Klef !';
        break;
      }
      case CodeBadgeTeranga.GRAND_RESIDENT: {
        libelle = 'Grand Résident';
        description = 'Félicitations pour votre séjour de plus de 7 nuits !';
        icone = '🏕️';
        bonusCoins = 5000;
        actionRequired = 'RESERVE';
        const longStay = await this.prisma.reservation.findFirst({
          where: {
            locataireId: userId,
            statut: { in: ['CHECKED_IN', 'COMPLETED'] },
          },
        });
        if (longStay) {
          const diffDays = Math.ceil(
            (new Date(longStay.dateFin).getTime() - new Date(longStay.dateDebut).getTime()) /
              (1000 * 3600 * 24)
          );
          isEligible = diffDays >= 7;
        }
        notEligibleReason = 'Effectuez un séjour de 7 nuits ou plus sur Klef pour débloquer les +5 000 Coins Élite !';
        break;
      }
      case CodeBadgeTeranga.LEGENDE_SENEGAL: {
        libelle = 'Légende du Sénégal';
        description = 'Félicitations ! Vous avez exploré 3 destinations différentes sur Klef.';
        icone = '👑';
        bonusCoins = 5000;
        actionRequired = 'EXPLORE';
        const reservations = await this.prisma.reservation.findMany({
          where: {
            locataireId: userId,
            statut: { in: ['CHECKED_IN', 'COMPLETED'] },
          },
          select: { logement: { select: { ville: true } } },
        });
        const distinctVilles = new Set(reservations.map((r) => r.logement.ville).filter(Boolean));
        isEligible = distinctVilles.size >= 3;
        notEligibleReason = 'Réservez des séjours dans au moins 3 villes/destinations différentes au Sénégal !';
        break;
      }
      case CodeBadgeTeranga.CERCLE_MILLION: {
        libelle = 'Cercle du Million';
        description = 'Félicitations ! Vous appartenez à l\'Élite du Cercle du Million Klef.';
        icone = '💎';
        bonusCoins = 10000;
        actionRequired = 'RESERVE';
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);
        const gmvStats = await this.prisma.reservation.aggregate({
          where: {
            locataireId: userId,
            statut: { in: ['CHECKED_IN', 'COMPLETED'] },
            dateDebut: { gte: twelveMonthsAgo },
          },
          _sum: { totalLocataire: true },
        });
        const totalSpent = Number(gmvStats._sum.totalLocataire || 0);
        isEligible = totalSpent >= 1_000_000;
        notEligibleReason = 'Atteignez 1 000 000 FCFA de réservations cumulées sur 12 mois pour décrocher les 10 000 Coins Ultime !';
        break;
      }
      default:
        return { success: false, claimed: false, message: 'Code de quête inconnu' };
    }

    if (!isEligible) {
      return {
        success: false,
        claimed: false,
        actionRequired,
        message: notEligibleReason || `Condition non remplie pour débloquer "${libelle}".`,
      };
    }

    const unlocked = await this.unlockBadge(
      userId,
      code,
      bonusCoins,
      libelle,
      description,
      icone,
    );

    return {
      success: true,
      claimed: unlocked,
      bonusCoins,
      libelle,
      icone,
      message: unlocked
        ? `Bravo ! Vous avez débloqué "${libelle}" et gagné +${bonusCoins} Klef Coins ! 🎉`
        : 'Badge déjà débloqué.',
    };
  }

  // ── Parrainage ──────────────────────────────────────────────────────────────

  async getReferralInfo(userId: string) {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: userId },
      select: {
        codeParrainage: true,
        filleuls: {
          select: {
            id: true,
            prenom: true,
            nom: true,
            creeLe: true,
            reservationsLocataire: {
              where: { statut: { in: ['CHECKED_IN', 'COMPLETED'] } },
              select: { id: true },
              take: 1,
            },
          },
          orderBy: { creeLe: 'desc' },
        },
      },
    });

    if (!utilisateur) return { codeParrainage: null, nbFilleuls: 0, filleuls: [] };

    const filleuls = utilisateur.filleuls.map((f) => ({
      id: f.id,
      prenom: f.prenom,
      initiale: f.nom.charAt(0).toUpperCase(),
      inscritLe: f.creeLe,
      aReserve: f.reservationsLocataire.length > 0,
    }));

    return {
      codeParrainage: utilisateur.codeParrainage,
      nbFilleuls: filleuls.length,
      nbFilleulsActifs: filleuls.filter((f) => f.aReserve).length,
      filleuls,
    };
  }

  async awardParrainageBonus(parrainId: string, filleulPrenom: string) {
    this.logger.log(`Déclenchement bonus parrainage pour parrain ${parrainId} (filleul: ${filleulPrenom})`);

    // Vérifier si le badge SUPER_PARRAIN est déjà débloqué
    const account = await this.prisma.terangaAccount.findUnique({
      where: { utilisateurId: parrainId },
      select: { badges: { where: { codeBadge: CodeBadgeTeranga.SUPER_PARRAIN }, select: { id: true } } },
    });

    // Le badge peut être attribué plusieurs fois ? Non : unique constraint.
    // Mais on crédite quand même les coins pour chaque filleul.
    const PARRAIN_BONUS = 2500;

    // Créditer les coins au parrain via une transaction
    let terangaAccount = await this.prisma.terangaAccount.findUnique({
      where: { utilisateurId: parrainId },
    });
    if (!terangaAccount) {
      terangaAccount = await this.prisma.terangaAccount.create({
        data: { utilisateurId: parrainId },
      });
    }

    await this.prisma.$transaction([
      this.prisma.terangaAccount.update({
        where: { id: terangaAccount.id },
        data: { soldeCoins: { increment: PARRAIN_BONUS } },
      }),
      this.prisma.terangaTransaction.create({
        data: {
          terangaAccountId: terangaAccount.id,
          montantCoins: PARRAIN_BONUS,
          type: 'CREDIT_PARRAINAGE',
          description: `Bonus parrainage : ${filleulPrenom} a effectué son 1er séjour`,
          soldeApres: terangaAccount.soldeCoins + PARRAIN_BONUS,
        },
      }),
    ]);

    // Débloquer le badge SUPER_PARRAIN si pas encore fait
    const alreadyHasBadge = account?.badges && account.badges.length > 0;
    if (!alreadyHasBadge) {
      await this.unlockBadge(
        parrainId,
        CodeBadgeTeranga.SUPER_PARRAIN,
        0, // pas de bonus supplémentaire, déjà crédité ci-dessus
        'Super Parrain Teranga',
        'Votre filleul a effectué son 1er séjour sur Klef !',
        '🤝',
      );
    }

    this.logger.log(`Parrain ${parrainId} : +${PARRAIN_BONUS} coins (filleul ${filleulPrenom})`);
    return { credited: PARRAIN_BONUS };
  }
}
