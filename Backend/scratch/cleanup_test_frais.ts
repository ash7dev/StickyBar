import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const deleted = await prisma.demandeFrais.deleteMany({
    where: {
      reservationId: '8b2888a2-ba3c-4873-89fd-a6f5302ff262',
      titre: 'Consommation électricité supplémentaire',
    },
  });

  console.log('Suppression du supplément fictif de test de la base :', deleted.count);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
