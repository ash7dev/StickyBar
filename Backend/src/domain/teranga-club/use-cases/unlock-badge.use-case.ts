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

    const badgeCreate = this.prisma.terangaBadge.create({
      data: {
        terangaAccountId: account.id,
        codeBadge,
        libelle,
        description,
        icone,
      },
    });

    const accountUpdate = bonusCoins > 0 ? this.prisma.terangaAccount.update({
      where: { id: account.id },
      data: { soldeCoins: nouveauSolde },
    }) : null;

    const transactionCreate = bonusCoins > 0 ? this.prisma.terangaTransaction.create({
      data: {
        terangaAccountId: account.id,
        montantCoins: bonusCoins,
        type: TypeTransactionTeranga.CREDIT_BONUS_QUEST,
        description: `Bonus quête accomplie : ${libelle}`,
        soldeApres: nouveauSolde,
      },
    }) : null;

    if (typeof (this.prisma as any).$transaction === 'function') {
      await (this.prisma as PrismaClient).$transaction([
        badgeCreate,
        ...(accountUpdate && transactionCreate ? [accountUpdate, transactionCreate] : []),
      ]);
    } else {
      await badgeCreate;
      if (accountUpdate && transactionCreate) {
        await accountUpdate;
        await transactionCreate;
      }
    }

    return true;
  }
}
