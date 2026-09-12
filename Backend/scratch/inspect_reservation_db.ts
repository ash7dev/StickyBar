import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const reservation = await prisma.reservation.findUnique({
    where: { id: '8b2888a2-ba3c-4873-89fd-a6f5302ff262' },
    include: {
      demandesFrais: true,
      litige: true,
      paiement: true,
    },
  });

  console.log('=== ÉTAT EXACT DE LA RÉSERVATION EN BASE DE DONNÉES ===');
  console.log('ID Réservation:', reservation?.id);
  console.log('Statut Réservation:', reservation?.statut);
  console.log('Locataire ID:', reservation?.locataireId);
  console.log('Propriétaire ID:', reservation?.proprietaireId);
  console.log('Litige:', reservation?.litige);
  console.log('Demandes de Frais:', reservation?.demandesFrais);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
