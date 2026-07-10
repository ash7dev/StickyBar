'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { nestFetch } from '@/lib/nestjs/api-client';
import { NEST_API } from '@/lib/nestjs/endpoints';
import type { ListingDetail } from '@/lib/nestjs/types';
import { EditListingForm } from '@/features/listings/components/owner/EditListingForm';
import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';

/* ─── Skeleton ────────────────────────────────────────────────────────────── */

function Skeleton() {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
        <p className="text-sm font-semibold text-neutral-500">Chargement de votre annonce…</p>
      </div>
    </div>
  );
}

/* ─── Error ───────────────────────────────────────────────────────────────── */

function ErrorState({ id, onRetry }: { id: string; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
      <div className="flex flex-col items-center gap-4 text-center max-w-xs">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center">
          <RefreshCw className="w-6 h-6 text-rose-400" />
        </div>
        <div>
          <p className="font-bold text-neutral-900 mb-1">Impossible de charger l&apos;annonce</p>
          <p className="text-sm text-neutral-500">Vérifiez votre connexion puis réessayez.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onRetry}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 rounded-xl text-sm font-bold text-white shadow-lg shadow-primary-500/20 transition-all">
            <RefreshCw className="w-4 h-4" /> Réessayer
          </button>
          <Link href={`/dashboard/annonces/${id}`}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm font-bold text-neutral-700 hover:bg-neutral-50 transition-all">
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
