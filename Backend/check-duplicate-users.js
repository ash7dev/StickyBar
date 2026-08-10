const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDuplicateUsers() {
  const email = 'aszothiam28@gmail.com';

  console.log('🔍 Recherche de tous les comptes avec email:', email);
  console.log('');

  const users = await prisma.utilisateur.findMany({
    where: { email },
    select: {
      id: true,
      prenom: true,
      nom: true,
      email: true,
      telephone: true,
      activeRole: true,
      creeLe: true,
      updatedAt: true,
      _count: {
        select: {
          reservationsLocataire: true,
          reservationsProprietaire: true,
        },
      },
    },
    orderBy: { creeLe: 'desc' },
  });

  console.log(`📊 Nombre de comptes trouvés: ${users.length}\n`);

  if (users.length === 0) {
    console.log('❌ Aucun compte trouvé avec cet email');
  } else {
    users.forEach((user, i) => {
      console.log(`${i + 1}. USER ID: ${user.id}`);
      console.log(`   Nom: ${user.prenom} ${user.nom}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Téléphone: ${user.telephone || 'N/A'}`);
      console.log(`   Role actif: ${user.activeRole}`);
      console.log(`   Réservations locataire: ${user._count.reservationsLocataire}`);
      console.log(`   Réservations proprio: ${user._count.reservationsProprietaire}`);
      console.log(`   Créé le: ${user.creeLe.toLocaleString('fr-FR')}`);
      console.log(`   Dernière modif: ${user.updatedAt.toLocaleString('fr-FR')}`);
      console.log('');
    });
  }

  // Vérifier les comptes Teranga
  console.log('🏆 COMPTES TERANGA:');
  const terangaAccounts = await prisma.terangaAccount.findMany({
    where: {
      utilisateur: { email },
    },
    include: {
      utilisateur: {
        select: {
          id: true,
          prenom: true,
          nom: true,
        },
      },
      transactions: {
        orderBy: { creeLe: 'desc' },
        take: 3,
      },
    },
  });

  if (terangaAccounts.length === 0) {
    console.log('  ❌ Aucun compte Teranga trouvé');
  } else {
    terangaAccounts.forEach((acc, i) => {
      console.log(`  ${i + 1}. Teranga ID: ${acc.id}`);
      console.log(`     User: ${acc.utilisateur.prenom} ${acc.utilisateur.nom} (${acc.utilisateurId})`);
      console.log(`     Solde: ${acc.soldeCoins} Coins`);
      console.log(`     Tier: ${acc.tier}`);
      console.log(`     GMV 12 mois: ${Number(acc.gmv12Mois)} FCFA`);
      console.log(`     Transactions: ${acc.transactions.length}`);
      if (acc.transactions.length > 0) {
        console.log(`     Dernière transaction: ${acc.transactions[0].description}`);
      }
      console.log('');
    });
  }

  await prisma.$disconnect();
}

checkDuplicateUsers().catch(console.error);
