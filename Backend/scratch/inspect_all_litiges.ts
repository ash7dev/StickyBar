import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const litiges = await prisma.litige.findMany({
    orderBy: { creeLe: 'desc' },
    take: 5,
    include: {
      reservation: {
        select: {
          id: true,
          statut: true,
          checkinLocataireLe: true,
          checkinProprioLe: true,
          checkoutLocataireLe: true,
          checkoutProprioLe: true,
          demandesFrais: true,
          locataire: { select: { email: true, prenom: true, nom: true } },
          proprietaire: { select: { email: true, prenom: true, nom: true } },
        },
      },
    },
  });

  console.log('=== 5 DERNIERS LITIGES EN BASE DE DONNÉES ===');
  litiges.forEach((l, index) => {
    console.log(`\n--- Litige #${index + 1} ---`);
    console.log('ID Litige:', l.id);
    console.log('Motif:', l.motif);
    console.log('Déclaré par:', l.declarePar);
    console.log('Description:', l.description);
    console.log('Statut Litige:', l.statut);
    console.log('Décision Admin:', l.decisionAdmin);
    console.log('Montant Compensation Accordé:', l.montantCompensation);
    console.log('Résolu le:', l.resoluLe);
    console.log('ID Réservation:', l.reservationId);
    console.log('Statut Réservation:', l.reservation.statut);
    console.log('Check-in Locataire:', l.reservation.checkinLocataireLe);
    console.log('Check-in Propriétaire:', l.reservation.checkinProprioLe);
    console.log('Demandes de Frais sur Réservation:', l.reservation.demandesFrais);
  });
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
