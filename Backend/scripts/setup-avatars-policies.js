/**
 * Configure les policies RLS pour le bucket "avatars" dans Supabase Storage.
 * - Lecture publique (tout le monde peut voir les avatars)
 * - Upload/Update/Delete limité à l'utilisateur propriétaire du dossier
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://lnrxtozuarfqlcfkwroa.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxucnh0b3p1YXJmcWxjZmt3cm9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzc5MzYyNywiZXhwIjoyMDkzMzY5NjI3fQ.eeXWpU41P-txRd2Vnkav2-DeCHTc3v_uD59tQq7vgzU';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log('🔧 Configuration des policies Storage pour le bucket "avatars"...\n');

  // Les policies Storage sont gérées via SQL dans Supabase
  // On utilise le service_role pour exécuter du SQL directement
  
  const policies = [
    {
      name: 'Avatars are publicly accessible',
      sql: `
        CREATE POLICY "Avatars are publicly accessible"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'avatars');
      `,
    },
    {
      name: 'Users can upload their own avatar',
      sql: `
        CREATE POLICY "Users can upload their own avatar"
        ON storage.objects FOR INSERT
        WITH CHECK (
          bucket_id = 'avatars'
          AND auth.uid()::text = (storage.foldername(name))[1]
        );
      `,
    },
    {
      name: 'Users can update their own avatar',
      sql: `
        CREATE POLICY "Users can update their own avatar"
        ON storage.objects FOR UPDATE
        USING (
          bucket_id = 'avatars'
          AND auth.uid()::text = (storage.foldername(name))[1]
        );
      `,
    },
    {
      name: 'Users can delete their own avatar',
      sql: `
        CREATE POLICY "Users can delete their own avatar"
        ON storage.objects FOR DELETE
        USING (
          bucket_id = 'avatars'
          AND auth.uid()::text = (storage.foldername(name))[1]
        );
      `,
    },
  ];

  for (const policy of policies) {
    console.log(`📋 Creating policy: "${policy.name}"...`);
    const { error } = await supabase.rpc('exec_sql', { sql: policy.sql }).maybeSingle();
    
    if (error) {
      if (error.message?.includes('already exists')) {
        console.log(`   ✅ Already exists\n`);
      } else {
        // Try direct SQL approach via REST
        console.log(`   ⚠️  RPC not available, trying REST SQL...`);
        
        const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({ sql: policy.sql }),
        });
        
        if (res.ok) {
          console.log(`   ✅ Created\n`);
        } else {
          console.log(`   ℹ️  May need to configure via Supabase Dashboard\n`);
        }
      }
    } else {
      console.log(`   ✅ Created\n`);
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('⚡ Si les policies échouent ci-dessus, configurez-les');
  console.log('   manuellement dans Supabase Dashboard:');
  console.log('   → Storage → avatars → Policies');
  console.log('   → "Other policies under storage.objects"');
  console.log('');
  console.log('   SELECT: bucket_id = \'avatars\' (pour tout le monde)');
  console.log('   INSERT: bucket_id = \'avatars\' AND auth.uid()::text = (storage.foldername(name))[1]');
  console.log('   UPDATE: même chose que INSERT');
  console.log('   DELETE: même chose que INSERT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main().catch(console.error);
