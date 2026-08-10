import { PrismaClient, TypeTransactionTeranga } from '@prisma/client';
import { UnprocessableEntityException } from '@nestjs/common';

export class RedeemCoinsUseCase {
  constructor(private readonly prisma: PrismaClient) {}

  async execute(
    utilisateurId: string,
    montantCoins: number,
    reservationId?: string,
  ): Promise<{ soldeApres: number }> {
    if (montantCoins <= 0) {
      throw new UnprocessableEntityException('Le montant de Klef Coins à déduire doit être supérieur à 0');
    }

    const account = await this.prisma.terangaAccount.findUnique({
      where: { utilisateurId },
    });

    if (!account || account.soldeCoins < montantCoins) {
      throw new UnprocessableEntityException(
        `Solde de Klef Coins insuffisant (solde actuel : ${account?.soldeCoins ?? 0} Coins, demandé : ${montantCoins} Coins)`,
      );
    }

    const soldeApres = account.soldeCoins - montantCoins;

    await this.prisma.$transaction([
      this.prisma.terangaAccount.update({
        where: { id: account.id },
        data: { soldeCoins: soldeApres },
      }),
      this.prisma.terangaTransaction.create({
        data: {
          terangaAccountId: account.id,
          montantCoins: -montantCoins,
          type: TypeTransactionTeranga.DEBIT_RESERVATION,
          description: reservationId
            ? `Réduction appliquée sur la réservation #${reservationId.slice(0, 8).toUpperCase()}`
            : `Réduction appliquée sur réservation`,
          reservationId: reservationId ?? null,
          soldeApres,
        },
      }),
    ]);

    return { soldeApres };
  }
}
