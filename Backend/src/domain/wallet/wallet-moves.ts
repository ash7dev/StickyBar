import { Prisma, SensTransaction, TypeTransactionWallet } from '@prisma/client';

type Tx = Prisma.TransactionClient;

async function lockWallet(tx: Tx, utilisateurId: string) {
  // Verrou de ligne : deux mouvements simultanés sur le même portefeuille ne peuvent pas se croiser
  const rows = await tx.$queryRaw<Array<{ id: string; soldeDisponible: Prisma.Decimal; dettePenalites: Prisma.Decimal }>>`
    SELECT id, "soldeDisponible", "dettePenalites" FROM "Wallet" WHERE "utilisateurId" = ${utilisateurId} FOR UPDATE
  `;
  if (rows[0]) return { id: rows[0].id, solde: Number(rows[0].soldeDisponible), dette: Number(rows[0].dettePenalites) };
  const created = await tx.wallet.create({ data: { utilisateurId, soldeDisponible: 0, dettePenalites: 0 } });
  return { id: created.id, solde: 0, dette: 0 };
}

/**
 * Crédite un portefeuille. Une dette de pénalités est d'abord remboursée sur ce crédit.
 * Retourne le montant réellement ajouté au solde.
 */
export async function creditWallet(
  tx: Tx,
  { utilisateurId, reservationId, montant, type, description }: {
    utilisateurId: string;
    reservationId: string;
    montant: number;
    type: TypeTransactionWallet;
    description: string;
  },
): Promise<number> {
  if (montant <= 0) return 0;
  const w = await lockWallet(tx, utilisateurId);
  const aDeduire = Math.min(montant, w.dette);
  const net = montant - aDeduire;

  await tx.wallet.update({
    where: { id: w.id },
    data: {
      ...(net > 0 && { soldeDisponible: { increment: net } }),
      ...(aDeduire > 0 && { dettePenalites: { decrement: aDeduire } }),
    },
  });
  if (aDeduire > 0) {
    await tx.transactionWallet.create({
      data: {
        walletId: w.id,
        reservationId,
        type: TypeTransactionWallet.DEBIT_DETTE,
        montant: aDeduire,
        sens: SensTransaction.DEBIT,
        soldeApres: w.solde,
        description: `Dette de pénalités déduite — résa ${reservationId.slice(0, 8).toUpperCase()}`,
      },
    });
  }
  await tx.transactionWallet.create({
    data: {
      walletId: w.id,
      reservationId,
      type,
      montant,
      sens: SensTransaction.CREDIT,
      soldeApres: w.solde + net,
      description: aDeduire > 0 ? `${description} (dette déduite : ${aDeduire.toLocaleString('fr-FR')} FCFA)` : description,
    },
  });
  return net;
}

/**
 * Débite un portefeuille ; ce que le solde ne couvre pas devient une dette,
 * déduite automatiquement des prochains versements. Le solde ne devient jamais négatif.
 */
export async function debitWallet(
  tx: Tx,
  { utilisateurId, reservationId, montant, type, description }: {
    utilisateurId: string;
    reservationId: string;
    montant: number;
    type: TypeTransactionWallet;
    description: string;
  },
): Promise<{ debite: number; dette: number }> {
  if (montant <= 0) return { debite: 0, dette: 0 };
  const w = await lockWallet(tx, utilisateurId);
  const debite = Math.min(w.solde, montant);
  const dette = montant - debite;

  await tx.wallet.update({
    where: { id: w.id },
    data: {
      ...(debite > 0 && { soldeDisponible: { decrement: debite } }),
      ...(dette > 0 && { dettePenalites: { increment: dette } }),
    },
  });
  await tx.transactionWallet.create({
    data: {
      walletId: w.id,
      reservationId,
      type,
      montant,
      sens: SensTransaction.DEBIT,
      soldeApres: w.solde - debite,
      description: dette > 0 ? `${description} (dette créée : ${dette.toLocaleString('fr-FR')} FCFA)` : description,
    },
  });
  return { debite, dette };
}
