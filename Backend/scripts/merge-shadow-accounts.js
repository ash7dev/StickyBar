const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function normalizePhone(phone) {
  if (!phone) return '';
  let cleaned = phone.trim().replace(/[\s\-\.\(\)]/g, '');
  if (cleaned.startsWith('00221')) {
    cleaned = '+221' + cleaned.slice(5);
  } else if (cleaned.startsWith('221') && !cleaned.startsWith('+221')) {
    cleaned = '+' + cleaned;
  } else if (!cleaned.startsWith('+') && (cleaned.length === 9 || cleaned.length === 10)) {
    const digits = cleaned.replace(/^0/, '');
    if (digits.length === 9) {
      cleaned = '+221' + digits;
    }
  }
  return cleaned;
}

async function main() {
  console.log('🔍 Recherche des comptes shadow faisant doublon avec des comptes réels...');

  const allUsers = await prisma.utilisateur.findMany({
    orderBy: { creeLe: 'asc' },
  });

  const shadowUsers = allUsers.filter((u) => u.isShadowAccount || u.email?.startsWith('shadow_'));
  console.log(`Trouvé ${shadowUsers.length} compte(s) shadow.`);

  for (const shadow of shadowUsers) {
    const shadowNormPhone = normalizePhone(shadow.telephone);
    const shadowDigits = shadowNormPhone.replace(/[^0-9]/g, '');

    // Trouver le compte réel correspondant (non-shadow)
    const realUser = allUsers.find(
      (u) =>
        !u.isShadowAccount &&
        !u.email?.startsWith('shadow_') &&
        u.id !== shadow.id &&
        (normalizePhone(u.telephone) === shadowNormPhone ||
          (shadowDigits.length >= 9 && normalizePhone(u.telephone).replace(/[^0-9]/g, '') === shadowDigits))
    );

    if (realUser) {
      console.log(`\n⚡ Fusion détectée pour le numéro ${shadow.telephone} :`);
      console.log(`   - Ombre : [${shadow.id}] ${shadow.prenom} ${shadow.nom} (${shadow.email})`);
      console.log(`   - Réel :  [${realUser.id}] ${realUser.prenom} ${realUser.nom} (${realUser.email})`);

      // 1. Promouvoir le compte réel en propriétaire si nécessaire
      await prisma.utilisateur.update({
        where: { id: realUser.id },
        data: { estProprietaire: true },
      });

      // 2. Transférer tous les logements du compte shadow vers le compte réel
      const updatedLogements = await prisma.logement.updateMany({
        where: { proprietaireId: shadow.id },
        data: { proprietaireId: realUser.id },
      });
      console.log(`   👉 ${updatedLogements.count} logement(s) réaffecté(s) au compte réel.`);

      // 3. S'assurer que le compte réel a un Wallet
      const existingWallet = await prisma.wallet.findUnique({
        where: { utilisateurId: realUser.id },
      });
      if (!existingWallet) {
        await prisma.wallet.create({
          data: { utilisateurId: realUser.id, soldeDisponible: 0 },
        });
        console.log(`   👉 Wallet créé pour le compte réel.`);
      }

      // 4. Supprimer le compte shadow doublon et son profil
      await prisma.logement.deleteMany({ where: { proprietaireId: shadow.id } }); // au cas où
      await prisma.wallet.deleteMany({ where: { utilisateurId: shadow.id } });
      await prisma.utilisateur.delete({ where: { id: shadow.id } });
      await prisma.profile.deleteMany({ where: { userId: shadow.userId } });
      console.log(`   ✅ Compte shadow ${shadow.id} supprimé proprement.`);
    }
  }

  console.log('\n🎉 Nettoyage et fusion des doublons terminés avec succès !');
}

main()
  .catch((e) => {
    console.error('Erreur lors du nettoyage :', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
