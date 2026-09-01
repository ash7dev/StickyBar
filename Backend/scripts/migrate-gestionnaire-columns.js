const fs = require('fs');
const path = require('path');
const https = require('https');

// Charger le .env
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
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
} catch (e) {}

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lnrxtozuarfqlcfkwroa.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PROJECT_REF = 'lnrxtozuarfqlcfkwroa';
const DB_PASS = 'Boussodiop12%';

// Les ALTER TABLE à exécuter
const SQL_STATEMENTS = [
  `ALTER TABLE "Utilisateur" ADD COLUMN IF NOT EXISTS "estGestionnaire" BOOLEAN DEFAULT false;`,
  `ALTER TABLE "Utilisateur" ADD COLUMN IF NOT EXISTS "isShadowAccount" BOOLEAN DEFAULT false;`,
  `ALTER TABLE "Logement" ADD COLUMN IF NOT EXISTS "gestionnaireId" TEXT;`,
  `ALTER TABLE "Logement" ADD COLUMN IF NOT EXISTS "gestionDeleguee" BOOLEAN DEFAULT false;`,
  // Mettre à jour le user gestionnaire
  `UPDATE "Utilisateur" SET "estGestionnaire" = true WHERE email = 'gestionnaireklefuser@gestionnaire.com';`,
];

// ── Méthode 1: Supabase REST API via rpc ────────────────────────────────────
async function trySupabaseRpc() {
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  console.log('📡 Méthode 1: Supabase RPC (exec_sql)...');
  
  const fullSql = SQL_STATEMENTS.join('\n');
  const { data, error } = await supabase.rpc('exec_sql', { sql: fullSql });
  
  if (error) {
    console.log('  └─ RPC exec_sql non disponible:', error.message);
    return false;
  }
  console.log('  └─ ✅ SQL exécuté via RPC !');
  return true;
}

// ── Méthode 2: Pooler connection (IPv4) ─────────────────────────────────────
async function tryPoolerConnection() {
  console.log('\n📡 Méthode 2: Supabase Pooler (IPv4)...');
  
  const regions = ['eu-central-1', 'eu-west-1', 'us-east-1', 'us-west-1', 'ap-southeast-1'];
  
  for (const region of regions) {
    const poolerHost = `aws-0-${region}.pooler.supabase.com`;
    // Session mode on port 5432 supports DDL
    const connStr = `postgresql://postgres.${PROJECT_REF}:${DB_PASS}@${poolerHost}:5432/postgres?sslmode=require`;
    
    console.log(`  Essai ${poolerHost}:5432...`);
    
    try {
      // Override DATABASE_URL pour Prisma
      process.env.DATABASE_URL = connStr;
      process.env.DIRECT_URL = connStr;
      
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient({ datasources: { db: { url: connStr } } });
      
      // Test de connexion
      await prisma.$queryRaw`SELECT 1`;
      console.log(`  └─ ✅ Connecté via ${poolerHost} !`);
      
      // Exécuter les ALTER TABLE
      for (const sql of SQL_STATEMENTS) {
        console.log(`  └─ Exécution: ${sql.substring(0, 60)}...`);
        await prisma.$executeRawUnsafe(sql);
      }
      
      console.log('  └─ ✅ Toutes les migrations exécutées !');
      await prisma.$disconnect();
      return true;
    } catch (e) {
      console.log(`  └─ Échec: ${e.message.substring(0, 80)}`);
    }
  }
  
  return false;
}

// ── Méthode 3: HTTP direct vers pg-meta (port 443) ─────────────────────────
async function tryPgMeta() {
  console.log('\n📡 Méthode 3: Supabase pg-meta REST (HTTPS)...');
  
  const fullSql = SQL_STATEMENTS.join('\n');
  
  // pg-meta query endpoint
  const url = `${SUPABASE_URL}/pg/query`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'apikey': SERVICE_KEY,
      },
      body: JSON.stringify({ query: fullSql }),
    });
    
    if (response.ok) {
      console.log('  └─ ✅ SQL exécuté via pg-meta !');
      return true;
    } else {
      const text = await response.text();
      console.log(`  └─ HTTP ${response.status}: ${text.substring(0, 100)}`);
    }
  } catch (e) {
    console.log(`  └─ Échec: ${e.message}`);
  }
  
  return false;
}

// ── Méthode 4: Supabase SQL via /rest/v1/ avec raw SQL dans une fonction ────
async function tryCreateAndCallFunction() {
  console.log('\n📡 Méthode 4: Créer une fonction SQL via REST puis l\'appeler...');
  
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  
  // Créer une fonction temporaire qui exécute notre DDL
  const createFnSql = `
    CREATE OR REPLACE FUNCTION _tmp_migrate_gestionnaire()
    RETURNS void AS $$
    BEGIN
      ALTER TABLE "Utilisateur" ADD COLUMN IF NOT EXISTS "estGestionnaire" BOOLEAN DEFAULT false;
      ALTER TABLE "Utilisateur" ADD COLUMN IF NOT EXISTS "isShadowAccount" BOOLEAN DEFAULT false;
      ALTER TABLE "Logement" ADD COLUMN IF NOT EXISTS "gestionnaireId" TEXT;
      ALTER TABLE "Logement" ADD COLUMN IF NOT EXISTS "gestionDeleguee" BOOLEAN DEFAULT false;
      UPDATE "Utilisateur" SET "estGestionnaire" = true WHERE email = 'gestionnaireklefuser@gestionnaire.com';
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;

  // On ne peut pas créer la fonction via REST sans accès SQL direct...
  // Mais essayons quand même via rpc
  const { error } = await supabase.rpc('_tmp_migrate_gestionnaire');
  if (!error) {
    console.log('  └─ ✅ Fonction exécutée !');
    return true;
  }
  console.log('  └─ Fonction non trouvée:', error.message);
  return false;
}

async function main() {
  console.log('🔧 Migration des colonnes Gestionnaire vers PostgreSQL Supabase');
  console.log('   (4 stratégies de connexion)\n');
  
  if (await trySupabaseRpc()) return;
  if (await tryPoolerConnection()) return;
  if (await tryPgMeta()) return;
  if (await tryCreateAndCallFunction()) return;
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('❌ Aucune méthode n\'a fonctionné depuis ce réseau.');
  console.log('');
  console.log('👉 Solutions alternatives :');
  console.log('   1. Va sur https://supabase.com/dashboard → SQL Editor');
  console.log('      et exécute ce SQL :');
  console.log('');
  for (const sql of SQL_STATEMENTS) {
    console.log(`      ${sql}`);
  }
  console.log('');
  console.log('   2. Ou connecte-toi en 4G/données mobiles et relance');
  console.log('      npx prisma db push');
  console.log('═══════════════════════════════════════════════════════════════');
}

main().catch((e) => { console.error('❌', e.message); process.exit(1); });
