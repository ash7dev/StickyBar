const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAllReservations() {
  const userId = 'dcc1b20d-ef28-44a9-ac4d-bb2b4920b648';

  console.log('🔍 Toutes les réservations pour user:', userId);
  console.log('');

  const reservations = await prisma.reservation.findMany({
    where: { locataireId: userId },
    select: {
      id: true,
      statut: true,
      totalLocataire: true,
      dateDebut: true,
      dateFin: true,
      checkinProprioLe: true,
      checkinLocataireLe: true,
      creeLe: true,
    },
    orderBy: { creeLe: 'desc' },
  });

  console.log(`📋 Total: ${reservations.length} réservation(s)`);
  console.log('');

  if (reservations.length === 0) {
    console.log('❌ Aucune réservation trouvée !');
  } else {
    reservations.forEach((r, i) => {
      console.log(`${i + 1}. Réservation ID: ${r.id.slice(0, 12)}...`);
      console.log(`   Statut: ${r.statut}`);
      console.log(`   Montant: ${Number(r.totalLocataire)} FCFA`);
      console.log(`   Date séjour: ${r.dateDebut.toLocaleDateString('fr-FR')} → ${r.dateFin.toLocaleDateString('fr-FR')}`);
      console.log(`   Check-in proprio: ${r.checkinProprioLe ? '✅ Fait' : '❌ Pas fait'}`);
      console.log(`   Check-in locataire: ${r.checkinLocataireLe ? '✅ Fait le ' + r.checkinLocataireLe.toLocaleString('fr-FR') : '❌ Pas fait'}`);
      console.log(`   Créée le: ${r.creeLe.toLocaleString('fr-FR')}`);
      console.log('');
    });
  }

  await prisma.$disconnect();
}

checkAllReservations().catch(console.error);
