const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findUsersByEmail() {
  const email = 'aszothiam28@gmail.com';

  console.log('🔍 Recherche de tous les utilisateurs avec email:', email);
  console.log('');

  const users = await prisma.utilisateur.findMany({
    where: { email },
    select: {
      id: true,
      userId: true,
      prenom: true,
      nom: true,
      email: true,
      telephone: true,
      creeLe: true,
      misAJourLe: true,
    },
    orderBy: { creeLe: 'asc' },
  });

  console.log(`📊 Nombre de comptes: ${users.length}\n`);

  users.forEach((user, i) => {
    console.log(`${i + 1}. ID: ${user.id}`);
    console.log(`   User ID (Supabase): ${user.userId}`);
    console.log(`   Nom: ${user.prenom} ${user.nom}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Téléphone: ${user.telephone || 'N/A'}`);
    console.log(`   Créé le: ${user.creeLe.toLocaleString('fr-FR')}`);
    console.log(`   MAJ le: ${user.misAJourLe.toLocaleString('fr-FR')}`);
    console.log('');
  });

  // Pour chaque utilisateur, vérifier son compte Teranga
  console.log('🏆 COMPTES TERANGA:\n');
  for (const user of users) {
    const teranga = await prisma.terangaAccount.findUnique({
      where: { utilisateurId: user.id },
      include: {
        transactions: {
          orderBy: { creeLe: 'desc' },
          take: 3,
        },
      },
    });

    console.log(`User ${user.id.slice(0, 8)}... (${user.prenom} ${user.nom}):`);
    if (teranga) {
      console.log(`  ✅ Compte Teranga EXISTE`);
      console.log(`     Solde: ${teranga.soldeCoins} Coins`);
      console.log(`     Tier: ${teranga.tier}`);
      console.log(`     GMV: ${Number(teranga.gmv12Mois)} FCFA`);
      console.log(`     Transactions: ${teranga.transactions.length}`);
      if (teranga.transactions.length > 0) {
        console.log(`     Dernière: ${teranga.transactions[0].description}`);
      }
    } else {
      console.log(`  ❌ Aucun compte Teranga`);
    }
    console.log('');
  }

  // Vérifier les réservations
  console.log('🏠 RÉSERVATIONS:\n');
  for (const user of users) {
    const count = await prisma.reservation.count({
      where: { locataireId: user.id },
    });
    console.log(`User ${user.id.slice(0, 8)}... : ${count} réservation(s)`);
  }

  await prisma.$disconnect();
}

findUsersByEmail().catch(console.error);
