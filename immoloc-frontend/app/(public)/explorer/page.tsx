import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BRAND } from '@/lib/config';
import { parseSearchParams } from '@/lib/explorer/filters-schema';
import { listingsApi } from '@/lib/nestjs/listings.api';
import { ResultsHeader } from '@/components/explorer/results-header';
import { ResultsGridSkeleton } from '@/components/explorer/results-grid-skeleton';
import { FilterBar } from '@/components/explorer/filter-bar';
import { ExplorerViewManager } from '@/components/explorer/explorer-view-manager';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `Explorer — ${BRAND.name}`,
  description: 'Découvrez tous nos logements au Sénégal : villas, appartements, studios. Propriétaires vérifiés, réservation sécurisée par séquestre.',
  openGraph: {
    title: `Logements au Sénégal — ${BRAND.name}`,
    description: 'Trouvez votre logement idéal sur Klef. Propriétaires vérifiés, paiement sécurisé.',
    type: 'website',
  },
};

interface ExplorerPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ExplorerPage({ searchParams }: ExplorerPageProps) {
  // Next 15+ : searchParams est une Promise
  const raw = await searchParams;
  const filters = parseSearchParams(raw);

  // Fetch des résultats avec les filtres
  const results = await listingsApi.search({
    ...(filters.ville && { ville: filters.ville }),
    ...(filters.type && filters.type.length > 0 && {
      type: (filters.type[0].toUpperCase() === 'AUTRE' ? 'AUTRES' : filters.type[0].toUpperCase()) as any,
    }),
    ...(filters.min !== undefined && { prixMin: filters.min }),
    ...(filters.max !== undefined && { prixMax: filters.max }),
    ...(filters.voyageurs && { capaciteMin: filters.voyageurs }),
    page: filters.page,
    limit: 12,
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Conteneur principal plein écran avec padding mobile ultra-propre */}
      <div className="w-full max-w-[1920px] mx-auto px-2 sm:px-6 pt-2 sm:pt-6 pb-32">

        {/* Barre de filtres sticky (glass / pastilles avec X / dropdowns / modal) */}
        <div className="mb-2 sm:mb-4">
          <FilterBar filters={filters} />
        </div>

        {/* En-tête (compteur + tri) au-dessus de la grille */}
        <ResultsHeader total={results.meta?.total ?? (results as any).total ?? results.data?.length ?? 0} filters={filters} />

        {/* Gestionnaire d'affichage réactif (Desktop : 2 colonnes | Mobile : Bouton flottant Carte/Liste) */}
        <Suspense
          fallback={<ResultsGridSkeleton />}
          key={JSON.stringify(filters)}
        >
          <ExplorerViewManager listings={results.data} />
        </Suspense>
      </div>
    </div>
  );
}
