'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ListingWizard } from '@/features/listings/components/wizard/listing-wizard';

function GestionnaireWizardContent() {
  const searchParams = useSearchParams();
  const ownerId = searchParams.get('ownerId') ?? undefined;

  return (
    <ListingWizard
      cancelHref="/gestionnaire/annonces"
      successHref="/gestionnaire/annonces?submitted=1"
      initialOwnerId={ownerId}
    />
  );
}

export default function GestionnaireNouvelleAnnoncePage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs font-semibold text-foreground-muted">
          Chargement de l&apos;assistant de création...
        </div>
      }
    >
      <GestionnaireWizardContent />
    </Suspense>
  );
}
