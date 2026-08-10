const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTeranga() {
  const userId = 'dcc1b20d-ef28-44a9-ac4d-bb2b4920b648';

  console.log('🔍 Vérification Teranga Club pour user:', userId);
  console.log('');

  // 1. Vérifier le compte Teranga
  const account = await prisma.terangaAccount.findUnique({
    where: { utilisateurId: userId },
    include: {
      badges: true,
      transactions: { orderBy: { creeLe: 'desc' }, take: 10 },
    },
  });

  console.log('📊 Compte Teranga:');
  if (account) {
    console.log('  - ID:', account.id);
    console.log('  - Solde Coins:', account.soldeCoins);
    console.log('  - Tier:', account.tier);
    console.log('  - GMV 12 mois:', Number(account.gmv12Mois));
    console.log('  - Badges:', account.badges.length);
    console.log('  - Transactions:', account.transactions.length);
    console.log('');

    if (account.transactions.length > 0) {
      console.log('💰 Dernières transactions:');
      account.transactions.forEach((tx, i) => {
        console.log(`  ${i + 1}. [${tx.type}] ${tx.montantCoins} Coins - ${tx.description}`);
        console.log(`     Solde après: ${tx.soldeApres} | Créé le: ${tx.creeLe}`);
      });
    } else {
      console.log('❌ Aucune transaction trouvée !');
    }
  } else {
    console.log('  ❌ Aucun compte Teranga trouvé !');
  }

  console.log('');

  // 2. Vérifier les réservations
  const reservations = await prisma.reservation.findMany({
    where: {
      locataireId: userId,
      statut: { in: ['CHECKED_IN', 'COMPLETED'] },
    },
    select: {
      id: true,
      statut: true,
      totalLocataire: true,
      dateDebut: true,
      checkinLocataireLe: true,
    },
    orderBy: { dateDebut: 'desc' },
  });

  console.log('🏠 Réservations CHECKED_IN/COMPLETED:', reservations.length);
  if (reservations.length > 0) {
    reservations.forEach((r, i) => {
      console.log(`  ${i + 1}. [${r.statut}] ID: ${r.id.slice(0, 8)}`);
      console.log(`     Montant: ${Number(r.totalLocataire)} FCFA`);
      console.log(`     Check-in locataire: ${r.checkinLocataireLe || 'N/A'}`);
    });
  } else {
    console.log('  ❌ Aucune réservation CHECKED_IN/COMPLETED trouvée !');
  }

  await prisma.$disconnect();
}

checkTeranga().catch(console.error);
