import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const fraisId = 'fb5d4823-5dcd-4f67-885d-47ba28d773b1';
  const reservationId = '8b2888a2-ba3c-4873-89fd-a6f5302ff262';

  const demande = await prisma.demandeFrais.findUnique({
    where: { id: fraisId },
    include: { reservation: true },
  });

  if (!demande) return;

  const montant = Number(demande.montant);

  await prisma.$transaction(async (tx) => {
    // 1. Remettre le supplément au statut EN_ATTENTE
    await tx.demandeFrais.update({
      where: { id: fraisId },
      data: {
        statut: 'EN_ATTENTE',
        payeLe: null,
        methodePaiement: null,
      },
    });

    // 2. Déduire les 15 000 FCFA du solde du portefeuille de l'hôte
    const hostWallet = await tx.wallet.update({
      where: { utilisateurId: demande.reservation.proprietaireId },
      data: {
        soldeDisponible: { decrement: montant },
      },
    });

    // 3. Supprimer la transaction wallet de test créée
    await tx.transactionWallet.deleteMany({
      where: {
        walletId: hostWallet.id,
        type: 'CREDIT_LOCATION',
        description: { contains: 'Supplément litige (Dépassement de personnes)' },
      },
    });

    console.log('=== RÉINITIALISATION EN_ATTENTE EFFECTUÉE ===');
    console.log('Nouveau Solde Portefeuille Hôte :', Number(hostWallet.soldeDisponible), 'FCFA');
  });
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
