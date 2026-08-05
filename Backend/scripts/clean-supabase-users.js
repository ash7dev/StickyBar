/**
 * Nettoyage agressif de user_metadata Supabase
 * Supprime toute donnée volumineuse (base64, avatars, images) de tous les utilisateurs
 * pour empêcher la génération de tokens JWT surdimensionnés (110+ cookie chunks).
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://lnrxtozuarfqlcfkwroa.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxucnh0b3p1YXJmcWxjZmt3cm9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzc5MzYyNywiZXhwIjoyMDkzMzY5NjI3fQ.eeXWpU41P-txRd2Vnkav2-DeCHTc3v_uD59tQq7vgzU';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Keys to strip from user_metadata (anything that could be large)
const KEYS_TO_STRIP = [
  'avatar_url', 'avatar', 'picture', 'photo', 'image', 'profileImage',
  'full_name', 'name', 'user_name',
  // Google/OAuth provider data can be large
  'iss', 'sub', 'provider_id', 'custom_claims',
];

async function main() {
  console.log('🔍 Fetching all Supabase users...');

  const { data: { users }, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) { console.error('❌ Error listing users:', error.message); process.exit(1); }

  console.log(`📋 Found ${users.length} users\n`);

  for (const user of users) {
    const meta = user.user_metadata || {};
    const metaStr = JSON.stringify(meta);
    const metaSize = Buffer.byteLength(metaStr, 'utf8');

    console.log(`👤 ${user.email || user.id}`);
    console.log(`   Current metadata size: ${metaSize} bytes`);

    // Check if metadata contains large data
    let hasLargeData = metaSize > 500; // Anything over 500 bytes is suspicious

    if (!hasLargeData) {
      // Also check for base64 data URLs
      hasLargeData = metaStr.includes('data:image') || metaStr.includes('base64');
    }

    if (!hasLargeData) {
      console.log(`   ✅ Clean (${metaSize} bytes)\n`);
      continue;
    }

    // Build cleaned metadata: only keep email and email_verified
    const cleaned = {};
    if (meta.email) cleaned.email = meta.email;
    if (meta.email_verified !== undefined) cleaned.email_verified = meta.email_verified;

    const cleanedSize = Buffer.byteLength(JSON.stringify(cleaned), 'utf8');
    console.log(`   🧹 Cleaning: ${metaSize} → ${cleanedSize} bytes`);

    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: cleaned,
    });

    if (updateError) {
      console.log(`   ❌ Failed: ${updateError.message}\n`);
    } else {
      console.log(`   ✅ Cleaned successfully\n`);
    }
  }

  console.log('🎉 Done! All users cleaned.');
}

main().catch(console.error);
