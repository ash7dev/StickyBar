import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CompleteProfileForm } from '@/features/auth/components/complete-profile-form';

export const metadata = { title: 'Compléter mon profil — ImmoLoc' };

interface Props {
  searchParams: Promise<{ next?: string }>;
}

export default async function CompleteProfilePage({ searchParams }: Props) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) redirect('/login');

  const { next } = await searchParams;

  return (
    <CompleteProfileForm
      accessToken={session.access_token}
      userEmail={session.user.email}
      next={next}
    />
  );
}
