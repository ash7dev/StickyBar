const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupStorageRLS() {
  console.log('🔧 Appplication des règles RLS PostgreSQL pour Supabase Storage (bucket "avatars")...\n');

  try {
    // 1. S'assurer que le bucket avatars existe et qu'il est public
    await prisma.$executeRawUnsafe(`
      INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      VALUES ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg'])
      ON CONFLICT (id) DO UPDATE SET public = true;
    `);
    console.log('✅ Bucket "avatars" configuré (public: true)');

    // 2. Supprimer les anciennes règles si existantes
    const dropPoliciesSQL = [
      `DROP POLICY IF EXISTS "Public Read Avatars" ON storage.objects;`,
      `DROP POLICY IF EXISTS "Authenticated Upload Avatars" ON storage.objects;`,
      `DROP POLICY IF EXISTS "Authenticated Update Avatars" ON storage.objects;`,
      `DROP POLICY IF EXISTS "Authenticated Delete Avatars" ON storage.objects;`,
      `DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;`,
      `DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;`,
      `DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;`,
      `DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;`,
    ];

    for (const sql of dropPoliciesSQL) {
      await prisma.$executeRawUnsafe(sql);
    }
    console.log('✅ Anciennes politiques nettoyées');

    // 3. Créer la politique de lecture publique (SELECT)
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Public Read Avatars"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'avatars');
    `);
    console.log('✅ Politique SELECT (Lecture publique) créée');

    // 4. Créer la politique d'insertion pour utilisateurs authentifiés (INSERT)
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Authenticated Upload Avatars"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'avatars');
    `);
    console.log('✅ Politique INSERT (Upload authentifié) créée');

    // 5. Créer la politique de mise à jour (UPDATE)
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Authenticated Update Avatars"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (bucket_id = 'avatars');
    `);
    console.log('✅ Politique UPDATE (Mise à jour authentifiée) créée');

    // 6. Créer la politique de suppression (DELETE)
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Authenticated Delete Avatars"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (bucket_id = 'avatars');
    `);
    console.log('✅ Politique DELETE (Suppression authentifiée) créée');

    console.log('\n🎉 Configuration RLS Supabase Storage terminée avec succès !');
  } catch (err) {
    console.error('❌ Erreur lors de la configuration RLS:', err);
  } finally {
    await prisma.$disconnect();
  }
}

setupStorageRLS();
