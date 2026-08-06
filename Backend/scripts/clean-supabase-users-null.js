const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://lnrxtozuarfqlcfkwroa.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxucnh0b3p1YXJmcWxjZmt3cm9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzc5MzYyNywiZXhwIjoyMDkzMzY5NjI3fQ.eeXWpU41P-txRd2Vnkav2-DeCHTc3v_uD59tQq7vgzU';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function cleanAllUsers() {
  const { data: { users }, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) {
    console.error('Error listing users:', error);
    return;
  }

  for (const user of users) {
    const meta = user.user_metadata || {};
    const newMeta = {};
    for (const key of Object.keys(meta)) {
      if (key === 'email' || key === 'email_verified') {
        newMeta[key] = meta[key];
      } else {
        newMeta[key] = null; // Explicitly set to null to delete keys in Supabase Auth!
      }
    }

    console.log(`Cleaning user ${user.email} (${user.id})...`);
    const { error: updateErr } = await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        email: user.email,
        email_verified: true,
        photoUrl: null,
        avatar_url: null,
        picture: null,
        photo: null,
        image: null,
        full_name: null,
        name: null,
        user_name: null,
        iss: null,
        sub: null,
        provider_id: null,
        custom_claims: null
      }
    });

    if (updateErr) {
      console.error(`  ❌ Failed for ${user.email}:`, updateErr.message);
    } else {
      console.log(`  ✅ Cleaned ${user.email}`);
    }
  }

  // Re-verify target user
  const { data: { user: updatedUser } } = await supabase.auth.admin.getUserById('07ffc5ee-c00d-4bfb-8678-29d6ca2d4a70');
  console.log('\nVERIFICATION after cleanup:');
  console.log('User metadata keys:', Object.keys(updatedUser.user_metadata || {}));
  console.log('User metadata JSON string length:', JSON.stringify(updatedUser.user_metadata).length);
}

cleanAllUsers();
