import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const updated = await prisma.reservation.update({
    where: { id: '8b2888a2-ba3c-4873-89fd-a6f5302ff262' },
    data: { statut: 'CONFIRMED' },
  });
  console.log('Réservation mise à jour avec statut CONFIRMED :', updated.id, updated.statut);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
