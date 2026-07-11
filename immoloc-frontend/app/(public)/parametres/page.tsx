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
import { User, Loader2 } from 'lucide-react';

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function TenantParametresPage() {
  const store = useRoleStore();
  const queryClient = useQueryClient();
  const gate = useActionGate();

  const [supabaseEmail, setSupabaseEmail] = useState<string | null>(null);
  const [supabaseId, setSupabaseId] = useState<string | null>(null);
  const [gateOpen, setGateOpen] = useState(false);

  // 1. Récupération rapide de Supabase en parallèle
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setSupabaseEmail(data.user.email ?? null);
        setSupabaseId(data.user.id);
      }
    });
  }, []);

  // 2. API — optimisée avec React Query
  const { data: apiUser, isLoading: apiLoading } = useQuery<Partial<UserProfile>>({
    queryKey: ['users', 'me'],
    queryFn: () => nestFetch<Partial<UserProfile>>(NEST_API.USERS.ME),
    enabled: store.hasHydrated && !!store.nestToken,
    retry: false,
    staleTime: 60_000,
  });

  // 3. Affichage immédiat avec données du store (pas d'attente)
  const user: UserProfile | null = store.hasHydrated ? {
    id:               apiUser?.id               ?? store.userId          ?? supabaseId ?? '',
    prenom:           apiUser?.prenom           ?? '',
    nom:              apiUser?.nom              ?? '',
    email:            apiUser?.email            ?? supabaseEmail         ?? null,
    telephone:        apiUser?.telephone        ?? null,
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

  // ── Attente initiale uniquement de l'hydratation (très rapide) ──
  if (!store.hasHydrated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 pb-24 flex flex-col items-center text-center justify-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-sm text-foreground-muted">Chargement...</p>
      </div>
    );
  }

  // ── Non connecté ──
  if (!store.nestToken && !supabaseEmail) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 pb-24 flex flex-col items-center text-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-background-alt flex items-center justify-center">
          <User className="w-6 h-6 text-foreground-muted" />
        </div>
        <div>
          <p className="text-base font-bold text-foreground">Vous n&apos;êtes pas connecté</p>
          <p className="text-sm text-foreground-muted mt-1">Connectez-vous pour accéder à vos paramètres.</p>
        </div>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors"
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
        <h1 className="text-xl font-black text-foreground">Paramètres</h1>
        <p className="text-sm text-foreground-muted mt-0.5">Gérez votre compte et vos préférences</p>
      </div>

      {/* ── Profil (affichage immédiat avec données du store + API) ──────── */}
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

      {/* Indicateur de synchronisation en arrière-plan */}
      {apiLoading && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-background-card border border-border rounded-full px-4 py-2 shadow-lg flex items-center gap-2 z-50">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
          <span className="text-xs font-medium text-foreground-muted">Mise à jour...</span>
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
