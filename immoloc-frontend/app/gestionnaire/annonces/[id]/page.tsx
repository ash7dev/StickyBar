'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import type { ListingDetail } from '@/lib/nestjs/types';
import {
  ListingOwnerDetail,
  ListingOwnerDetailSkeleton,
} from '@/features/listings/components/owner/ListingOwnerDetail';
import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';

/* ─── Error state ─────────────────────────────────────────────────────────── */

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
      <div className="w-14 h-14 rounded-2xl bg-error-50 border border-error-500/20 flex items-center justify-center">
        <RefreshCw className="w-6 h-6 text-error-600" />
      </div>
      <div>
        <p className="text-sm font-bold text-foreground mb-1">Impossible de charger cette annonce conciergerie</p>
        <p className="text-xs text-foreground-muted">Vérifiez votre connexion puis réessayez.</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="btn-action text-xs px-4 py-2.5 flex items-center gap-2 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          Réessayer
        </button>
        <Link
          href="/gestionnaire/annonces"
          className="px-4 py-2.5 rounded-pill border border-border bg-background-alt text-xs font-semibold text-foreground hover:bg-neutral-100 transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux annonces
        </Link>
      </div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function GestionnaireAnnonceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data, isLoading, isError, refetch } = useQuery<ListingDetail>({
    queryKey: ['listing-gestionnaire-detail', id],
    queryFn: () =>
      nestFetch<ListingDetail>(NEST_API.LISTINGS.FIND_ONE(id), { method: 'GET' }),
    staleTime: 30_000,
  });

  if (isLoading) return <ListingOwnerDetailSkeleton />;
  if (isError || !data) return <ErrorState onRetry={refetch} />;

  return (
    <div className="space-y-6">
      {/* Barre de retour et d'édition conciergerie */}
      <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
        <Link
          href="/gestionnaire/annonces"
          className="inline-flex items-center gap-2 text-xs font-semibold text-foreground-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-forest-600" aria-hidden="true" />
          <span>Retour au portefeuille d&apos;annonces conciergerie</span>
        </Link>

        <Link
          href={`/gestionnaire/annonces/${id}/modifier`}
          className="btn-action inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold"
        >
          <span>Modifier cette annonce conciergerie</span>
        </Link>
      </div>

      <ListingOwnerDetail listing={data} isGestionnaire={true} />
    </div>
  );
}
