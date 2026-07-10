import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardShell } from '@/components/dashboard/shell';
import { buildApiUrl } from '@/lib/config/api';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Vérifie que l'utilisateur est bien PROPRIETAIRE côté NestJS
  try {
    const res = await fetch(buildApiUrl('/auth/me/supabase'), {
      headers: { Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token ?? ''}` },
      cache: 'no-store',
    });

    if (!res.ok) {
      // Si le backend retourne une erreur, on redirige vers l'accueil
      console.error('[Dashboard Layout] Failed to verify role:', res.status);
      redirect('/');
    }

    const payload = await res.json() as { user?: { activeRole?: string } };
    if (payload.user?.activeRole !== 'PROPRIETAIRE') {
      redirect('/');
    }
  } catch (error) {
    // En cas d'erreur réseau critique, on redirige par sécurité
    console.error('[Dashboard Layout] Error verifying user role:', error);
    redirect('/login?error=backend_unavailable');
  }

  return <DashboardShell>{children}</DashboardShell>;
}
