import { CodeBadgeTeranga, PrismaClient, TypeTransactionTeranga } from '@prisma/client';

export class UnlockBadgeUseCase {
  constructor(private readonly prisma: PrismaClient) {}

  async execute(
    utilisateurId: string,
    codeBadge: CodeBadgeTeranga,
    bonusCoins: number = 0,
    libelle: string,
    description: string,
    icone: string,
  ): Promise<boolean> {
    let account = await this.prisma.terangaAccount.findUnique({
      where: { utilisateurId },
    });

    if (!account) {
      account = await this.prisma.terangaAccount.create({
        data: { utilisateurId },
      });
    }

    const existingBadge = await this.prisma.terangaBadge.findUnique({
      where: {
        terangaAccountId_codeBadge: {
          terangaAccountId: account.id,
          codeBadge,
        },
      },
    });

    if (existingBadge) {
      return false; // Déjà débloqué
    }

    const nouveauSolde = account.soldeCoins + bonusCoins;

    await this.prisma.$transaction([
      this.prisma.terangaBadge.create({
        data: {
          terangaAccountId: account.id,
          codeBadge,
          libelle,
          description,
          icone,
        },
      }),
      ...(bonusCoins > 0
        ? [
            this.prisma.terangaAccount.update({
              where: { id: account.id },
              data: { soldeCoins: nouveauSolde },
            }),
            this.prisma.terangaTransaction.create({
              data: {
                terangaAccountId: account.id,
                montantCoins: bonusCoins,
                type: TypeTransactionTeranga.CREDIT_BONUS_QUEST,
                description: `Bonus quête accomplie : ${libelle}`,
                soldeApres: nouveauSolde,
              },
            }),
          ]
        : []),
    ]);

    return true;
  }
}
