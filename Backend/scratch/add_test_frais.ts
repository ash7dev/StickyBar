import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const newFrais = await prisma.demandeFrais.create({
    data: {
      reservationId: '8b2888a2-ba3c-4873-89fd-a6f5302ff262',
      titre: 'Supplément dépassement voyageurs',
      description: '2 personnes supplémentaires non déclarées à l\'arrivée',
      montant: 15000,
      statut: 'EN_ATTENTE',
    },
  });

  console.log('DemandeFrais créée avec succès :', newFrais);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
