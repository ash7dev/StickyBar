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
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      // Si `next` est fourni et sûr, on y va directement
      if (next) return NextResponse.redirect(`${origin}${next}`);

      // Sinon on demande le rôle à NestJS pour rediriger correctement
      try {
        const res = await fetch(buildApiUrl('/auth/me/supabase'), {
          headers: { Authorization: `Bearer ${data.session.access_token}` },
          cache: 'no-store',
        });
        if (res.ok) {
          const payload = await res.json() as {
            onboardingRequired?: boolean;
            user?: { activeRole?: string; hasAnnonce?: boolean };
          };
          const role = payload.user?.activeRole;
          const hasAnnonce = payload.user?.hasAnnonce;
          if (role === 'PROPRIETAIRE') {
            return NextResponse.redirect(`${origin}${hasAnnonce ? '/dashboard' : '/become-host'}`);
          }
        } else {
          console.error('[Auth Callback] Failed to fetch user role:', res.status);
        }
      } catch (error) {
        console.error('[Auth Callback] Error fetching user role:', error);
      }

      // LOCATAIRE ou rôle inconnu → accueil
      return NextResponse.redirect(`${origin}/`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
