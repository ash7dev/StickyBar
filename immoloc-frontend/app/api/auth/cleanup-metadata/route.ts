import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Nettoie les metadata Supabase pour supprimer les images base64 volumineuses
 * qui causent des JWT trop gros et donc ERR_RESPONSE_HEADERS_TOO_BIG
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      },
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Nettoyer les metadata en supprimant les gros champs
    const cleanedMetadata = {
      email: user.user_metadata.email,
      email_verified: user.user_metadata.email_verified,
      full_name: user.user_metadata.full_name,
      name: user.user_metadata.name,
      phone_verified: user.user_metadata.phone_verified,
      // Supprimer photoUrl et avatar_url qui contiennent des base64
      // La photo est maintenant stockée dans PostgreSQL via l'API NestJS
    };

    await supabase.auth.updateUser({
      data: cleanedMetadata,
    });

    return NextResponse.json({
      success: true,
      message: 'Metadata cleaned successfully',
    });
  } catch (error) {
    console.error('[Cleanup Metadata] Error:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup metadata' },
      { status: 500 }
    );
  }
}
