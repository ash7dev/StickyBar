const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLatestReservation() {
  console.log('🔍 Vérification de la dernière réservation créée...\n');

  // 1. Dernière réservation ALL users
  const latestReservation = await prisma.reservation.findFirst({
    orderBy: { creeLe: 'desc' },
    include: {
      locataire: {
        select: {
          id: true,
          prenom: true,
          nom: true,
          email: true,
        },
      },
      paiement: true,
      historique: {
        orderBy: { modifieLe: 'desc' },
      },
    },
  });

  if (!latestReservation) {
    console.log('❌ AUCUNE réservation trouvée dans la base !');
    await prisma.$disconnect();
    return;
  }

  console.log('📋 DERNIÈRE RÉSERVATION CRÉÉE:');
  console.log('  ID:', latestReservation.id);
  console.log('  Créée le:', latestReservation.creeLe.toLocaleString('fr-FR'));
  console.log('  Statut actuel:', latestReservation.statut);
  console.log('  Montant:', Number(latestReservation.totalLocataire), 'FCFA');
  console.log('');

  console.log('👤 LOCATAIRE:');
  console.log('  ID:', latestReservation.locataire.id);
  console.log('  Nom:', latestReservation.locataire.prenom, latestReservation.locataire.nom);
  console.log('  Email:', latestReservation.locataire.email);
  console.log('');

  console.log('📅 DATES:');
  console.log('  Début séjour:', latestReservation.dateDebut.toLocaleDateString('fr-FR'));
  console.log('  Fin séjour:', latestReservation.dateFin.toLocaleDateString('fr-FR'));
  console.log('  Nuits:', latestReservation.nbNuits);
  console.log('');

  console.log('🔐 CHECK-IN STATUS:');
  console.log('  Check-in proprio:', latestReservation.checkinProprioLe ? '✅ Fait le ' + latestReservation.checkinProprioLe.toLocaleString('fr-FR') : '❌ Pas encore fait');
  console.log('  Check-in locataire:', latestReservation.checkinLocataireLe ? '✅ Fait le ' + latestReservation.checkinLocataireLe.toLocaleString('fr-FR') : '❌ Pas encore fait');
  console.log('');

  if (latestReservation.paiement) {
    console.log('💳 PAIEMENT:');
    console.log('  Montant:', Number(latestReservation.paiement.montant), 'FCFA');
    console.log('  Statut:', latestReservation.paiement.statut);
    console.log('  Fournisseur:', latestReservation.paiement.fournisseur);
    console.log('');
  }

  console.log('📜 HISTORIQUE:', latestReservation.historique.length, 'événements');
  latestReservation.historique.slice(0, 5).forEach((h, i) => {
    console.log(`  ${i + 1}. ${h.ancienStatut || 'INIT'} → ${h.nouveauStatut}`);
    console.log(`     ${h.raison || 'N/A'}`);
    console.log(`     Le ${h.modifieLe.toLocaleString('fr-FR')}`);
  });
  console.log('');

  // 2. Vérifier compte Teranga du locataire
  console.log('🏆 COMPTE TERANGA DU LOCATAIRE:');
  const terangaAccount = await prisma.terangaAccount.findUnique({
    where: { utilisateurId: latestReservation.locataireId },
    include: {
      transactions: {
        orderBy: { creeLe: 'desc' },
        take: 5,
      },
    },
  });

  if (terangaAccount) {
    console.log('  ✅ Compte Teranga EXISTE');
    console.log('  Solde:', terangaAccount.soldeCoins, 'Coins');
    console.log('  Tier:', terangaAccount.tier);
    console.log('  GMV 12 mois:', Number(terangaAccount.gmv12Mois), 'FCFA');
    console.log('  Transactions:', terangaAccount.transactions.length);
    if (terangaAccount.transactions.length > 0) {
      console.log('\n  💰 Dernières transactions:');
      terangaAccount.transactions.forEach((tx, i) => {
        console.log(`    ${i + 1}. [${tx.type}] ${tx.montantCoins} Coins`);
        console.log(`       ${tx.description}`);
        console.log(`       Solde après: ${tx.soldeApres} | ${tx.creeLe.toLocaleString('fr-FR')}`);
      });
    }
  } else {
    console.log('  ❌ AUCUN compte Teranga trouvé pour ce locataire !');
    console.log('  ⚠️  Le compte devrait être créé automatiquement lors du check-in');
  }

  await prisma.$disconnect();
}

checkLatestReservation().catch(console.error);
