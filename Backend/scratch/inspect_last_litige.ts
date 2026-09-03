import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const lastLitige = await prisma.litige.findFirst({
    orderBy: { creeLe: 'desc' },
    include: {
      reservation: {
        include: {
          demandesFrais: true,
          paiement: true,
          locataire: { select: { id: true, prenom: true, nom: true, email: true } },
          proprietaire: { select: { id: true, prenom: true, nom: true, email: true } },
        },
      },
    },
  });

  console.log('=== DERNIER LITIGE EN BASE DE DONNÉES ===');
  console.dir(lastLitige, { depth: null });
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
