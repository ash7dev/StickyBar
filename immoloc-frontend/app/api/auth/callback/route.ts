/* eslint-disable prefer-const */
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { buildApiUrl } from '@/lib/config/api';

const AUTH_PAGES = ['/login', '/register', '/complete-profile', '/verify'];

// Cache simple pour éviter le double traitement du même code OAuth
const processedCodes = new Map<string, number>();
const CODE_TTL = 10000; // 10 secondes

function isCodeProcessed(code: string): boolean {
  const timestamp = processedCodes.get(code);
  if (!timestamp) return false;
  if (Date.now() - timestamp > CODE_TTL) {
    processedCodes.delete(code);
    return false;
  }
  return true;
}

function markCodeAsProcessed(code: string): void {
  processedCodes.set(code, Date.now());
  if (processedCodes.size > 100) {
    const now = Date.now();
    for (const [key, timestamp] of processedCodes.entries()) {
      if (now - timestamp > CODE_TTL) processedCodes.delete(key);
    }
  }
}

function safeNextUrl(next: string | null): string | null {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return null;
  if (AUTH_PAGES.includes(next.split('?')[0])) return null;
  return next;
}

/**
 * Supabase SSR chunks large JWTs into many cookies (sb-*-auth-token.0, .1, .2, …).
 * On a 307 redirect, Chrome limits total response headers to ~256KB.
 * With 100+ Set-Cookie headers, we blow past that limit → ERR_RESPONSE_HEADERS_TOO_BIG.
 *
 * Strategy: Only keep the ESSENTIAL cookies that Supabase SSR needs to reconstruct the session.
 * We keep at most 5 chunk cookies (chunks 0-4 ≈ 20KB total) which is plenty for a normal JWT.
 * If Supabase emits more than that, the user_metadata is still bloated and needs cleanup.
 */
const MAX_COOKIE_CHUNKS = 5;

function filterEssentialCookies(
  cookies: Array<{ name: string; value: string; options?: CookieOptions }>,
): Array<{ name: string; value: string; options?: CookieOptions }> {
  const essential: typeof cookies = [];
  const chunkCounts = new Map<string, number>();

  for (const cookie of cookies) {
    // Identify chunked Supabase auth cookies: sb-XXXX-auth-token.0, .1, .2, etc.
    const chunkMatch = cookie.name.match(/^(sb-.+-auth-token)\.(\d+)$/);
    if (chunkMatch) {
      const baseName = chunkMatch[1];
      const chunkIndex = parseInt(chunkMatch[2], 10);
      const count = chunkCounts.get(baseName) ?? 0;
      if (chunkIndex < MAX_COOKIE_CHUNKS) {
        chunkCounts.set(baseName, count + 1);
        essential.push(cookie);
      }
      // Skip chunks beyond MAX_COOKIE_CHUNKS
      continue;
    }

    // Keep code-verifier cookies (small, needed for PKCE flow)
    if (cookie.name.includes('code-verifier')) {
      essential.push(cookie);
      continue;
    }

    // Keep the base auth-token cookie (non-chunked)
    if (cookie.name.match(/^sb-.+-auth-token$/)) {
      essential.push(cookie);
      continue;
    }

    // Drop all other Supabase cookies to keep response headers small
    if (cookie.name.startsWith('sb-')) {
      continue;
    }

    // Keep non-Supabase cookies
    essential.push(cookie);
  }

  return essential;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeNextUrl(searchParams.get('next'));
  let defaultRedirectPath = next || '/';

  if (code) {
    // Protection contre double callback
    if (isCodeProcessed(code)) {
      return NextResponse.redirect(`${origin}${defaultRedirectPath}`);
    }
    markCodeAsProcessed(code);

    try {
      let cookieStore = request.cookies.getAll();
      const cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }> = [];

      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore;
            },
            setAll(newCookies) {
              cookiesToSet.push(...newCookies);
              cookieStore = newCookies.map(c => ({ name: c.name, value: c.value }));
            },
          },
        },
      );

      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        if (error.message.includes('invalid flow state') || error.message.includes('already been consumed')) {
          console.log('[Auth Callback] Supabase code already consumed; redirecting cleanly');
          return NextResponse.redirect(`${origin}${defaultRedirectPath}`);
        }
        console.error('[Auth Callback] Supabase code exchange error:', error.message);
        return NextResponse.redirect(`${origin}/login?error=auth_failed`);
      }

      let session = data?.session;

      if (session) {
        let redirectPath = defaultRedirectPath;

        // Appeler le backend pour obtenir le rôle / onboarding status
        try {
          const apiUrl = buildApiUrl('/auth/me/supabase');
          console.log('[Auth Callback] Calling backend:', apiUrl);

          const res = await fetch(apiUrl, {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              Accept: 'application/json',
            },
            credentials: 'omit',
            cache: 'no-store',
          });

          console.log('[Auth Callback] Backend response status:', res.status);

          if (res.ok) {
            const payload = (await res.json()) as {
              onboardingRequired?: boolean;
              user?: {
                activeRole?: string;
                hasAnnonce?: boolean;
                profileCompleted?: boolean;
              };
            };

            const needsOnboarding =
              payload.onboardingRequired || payload.user?.profileCompleted === false;

            if (needsOnboarding) {
              const nextParam = next ? `?next=${encodeURIComponent(next)}` : '';
              redirectPath = `/complete-profile${nextParam}`;
            } else if (!next) {
              const role = payload.user?.activeRole;
              const hasAnnonce = payload.user?.hasAnnonce;
              if (role === 'ADMIN') {
                redirectPath = '/admin/dashboard';
              } else if (role === 'PROPRIETAIRE') {
                redirectPath = hasAnnonce ? '/dashboard' : '/become-host';
              }
            }
          }
        } catch (error) {
          console.warn('[Auth Callback] Error fetching user role:', error);
        }

        const finalResponse = NextResponse.redirect(`${origin}${redirectPath}`);

        // CRITICAL: Filter cookies to prevent ERR_RESPONSE_HEADERS_TOO_BIG
        const filtered = filterEssentialCookies(cookiesToSet);
        console.log(`[Auth Callback] Setting ${filtered.length}/${cookiesToSet.length} cookies for redirect to ${redirectPath}`);

        for (const c of filtered) {
          finalResponse.cookies.set(c.name, c.value, c.options || {});
        }

        return finalResponse;
      }
    } catch (err) {
      console.error('[Auth Callback] Error handling callback:', err);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
