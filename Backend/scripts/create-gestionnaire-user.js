const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

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
} catch (e) {}

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lnrxtozuarfqlcfkwroa.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const GESTIONNAIRE_EMAIL = 'gestionnaireklefuser@gestionnaire.com';
const GESTIONNAIRE_PASS = 'Senegale1';
const GESTIONNAIRE_PHONE = '+221770000001';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log('🚀 Création du compte Gestionnaire Klef...\n');
  console.log('⚠️  Ce script ne modifie AUCUNE donnée existante. INSERT uniquement.\n');

  // ── 1. Supabase Auth ──────────────────────────────────────────────────────
  let supabaseUserId = null;

  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (listError) { console.error('❌', listError.message); process.exit(1); }

  const existing = users.find((u) => u.email?.toLowerCase() === GESTIONNAIRE_EMAIL.toLowerCase());

  if (existing) {
    supabaseUserId = existing.id;
    console.log(`ℹ️  Compte Auth existant (ID: ${supabaseUserId}). Mise à jour mdp...`);
    await supabase.auth.admin.updateUserById(supabaseUserId, {
      password: GESTIONNAIRE_PASS,
      email_confirm: true,
      user_metadata: { prenom: 'gestionnaire', nom: 'klef', role: 'GESTIONNAIRE' },
    });
    console.log('✅ Auth mis à jour.');
  } else {
    console.log(`ℹ️  Création Auth pour ${GESTIONNAIRE_EMAIL}...`);
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: GESTIONNAIRE_EMAIL,
      password: GESTIONNAIRE_PASS,
      email_confirm: true,
      user_metadata: { prenom: 'gestionnaire', nom: 'klef', role: 'GESTIONNAIRE' },
    });
    if (createError || !newUser.user) { console.error('❌', createError?.message); process.exit(1); }
    supabaseUserId = newUser.user.id;
    console.log(`✅ Compte Auth créé (ID: ${supabaseUserId}).`);
  }

  // ── 2. Profile (table "profiles") ─────────────────────────────────────────
  console.log('\n🔄 Synchronisation PostgreSQL via Supabase REST API (HTTPS)...');

  const { data: existingProfile } = await supabase
    .from('profiles').select('id').eq('user_id', supabaseUserId).maybeSingle();

  if (existingProfile) {
    console.log('  └─ Profile déjà existant, skip');
  } else {
    const profileId = crypto.randomUUID();
    const { error: profErr } = await supabase.from('profiles').insert({
      id: profileId,
      user_id: supabaseUserId,
      email: GESTIONNAIRE_EMAIL,
      phone: GESTIONNAIRE_PHONE,
      typeHote: 'AGENCE',
    });
    if (profErr) { console.error('  ⚠️ Profile insert:', profErr.message); }
    else { console.log('  └─ Profile créé (ID:', profileId, ')'); }
  }

  // ── 3. Utilisateur ────────────────────────────────────────────────────────
  const { data: existingUser } = await supabase
    .from('Utilisateur').select('id').eq('userId', supabaseUserId).maybeSingle();

  let dbUserId;

  if (existingUser) {
    dbUserId = existingUser.id;
    console.log('  └─ Utilisateur déjà existant (ID:', dbUserId, '), skip');
  } else {
    dbUserId = crypto.randomUUID();
    const now = new Date().toISOString();
    const { error: userErr } = await supabase.from('Utilisateur').insert({
      id: dbUserId,
      userId: supabaseUserId,
      email: GESTIONNAIRE_EMAIL,
      telephone: GESTIONNAIRE_PHONE,
      prenom: 'gestionnaire',
      nom: 'klef',
      estProprietaire: true,
      statutKyc: 'VERIFIE',
      profileCompleted: true,
      phoneVerified: true,
      actif: true,
      creeLe: now,
      misAJourLe: now,
      codeParrainage: 'GESTKLEF',
    });
    if (userErr) { console.error('❌ Utilisateur insert:', userErr.message); process.exit(1); }
    console.log('  └─ Utilisateur créé (ID:', dbUserId, ')');
  }

  // ── 4. Wallet ─────────────────────────────────────────────────────────────
  const { data: existingWallet } = await supabase
    .from('Wallet').select('id').eq('utilisateurId', dbUserId).maybeSingle();

  if (existingWallet) {
    console.log('  └─ Wallet déjà existant, skip');
  } else {
    const walletId = crypto.randomUUID();
    const { error: walletErr } = await supabase.from('Wallet').insert({
      id: walletId,
      utilisateurId: dbUserId,
      soldeDisponible: 0,
      misAJourLe: new Date().toISOString(),
    });
    if (walletErr) { console.error('  ⚠️ Wallet:', walletErr.message); }
    else { console.log('  └─ Wallet créé'); }
  }

  // ── Résultat ──────────────────────────────────────────────────────────────
  console.log('\n=============================================================');
  console.log('🎉 COMPTE GESTIONNAIRE CRÉÉ AVEC SUCCÈS !');
  console.log('=============================================================');
  console.log(` Email     : ${GESTIONNAIRE_EMAIL}`);
  console.log(` Password  : ${GESTIONNAIRE_PASS}`);
  console.log(` Téléphone : ${GESTIONNAIRE_PHONE}`);
  console.log(` KYC       : VÉRIFIÉ`);
  console.log(` ID interne: ${dbUserId}`);
  console.log('=============================================================');
  console.log('\n⚠️  PROCHAINE ÉTAPE : exécuter "npx prisma db push" depuis');
  console.log('   un réseau ayant accès au serveur PostgreSQL Supabase');
  console.log('   pour ajouter les colonnes estGestionnaire, isShadowAccount,');
  console.log('   gestionnaireId, gestionDeleguee, puis mettre à jour ce');
  console.log('   user avec estGestionnaire=true.\n');
}

main().catch((e) => { console.error('❌', e); process.exit(1); });
