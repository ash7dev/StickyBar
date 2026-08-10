import { CodeBadgeTeranga, PrismaClient, TypeTransactionTeranga } from '@prisma/client';
import { CalculateTierUseCase } from './calculate-tier.use-case';

export class AwardBookingCashbackUseCase {
  constructor(private readonly prisma: PrismaClient) {}

  async execute(reservationId: string): Promise<number> {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id: reservationId },
      select: {
        id: true,
        locataireId: true,
        totalLocataire: true,
        statut: true,
      },
    });

    if (!reservation || !reservation.locataireId) {
      return 0;
    }

    const locataireId = reservation.locataireId;
    const montantTotal = Number(reservation.totalLocataire || 0);

    // 1. Récupérer ou créer le TerangaAccount
    let account = await this.prisma.terangaAccount.findUnique({
      where: { utilisateurId: locataireId },
    });

    if (!account) {
      account = await this.prisma.terangaAccount.create({
        data: { utilisateurId: locataireId },
      });
    }

    // Check if this reservation cashback was already credited
    const existingTx = await this.prisma.terangaTransaction.findFirst({
      where: {
        terangaAccountId: account.id,
        reservationId: reservation.id,
        type: TypeTransactionTeranga.CREDIT_BOOKING,
      },
    });

    if (existingTx) {
      return Number(existingTx.montantCoins);
    }

    // 2. Compter le nombre de séjours complétés sur 12 mois
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

    const sejoursStats = await this.prisma.reservation.aggregate({
      where: {
        locataireId,
        statut: { in: ['CHECKED_IN', 'COMPLETED'] },
        dateDebut: { gte: twelveMonthsAgo },
      },
      _count: { id: true },
      _sum: { totalLocataire: true },
    });

    const nbSejours = sejoursStats._count.id;
    const gmv12Mois = Number(sejoursStats._sum.totalLocataire || 0);

    // 3. Calculer le tier et le % cashback
    const { tier, cashbackPct } = CalculateTierUseCase.execute(gmv12Mois, nbSejours);

    // 4. Calculer le montant de Klef Coins gagnés (1 Coin = 1 FCFA)
    const coinsGagnes = Math.round((montantTotal * cashbackPct) / 100);

    if (coinsGagnes <= 0) {
      return 0;
    }

    // 5. Mettre à jour le compte et ajouter la transaction en transaction DB
    const nouveauSolde = account.soldeCoins + coinsGagnes;

    await this.prisma.$transaction([
      this.prisma.terangaAccount.update({
        where: { id: account.id },
        data: {
          soldeCoins: nouveauSolde,
          tier,
          gmv12Mois,
        },
      }),
      this.prisma.terangaTransaction.create({
        data: {
          terangaAccountId: account.id,
          montantCoins: coinsGagnes,
          type: TypeTransactionTeranga.CREDIT_BOOKING,
          description: `Cashback ${cashbackPct}% — Réservation #${reservationId.slice(0, 8).toUpperCase()}`,
          reservationId: reservation.id,
          soldeApres: nouveauSolde,
        },
      }),
    ]);

    // 6. Débloquer le badge FIRST_STAY si 1er séjour
    if (nbSejours === 1) {
      await this.prisma.terangaBadge.upsert({
        where: {
          terangaAccountId_codeBadge: {
            terangaAccountId: account.id,
            codeBadge: CodeBadgeTeranga.FIRST_STAY,
          },
        },
        create: {
          terangaAccountId: account.id,
          codeBadge: CodeBadgeTeranga.FIRST_STAY,
          libelle: 'Premier Voyage',
          description: 'Félicitations pour votre premier séjour réservé sur Klef !',
          icone: '🔑',
        },
        update: {},
      });
    }

    return coinsGagnes;
  }
}
