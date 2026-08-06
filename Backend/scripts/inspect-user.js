const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://lnrxtozuarfqlcfkwroa.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxucnh0b3p1YXJmcWxjZmt3cm9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzc5MzYyNywiZXhwIjoyMDkzMzY5NjI3fQ.eeXWpU41P-txRd2Vnkav2-DeCHTc3v_uD59tQq7vgzU';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function checkUser() {
  const { data: { user }, error } = await supabase.auth.admin.getUserById('07ffc5ee-c00d-4bfb-8678-29d6ca2d4a70');
  if (error) {
    console.error('Error fetching user:', error);
    return;
  }
  console.log('User metadata keys:', Object.keys(user.user_metadata || {}));
  console.log('User metadata JSON string length:', JSON.stringify(user.user_metadata).length);
  if (user.user_metadata.photoUrl) {
    console.log('photoUrl present! Length:', user.user_metadata.photoUrl.length);
  }
}

checkUser();
