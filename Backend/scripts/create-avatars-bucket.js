/**
 * Crée le bucket "avatars" dans Supabase Storage s'il n'existe pas déjà.
 * Le bucket est public pour permettre l'affichage direct des avatars.
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://lnrxtozuarfqlcfkwroa.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxucnh0b3p1YXJmcWxjZmt3cm9hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzc5MzYyNywiZXhwIjoyMDkzMzY5NjI3fQ.eeXWpU41P-txRd2Vnkav2-DeCHTc3v_uD59tQq7vgzU';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log('🔍 Vérification du bucket "avatars"...');

  // Lister les buckets existants
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    console.error('❌ Erreur lors du listing des buckets:', listError.message);
    process.exit(1);
  }

  const existingBucket = buckets?.find(b => b.name === 'avatars');
  if (existingBucket) {
    console.log('✅ Bucket "avatars" existe déjà (public:', existingBucket.public, ')');
    
    // S'assurer qu'il est public
    if (!existingBucket.public) {
      const { error: updateError } = await supabase.storage.updateBucket('avatars', {
        public: true,
        fileSizeLimit: 1024 * 1024, // 1MB max
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      });
      if (updateError) {
        console.error('❌ Erreur mise à jour bucket:', updateError.message);
      } else {
        console.log('🔄 Bucket mis à jour en public');
      }
    }
    return;
  }

  // Créer le bucket
  const { error: createError } = await supabase.storage.createBucket('avatars', {
    public: true,
    fileSizeLimit: 1024 * 1024, // 1MB max
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  });

  if (createError) {
    console.error('❌ Erreur création bucket:', createError.message);
    process.exit(1);
  }

  console.log('✅ Bucket "avatars" créé avec succès (public, 1MB max, JPEG/PNG/WebP)');
}

main().catch(console.error);
