'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { nestFetch, NEST_API } from '@/lib/nestjs';
import { useCurrentUser } from '@/hooks/use-current-user';

import { OwnerSettingsHeader } from '@/features/settings/components/owner/OwnerSettingsHeader';
import { OwnerProfileHero } from '@/features/settings/components/owner/OwnerProfileHero';
import { OwnerProfileInfoCard } from '@/features/settings/components/owner/OwnerProfileInfoCard';
import { OwnerPayoutSettingsCard } from '@/features/settings/components/owner/OwnerPayoutSettingsCard';
import { OwnerPreferencesCard } from '@/features/settings/components/owner/OwnerPreferencesCard';
import { OwnerKycVerificationCard } from '@/features/settings/components/owner/OwnerKycVerificationCard';
import { OwnerActionsCard } from '@/features/settings/components/owner/OwnerActionsCard';
import { OwnerSettingsSkeleton } from '@/features/settings/components/owner/OwnerSettingsSkeleton';

export default function OwnerParametresPage() {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useCurrentUser();

  const { data: listings } = useQuery<any[]>({
    queryKey: ['listings', 'mine'],
    queryFn: () => nestFetch<any[]>(NEST_API.LISTINGS.LIST_MINE),
  });

  if (isLoading) {
    return <OwnerSettingsSkeleton />;
  }

  return (
    <div className="space-y-6 pb-16">
      {/* En-tête de la page */}
      <OwnerSettingsHeader />

      {/* Carte Hero Profil Hôte */}
      <OwnerProfileHero
        prenom={user?.prenom}
        nom={user?.nom}
        email={user?.email}
        photoUrl={user?.photoUrl}
        activeListingsCount={listings?.length ?? 0}
        onPhotoUpdated={() => queryClient.invalidateQueries({ queryKey: ['user', 'current'] })}
      />

      {/* Grille des cartes de configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OwnerProfileInfoCard
          prenomInitial={user?.prenom}
          nomInitial={user?.nom}
          telephoneInitial={user?.telephone}
          emailInitial={user?.email}
          onUpdated={() => queryClient.invalidateQueries({ queryKey: ['user', 'current'] })}
        />

        <OwnerPayoutSettingsCard
          telephoneInitial={user?.telephone}
        />

        <div className="lg:col-span-2">
          <OwnerPreferencesCard />
        </div>

        <div className="lg:col-span-2">
          <OwnerKycVerificationCard />
        </div>

        {/* Section Sécurité : Déconnexion & Suppression Définitive du Compte */}
        <div className="lg:col-span-2">
          <OwnerActionsCard />
        </div>
      </div>
    </div>
  );
}
