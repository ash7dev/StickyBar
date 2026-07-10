import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Routes protégées nécessitant une authentification
const PROTECTED_ROUTES = ['/dashboard', '/reservations', '/parametres', '/reserver'];

// Routes d'authentification (rediriger si déjà connecté)
const AUTH_ROUTES = ['/login', '/register', '/verify', '/complete-profile'];

// Routes publiques (toujours accessibles)
const PUBLIC_ROUTES = ['/', '/logements', '/contact', '/cgu', '/legal', '/privacy', '/comment-ca-marche', '/become-host'];

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname, searchParams } = request.nextUrl;

  // ── Protection des routes authentifiées ────────────────────────────────────
  // Protéger toutes les routes nécessitant une authentification
  if (PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
    if (!user) {
      const redirectUrl = new URL('/login', request.url);
      // Ajouter le paramètre 'next' pour rediriger après login
      redirectUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // ── Redirection des utilisateurs connectés hors des pages auth ─────────────
  // Si l'utilisateur est déjà connecté, le rediriger hors des pages d'authentification
  if (AUTH_ROUTES.some(route => pathname.startsWith(route))) {
    if (user) {
      // Si un paramètre 'next' existe, rediriger vers cette URL
      const next = searchParams.get('next');
      if (next && next.startsWith('/') && !next.startsWith('//')) {
        // Vérifier que 'next' n'est pas une page auth
        if (!AUTH_ROUTES.some(route => next.startsWith(route))) {
          return NextResponse.redirect(new URL(next, request.url));
        }
      }
      // Sinon rediriger vers l'accueil
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
