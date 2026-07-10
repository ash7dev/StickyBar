'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import type { UserProfile } from '@/features/profile/types';
import { useRoleStore } from '@/stores/role.store';
import { useActionGate } from '@/hooks/use-action-gate';
import { ActionGateModal } from '@/features/gate/components/ActionGateModal';
import { ProfileHero }        from '@/features/profile/components/ProfileHero';
import { ProfileInfoCard }    from '@/features/profile/components/ProfileInfoCard';
import { ProfileKycCard }     from '@/features/profile/components/ProfileKycCard';
import { ProfileActionsCard } from '@/features/profile/components/ProfileActionsCard';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { User } from 'lucide-react';

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function TenantParametresPage() {
  const store = useRoleStore();
  const queryClient = useQueryClient();
  const gate = useActionGate();

  const [supabaseUser, setSupabaseUser] = useState<{
    id: string;
    email?: string;
    user_metadata?: Record<string, string>;
  } | null>(null);
  const [supabaseReady, setSupabaseReady] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);

  // 1. Session Supabase (toujours disponible)
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setSupabaseUser(data.user ?? null);
      setSupabaseReady(true);
    });
  }, []);

  // 2. API — se déclenche dès que le store est hydraté
  const { data: apiUser } = useQuery<Partial<UserProfile>>({
    queryKey: ['users', 'me'],
    queryFn: () => nestFetch<Partial<UserProfile>>(NEST_API.USERS.ME),
    enabled: store.hasHydrated,
    retry: false,
    staleTime: 60_000,
  });

  // 3. Fusion des sources — API > Supabase metadata > RoleStore
  const meta = supabaseUser?.user_metadata ?? {};

  const user: UserProfile | null = supabaseReady && supabaseUser ? {
    id:               apiUser?.id               ?? store.userId          ?? supabaseUser.id,
    prenom:           apiUser?.prenom           ?? meta.prenom           ?? '',
    nom:              apiUser?.nom              ?? meta.nom              ?? '',
    email:            apiUser?.email            ?? supabaseUser.email    ?? null,
    telephone:        apiUser?.telephone        ?? meta.telephone        ?? null,
    dateNaissance:    apiUser?.dateNaissance    ?? store.dateNaissance   ?? null,
    activeRole:       apiUser?.activeRole       ?? store.activeRole,
    estProprietaire:  apiUser?.estProprietaire  ?? store.estProprietaire,
    profileCompleted: apiUser?.profileCompleted ?? store.profileCompleted,
    phoneVerified:    apiUser?.phoneVerified    ?? store.phoneVerified,
    statutKyc:        apiUser?.statutKyc        ?? store.statutKyc,
  } : null;

  function handleGateComplete() {
    setGateOpen(false);
    queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
  }

  /* ── Non connecté ── */
  if (!store.nestToken) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 pb-24 flex flex-col items-center text-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center">
          <User className="w-6 h-6 text-neutral-400" />
        </div>
        <div>
          <p className="text-base font-bold text-neutral-900">Vous n&apos;êtes pas connecté</p>
          <p className="text-sm text-neutral-400 mt-1">Connectez-vous pour accéder à vos paramètres.</p>
        </div>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold rounded-xl transition-colors"
        >
          Se connecter
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-5">

      {/* ── En-tête ────────────────────────────────────────────────────────── */}
      <div className="pt-2 pb-1">
        <h1 className="text-xl font-black text-neutral-900">Paramètres</h1>
        <p className="text-sm text-neutral-400 mt-0.5">Gérez votre compte et vos préférences</p>
      </div>

      {/* ── Profil complet (comme dans /dashboard/profil) ──────────────────── */}
      {user && (
        <div className="space-y-5">
          <ProfileHero
            user={user}
            onKycClick={() => setGateOpen(true)}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ProfileInfoCard
              user={user}
              onUpdated={() => queryClient.invalidateQueries({ queryKey: ['users', 'me'] })}
            />
            <ProfileKycCard
              user={user}
              onKycClick={() => setGateOpen(true)}
            />
            <ProfileActionsCard user={user} />
          </div>
        </div>
      )}

      {/* ── Gate Modal ──────────────────────────────────────────────────────── */}
      {gateOpen && (
        <ActionGateModal
          steps={gate.steps}
          block={gate.block}
          onComplete={handleGateComplete}
          onCancel={() => setGateOpen(false)}
        />
      )}

    </div>
  );
}
