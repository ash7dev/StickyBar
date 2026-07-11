'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { User, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRoleStore } from '@/stores/role.store';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import { useActionGate } from '@/hooks/use-action-gate';
import { ActionGateModal } from '@/features/gate/components/ActionGateModal';
import type { UserProfile } from '@/features/profile/types';
import { ProfileHero }        from '@/features/profile/components/ProfileHero';
import { ProfileInfoCard }    from '@/features/profile/components/ProfileInfoCard';
import { ProfileKycCard }     from '@/features/profile/components/ProfileKycCard';
import { ProfileActionsCard } from '@/features/profile/components/ProfileActionsCard';

/* ── Skeleton ─────────────────────────────────────────────────────────────── */

function ProfileSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-36 lg:h-32 rounded-2xl bg-neutral-100" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-64 rounded-2xl bg-neutral-100" />
        ))}
      </div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default function ProfilPage() {
  const router      = useRouter();
  const store       = useRoleStore();
  const queryClient = useQueryClient();
  const gate        = useActionGate();

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

  // 2. API — se déclenche dès que le store est hydraté (nestFetch lit le token du store)
  const { data: apiUser } = useQuery<Partial<UserProfile>>({
    queryKey: ['users', 'me'],
    queryFn:  () => nestFetch<Partial<UserProfile>>(NEST_API.USERS.ME),
    enabled:  store.hasHydrated,
    retry:    false,
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

  // 4. Quand les gates sont complétées, rafraîchir le profil
  function handleGateComplete() {
    setGateOpen(false);
    queryClient.invalidateQueries({ queryKey: ['users', 'me'] });
  }

  return (
    <div className="space-y-5">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        {/* Bouton retour mobile */}
        <button
          onClick={() => router.push('/dashboard/parametres')}
          className="sm:hidden w-9 h-9 rounded-xl bg-background-card flex items-center justify-center border border-border shadow-sm shrink-0 hover:bg-background-alt transition-colors"
          aria-label="Retour aux paramètres"
        >
          <ArrowLeft className="w-4 h-4 text-foreground-muted" />
        </button>

        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100 shadow-sm shrink-0">
          <User className="w-[18px] h-[18px] text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-neutral-900">Mon profil</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Gérez vos informations personnelles et votre compte.
          </p>
        </div>
      </div>

      {/* ── Loading ─────────────────────────────────────────── */}
      {!supabaseReady && <ProfileSkeleton />}

      {/* ── Content ─────────────────────────────────────────── */}
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

      {/* ── Gate Modal ──────────────────────────────────────── */}
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
