'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import type { ListingDetail } from '@/lib/nestjs/types';
import { EditListingForm } from '@/features/listings/components/owner/EditListingForm';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Loader2, AlertTriangle } from 'lucide-react';

/* ─── Skeleton ────────────────────────────────────────────────────────────── */

function Skeleton() {
  return (
    <div className="min-h-screen bg-background-alt flex items-center justify-center p-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="w-14 h-14 rounded-inner bg-forest-950 border border-forest-800 flex items-center justify-center shadow-lg">
          <Loader2 className="w-7 h-7 text-on-inverse-marker animate-spin" />
        </div>
        <div>
          <h3 className="font-display text-lg font-bold text-foreground">Chargement de votre annonce…</h3>
          <p className="text-xs text-foreground-muted mt-1">Veuillez patienter quelques instants</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Error State ─────────────────────────────────────────────────────────── */

function ErrorState({ id, onRetry }: { id: string; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-background-alt flex items-center justify-center p-6">
      <div className="card p-8 max-w-md w-full text-center space-y-5 shadow-xl">
        <div className="w-14 h-14 rounded-inner bg-error-50 border border-error-500/30 flex items-center justify-center text-error-600 mx-auto">
          <AlertTriangle className="w-7 h-7 text-error-600" />
        </div>
        <div>
          <h3 className="font-display text-xl font-bold text-foreground">Impossible de charger l&apos;annonce</h3>
          <p className="text-xs text-foreground-muted mt-1.5 leading-relaxed">
            Vérifiez votre connexion internet ou la validité de l&apos;identifiant de l&apos;annonce.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onRetry}
            className="btn-action text-xs px-5 justify-center cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" /> Réessayer
          </button>
          <Link
            href={`/dashboard/annonces/${id}`}
            className="btn-ghost text-xs px-5 justify-center"
          >
            <ArrowLeft className="w-4 h-4" /> Retour
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function ModifierAnnoncePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data, isLoading, isError, refetch } = useQuery<ListingDetail>({
    queryKey: ['listing-owner', id],
    queryFn: () =>
      nestFetch<ListingDetail>(NEST_API.LISTINGS.FIND_ONE(id), { method: 'GET' }),
    staleTime: 60_000,
  });

  if (isLoading) return <Skeleton />;
  if (isError || !data) return <ErrorState id={id} onRetry={refetch} />;

  return <EditListingForm listing={data} />;
}
