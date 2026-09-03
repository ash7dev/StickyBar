import { PrismaClient } from '@prisma/client';
import { normalizePhoneNumber } from '../shared/utils/phone-utils';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Démarrage de la normalisation des numéros de téléphone...');

  const users = await prisma.utilisateur.findMany({
    select: { id: true, prenom: true, nom: true, telephone: true },
  });

  let updatedCount = 0;

  for (const user of users) {
    if (!user.telephone || user.telephone.startsWith('google_')) continue;

    const normalized = normalizePhoneNumber(user.telephone);
    if (normalized && normalized !== user.telephone) {
      console.log(`📱 Normalisation pour ${user.prenom} ${user.nom} : "${user.telephone}" ➔ "${normalized}"`);
      await prisma.utilisateur.update({
        where: { id: user.id },
        data: { telephone: normalized },
      });
      updatedCount++;
    }
  }

  console.log(`✅ Normalisation terminée : ${updatedCount} utilisateur(s) mis à jour sur ${users.length}.`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors de la normalisation :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
