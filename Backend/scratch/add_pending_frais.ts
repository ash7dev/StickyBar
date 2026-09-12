import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const pendingFrais = await prisma.demandeFrais.create({
    data: {
      reservationId: '8b2888a2-ba3c-4873-89fd-a6f5302ff262',
      titre: 'Consommation électricité supplémentaire',
      description: 'Dépassement du forfait de 50 kWh inclus dans le contrat',
      montant: 20000,
      statut: 'EN_ATTENTE',
    },
  });

  console.log('DemandeFrais EN_ATTENTE créée avec succès :', pendingFrais);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
