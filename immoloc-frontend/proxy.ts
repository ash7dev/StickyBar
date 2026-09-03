import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Routes protégées nécessitant une redirection serveur automatique vers /login
const PROTECTED_ROUTES = ['/dashboard', '/admin', '/gestionnaire'];

// Routes d'authentification (rediriger si déjà connecté)
const AUTH_ROUTES = ['/login', '/register', '/verify', '/complete-profile', '/auth/login', '/auth/register'];
const AUTH_CALLBACK_ROUTE = '/api/auth/callback';
const MAX_COOKIE_HEADER_SIZE = 12 * 1024;
const MAX_ALLOWED_CHUNKS = 5; // Keep chunks 0-4, delete 5+

function isSupabaseCookie(name: string) {
  return name.startsWith('sb-') || name.includes('supabase');
}

/**
 * Identify excessive Supabase auth token chunks (index >= MAX_ALLOWED_CHUNKS)
 * These accumulate from bloated user_metadata and cause ERR_RESPONSE_HEADERS_TOO_BIG
 */
function getExcessiveChunkCookies(allCookies: Array<{ name: string; value: string }>) {
  return allCookies.filter(c => {
    const match = c.name.match(/^sb-.+-auth-token\.(\d+)$/);
    return match && parseInt(match[1], 10) >= MAX_ALLOWED_CHUNKS;
  });
}

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // ── Nettoyage proactif des chunks cookies Supabase excessifs ──────────────
  const allCookies = request.cookies.getAll();
  const oversized = allCookies.filter(c => c.value && c.value.length > 4096);
  const excessiveChunks = getExcessiveChunkCookies(allCookies);
  const cookieHeaderSize = request.headers.get('cookie')?.length ?? 0;
  const authCookies = allCookies.filter(c => isSupabaseCookie(c.name));
  const shouldCleanAuthCookies =
    pathname === AUTH_CALLBACK_ROUTE && cookieHeaderSize > MAX_COOKIE_HEADER_SIZE;

  // Collecter tous les cookies à supprimer
  const cookiesToDelete = [
    ...oversized,
    ...excessiveChunks,
    ...(shouldCleanAuthCookies ? authCookies : []),
  ].filter((cookie, index, arr) =>
    arr.findIndex(item => item.name === cookie.name) === index,
  );

  // Pour le callback auth, nettoyer et continuer sans redirect
  if (pathname === AUTH_CALLBACK_ROUTE) {
    if (cookiesToDelete.length > 0) {
      const cleanResponse = NextResponse.next({ request });
      cookiesToDelete.forEach(c => cleanResponse.cookies.delete(c.name));
      return cleanResponse;
    }
    return NextResponse.next({ request });
  }

  // Pour les autres routes, redirect avec nettoyage si nécessaire
  if (cookiesToDelete.length > 0) {
    const cleanResponse = NextResponse.redirect(request.nextUrl);
    cookiesToDelete.forEach(c => cleanResponse.cookies.delete(c.name));
    return cleanResponse;
  }

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
  const hasNestToken = request.cookies.has('nest_token');
  const isAuthenticated = !!user || hasNestToken;

  // ── Protection des routes authentifiées sur l'Edge ───────────────────────
  if (PROTECTED_ROUTES.some((route) => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // ── Redirection des utilisateurs déjà connectés hors des pages auth ───────
  if (AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    if (isAuthenticated) {
      const next = searchParams.get('next');
      if (next && next.startsWith('/') && !next.startsWith('//') && !AUTH_ROUTES.some((r) => next.startsWith(r))) {
        return NextResponse.redirect(new URL(next, request.url));
      }
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/api/auth/callback',
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
