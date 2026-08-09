const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('@prisma/client');

// Charger le fichier .env si présent
try {
  const envPath = path.join(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    for (const line of envConfig.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const val = valueParts.join('=').replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
} catch (e) {
  // Poursuivre avec les valeurs par défaut
}

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lnrxtozuarfqlcfkwroa.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxucnh0b3p1YXJmcWxjZmt3cm9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzc5MzYyNywiZXhwIjoyMDkzMzY5NjI3fQ.eeXWpU41P-txRd2Vnkav2-DeCHTc3v_uD59tQq7vgzU';

const ADMIN_EMAIL = 'adminklefuser@admin.com';
const ADMIN_PASS = 'Senegale1';
const ADMIN_PHONE = '+221770000000';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Initialisation de la création de l\'Administrateur Klef...\n');

  let supabaseUserId = null;

  // 1. Chercher si l'utilisateur existe déjà dans Supabase Auth
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (listError) {
    console.error('❌ Échec de la lecture des utilisateurs Supabase:', listError.message);
    process.exit(1);
  }

  const existingAuthUser = users.find((u) => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase());

  if (existingAuthUser) {
    supabaseUserId = existingAuthUser.id;
    console.log(`ℹ️ Compte Supabase Auth trouvé (ID: ${supabaseUserId}). Mise à jour du mot de passe...`);

    const { error: updateError } = await supabase.auth.admin.updateUserById(supabaseUserId, {
      password: ADMIN_PASS,
      email_confirm: true,
      user_metadata: { prenom: 'Admin', nom: 'Klef', role: 'ADMIN' },
    });

    if (updateError) {
      console.error('❌ Échec de la mise à jour du mot de passe Supabase:', updateError.message);
      process.exit(1);
    }
    console.log('✅ Mot de passe Supabase mis à jour avec succès.');
  } else {
    console.log(`ℹ️ Création du nouveau compte dans Supabase Auth pour ${ADMIN_EMAIL}...`);

    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASS,
      email_confirm: true,
      user_metadata: { prenom: 'Admin', nom: 'Klef', role: 'ADMIN' },
    });

    if (createError || !newUser.user) {
      console.error('❌ Échec de la création dans Supabase Auth:', createError?.message);
      process.exit(1);
    }

    supabaseUserId = newUser.user.id;
    console.log(`✅ Compte Supabase Auth créé avec succès (ID: ${supabaseUserId}).`);
  }

  // 2. Synchronisation dans la base de données PostgreSQL via Prisma
  console.log('\n🔄 Synchronisation du profil et du compte utilisateur dans la base de données PostgreSQL...');

  // Upsert du Profile
  await prisma.profile.upsert({
    where: { userId: supabaseUserId },
    create: {
      userId: supabaseUserId,
      email: ADMIN_EMAIL,
      phone: ADMIN_PHONE,
      typeHote: 'AGENCE',
    },
    update: {
      email: ADMIN_EMAIL,
      phone: ADMIN_PHONE,
      typeHote: 'AGENCE',
    },
  });
  console.log('  └─ Profile synchronisé');

  // Upsert de l'Utilisateur
  const dbUser = await prisma.utilisateur.upsert({
    where: { userId: supabaseUserId },
    create: {
      userId: supabaseUserId,
      email: ADMIN_EMAIL,
      telephone: ADMIN_PHONE,
      prenom: 'Admin',
      nom: 'Klef',
      estProprietaire: true,
      statutKyc: 'VERIFIE',
      profileCompleted: true,
      phoneVerified: true,
      actif: true,
    },
    update: {
      email: ADMIN_EMAIL,
      telephone: ADMIN_PHONE,
      prenom: 'Admin',
      nom: 'Klef',
      estProprietaire: true,
      statutKyc: 'VERIFIE',
      profileCompleted: true,
      phoneVerified: true,
      actif: true,
    },
  });
  console.log('  └─ Utilisateur synchronisé (ID interne:', dbUser.id, ')');

  // Upsert du Wallet
  await prisma.wallet.upsert({
    where: { utilisateurId: dbUser.id },
    create: { utilisateurId: dbUser.id, soldeDisponible: 0 },
    update: {},
  });
  console.log('  └─ Wallet administrateur prêt');

  console.log('\n=============================================================');
  console.log('🎉 COMPTE ADMINISTRATEUR CRÉÉ ET VALIDÉ AVEC SUCCÈS !');
  console.log('=============================================================');
  console.log(` Identifiant Email : ${ADMIN_EMAIL}`);
  console.log(` Mot de passe      : ${ADMIN_PASS}`);
  console.log(` Téléphone         : ${ADMIN_PHONE}`);
  console.log(` Statut KYC        : VÉRIFIÉ`);
  console.log(` Rôle              : ADMINISTRATEUR (PROPRIETAIRE + ADMIN)`);
  console.log('=============================================================\n');

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('❌ Erreur inattendue:', e);
  await prisma.$disconnect();
  process.exit(1);
});
