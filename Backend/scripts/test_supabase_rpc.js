const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://lnrxtozuarfqlcfkwroa.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxucnh0b3p1YXJmcWxjZmt3cm9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzc5MzYyNywiZXhwIjoyMDkzMzY5NjI3fQ.eeXWpU41P-txRd2Vnkav2-DeCHTc3v_uD59tQq7vgzU';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data, error } = await supabase.from('Utilisateur').select('*').limit(1);
  console.log('Utilisateur sample:', data, error);
}

test();
