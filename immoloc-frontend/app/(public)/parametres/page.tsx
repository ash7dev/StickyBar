'use client';

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Settings } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRoleStore } from '@/stores/role.store';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import { useActionGate } from '@/hooks/use-action-gate';
import { ActionGateModal } from '@/features/gate/components/ActionGateModal';
import type { UserProfile } from '@/features/profile/types';

import { TenantReservationsGuard } from '@/features/reservations/components/tenant/TenantReservationsGuard';
import { ProfileHero }        from '@/features/profile/components/ProfileHero';
import { ProfileInfoCard }    from '@/features/profile/components/ProfileInfoCard';
import { ProfileSecurityCard }from '@/features/profile/components/ProfileSecurityCard';
import { ProfileKycCard }     from '@/features/profile/components/ProfileKycCard';
import { ProfileActionsCard } from '@/features/profile/components/ProfileActionsCard';
import { ParametresSkeleton } from '@/features/profile/components/ParametresSkeleton';
import { PushNotificationWidget } from '@/components/pwa/PushNotificationWidget';
import { TerangaClubWidgetCard } from '@/features/teranga-club/components/TerangaClubWidgetCard';

function ParametresContent() {
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

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setSupabaseUser(data.user ?? null);
      setSupabaseReady(true);
    });
  }, []);

  const { data: apiUser } = useQuery<Partial<UserProfile>>({
    queryKey: ['users', 'me'],
    queryFn:  () => nestFetch<Partial<UserProfile>>(NEST_API.USERS.ME),
    enabled:  store.hasHydrated,
    retry:    false,
    staleTime: 60_000,
  });

  const meta = supabaseUser?.user_metadata ?? {};
  const hasAuth = !!apiUser || !!store.nestToken || !!store.userId || !!supabaseUser;

  const user: UserProfile | null = supabaseReady && hasAuth ? {
    id:               apiUser?.id               ?? store.userId          ?? supabaseUser?.id ?? '',
    prenom:           apiUser?.prenom           ?? meta.prenom           ?? '',
    nom:              apiUser?.nom              ?? meta.nom              ?? '',
    email:            apiUser?.email            ?? supabaseUser?.email   ?? null,
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

  if (!supabaseReady) {
    return <ParametresSkeleton />;
  }

  return (
    <div className="space-y-6 overflow-visible">

      {/* En-tête de la page */}
      <div className="flex items-center gap-3.5 pb-4 border-b border-border/70">
        <div className="w-10 h-10 rounded-inner bg-forest-950 text-on-inverse-marker border border-action-edge flex items-center justify-center shrink-0 shadow-2xs">
          <Settings className="w-5 h-5 text-on-inverse-marker" />
        </div>
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-forest-950">
            Paramètres du Compte
          </h1>
          <p className="text-xs text-foreground-muted mt-0.5 font-medium">
            Gérez vos informations personnelles, votre sécurité et la vérification de votre identité Klef.
          </p>
        </div>
      </div>

      {user && (
        <div className="space-y-6 overflow-visible">
          <ProfileHero
            user={user}
            onKycClick={() => setGateOpen(true)}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 overflow-visible">
            <ProfileInfoCard
              user={user}
              onUpdated={() => queryClient.invalidateQueries({ queryKey: ['users', 'me'] })}
            />
            <ProfileKycCard
              user={user}
              onKycClick={() => setGateOpen(true)}
            />
            <div className="lg:col-span-2 space-y-6">
              <ProfileSecurityCard
                user={user}
                onUpdated={() => queryClient.invalidateQueries({ queryKey: ['users', 'me'] })}
              />
              <TerangaClubWidgetCard />
              <PushNotificationWidget userId={user.id} />
              <ProfileActionsCard user={user} />
            </div>
          </div>
        </div>
      )}

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

export default function ParametresPage() {
  return (
    <TenantReservationsGuard>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 lg:pt-12 pb-24">
        <ParametresContent />
      </div>
    </TenantReservationsGuard>
  );
}
