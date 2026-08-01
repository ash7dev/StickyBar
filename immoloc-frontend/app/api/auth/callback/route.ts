import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { buildApiUrl } from '@/lib/config/api';

const AUTH_PAGES = ['/login', '/register', '/complete-profile', '/verify'];

function safeNextUrl(next: string | null): string | null {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return null;
  if (AUTH_PAGES.includes(next.split('?')[0])) return null;
  return next;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeNextUrl(searchParams.get('next'));

  if (code) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error && data?.session) {
        let redirectPath = next || '/';

        try {
          const apiUrl = buildApiUrl('/auth/me/supabase');
          console.log('[Auth Callback] Calling backend:', apiUrl);

          const res = await fetch(apiUrl, {
            headers: {
              Authorization: `Bearer ${data.session.access_token}`,
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

            // onboardingRequired ou !profileCompleted = profil incomplet
            const needsOnboarding =
              payload.onboardingRequired || payload.user?.profileCompleted === false;

            if (needsOnboarding) {
              const nextParam = next ? `?next=${encodeURIComponent(next)}` : '';
              return NextResponse.redirect(`${origin}/complete-profile${nextParam}`);
            }

            if (!next) {
              const role = payload.user?.activeRole;
              const hasAnnonce = payload.user?.hasAnnonce;
              if (role === 'PROPRIETAIRE') {
                redirectPath = hasAnnonce ? '/dashboard' : '/become-host';
              }
            }
          } else {
            const errorBody = await res.text().catch(() => 'Unable to read error body');
            console.warn(
              '[Auth Callback] Failed to fetch user role (will fallback to client-side sync):',
              res.status,
              errorBody,
            );
          }
        } catch (error) {
          console.warn(
            '[Auth Callback] Error fetching user role (will fallback to client-side sync):',
            error,
          );
        }

        return NextResponse.redirect(`${origin}${redirectPath}`);
      } else if (error) {
        console.error('[Auth Callback] Supabase code exchange error:', error.message);
      }
    } catch (err) {
      console.error('[Auth Callback] Error handling callback:', err);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
