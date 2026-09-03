import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Supprimer le test manuel EN_ATTENTE
  await prisma.demandeFrais.deleteMany({
    where: {
      reservationId: '8b2888a2-ba3c-4873-89fd-a6f5302ff262',
      statut: 'EN_ATTENTE',
    },
  });

  // 2. Enregistrer le supplément officiel issu de l'arbitrage Admin (15 000 FCFA)
  const fraisArbitre = await prisma.demandeFrais.create({
    data: {
      reservationId: '8b2888a2-ba3c-4873-89fd-a6f5302ff262',
      titre: 'Supplément litige (Dépassement de personnes)',
      description: 'Arbitrage Klef : Litige FONDÉ. Dédommagement de 15 000 FCFA crédité au portefeuille de l\'hôte.',
      montant: 15000,
      statut: 'PAYE',
      payeLe: new Date('2026-09-03T17:18:50.000Z'),
      methodePaiement: 'ARBITRAGE_ADMIN',
    },
  });

  console.log('DemandeFrais officielle d\'arbitrage synchronisée :', fraisArbitre);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
