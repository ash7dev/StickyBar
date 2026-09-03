const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.utilisateur.findMany({
    take: 10,
    orderBy: { creeLe: 'desc' },
    select: {
      id: true,
      prenom: true,
      nom: true,
      telephone: true,
      email: true,
      estProprietaire: true,
      isShadowAccount: true,
      phoneVerified: true,
      profileCompleted: true,
    },
  });

  console.log('--- RECENT USERS ---');
  console.dir(users, { depth: null });
}

main().finally(() => prisma.$disconnect());
