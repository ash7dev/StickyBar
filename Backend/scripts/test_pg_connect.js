const { Client } = require('pg');

async function test() {
  const hosts = [
    'aws-0-eu-central-1.pooler.supabase.com',
    'aws-0-us-east-1.pooler.supabase.com',
    'db.lnrxtozuarfqlcfkwroa.supabase.co',
    '[2a05:d018:8eb:2f01:d824:c328:8a7a:5d7b]',
  ];

  for (const host of hosts) {
    console.log(`Testing host ${host}...`);
    try {
      const client = new Client({
        connectionString: `postgresql://postgres:Boussodiop12%25@${host}:5432/postgres?sslmode=require`,
        connectionTimeoutMillis: 3000,
      });
      await client.connect();
      console.log(`SUCCESS! Connected to ${host}!`);
      
      // Run DDL migrations
      await client.query(`
        ALTER TABLE "Utilisateur" ADD COLUMN IF NOT EXISTS "estGestionnaire" BOOLEAN DEFAULT false;
        ALTER TABLE "Utilisateur" ADD COLUMN IF NOT EXISTS "isShadowAccount" BOOLEAN DEFAULT false;
        ALTER TABLE "Logement" ADD COLUMN IF NOT EXISTS "gestionnaireId" TEXT;
        ALTER TABLE "Logement" ADD COLUMN IF NOT EXISTS "gestionDeleguee" BOOLEAN DEFAULT false;
      `);
      console.log('✅ Columns added successfully via DDL!');
      await client.end();
      return;
    } catch (e) {
      console.log(`Failed on ${host}:`, e.message);
    }
  }
}

test();
