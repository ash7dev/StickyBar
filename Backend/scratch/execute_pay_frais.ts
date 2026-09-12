import { PrismaClient, TypeTransactionWallet, SensTransaction } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const fraisId = 'fb5d4823-5dcd-4f67-885d-47ba28d773b1';
  const reservationId = '8b2888a2-ba3c-4873-89fd-a6f5302ff262';

  const demande = await prisma.demandeFrais.findUnique({
    where: { id: fraisId },
    include: { reservation: true },
  });

  if (!demande) {
    console.error('DemandeFrais introuvable');
    return;
  }

  const montant = Number(demande.montant);

  const result = await prisma.$transaction(async (tx) => {
    // 1. Mettre à jour la demande de frais
    const updatedFrais = await tx.demandeFrais.update({
      where: { id: fraisId },
      data: {
        statut: 'PAYE',
        payeLe: new Date(),
        methodePaiement: 'WAVE',
      },
    });

    // 2. Créditer le portefeuille du propriétaire
    const hostWallet = await tx.wallet.upsert({
      where: { utilisateurId: demande.reservation.proprietaireId },
      create: {
        utilisateurId: demande.reservation.proprietaireId,
        soldeDisponible: montant,
      },
      update: {
        soldeDisponible: { increment: montant },
      },
    });

    const soldeApres = Number(hostWallet.soldeDisponible);

    // 3. Créer la transaction wallet (sans reservationId pour éviter le conflit d'unicité unique([reservationId, type]))
    const transaction = await tx.transactionWallet.create({
      data: {
        walletId: hostWallet.id,
        type: TypeTransactionWallet.CREDIT_LOCATION,
        montant,
        sens: SensTransaction.CREDIT,
        soldeApres,
        description: `Paiement supplément "${demande.titre}" (${montant.toLocaleString('fr-FR')} FCFA) via WAVE — résa ${reservationId.slice(0, 8).toUpperCase()}`,
      },
    });

    return { updatedFrais, hostWallet, transaction };
  });

  console.log('=== PAIEMENT DU SUPPLÉMENT ET CRÉDIT PORTEFEUILLE EFFECTUÉ ===');
  console.log('Supplément mis à jour :', result.updatedFrais);
  console.log('Nouveau Solde Portefeuille Hôte :', Number(result.hostWallet.soldeDisponible), 'FCFA');
  console.log('Transaction Wallet créée :', result.transaction);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
