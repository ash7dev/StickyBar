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
      <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
        <RefreshCw className="w-6 h-6 text-rose-400" />
      </div>
      <div>
        <p className="text-sm font-bold text-white mb-1">Impossible de charger cette annonce</p>
        <p className="text-xs text-white/40">Vérifiez votre connexion puis réessayez.</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-sm font-bold text-white transition-all shadow-lg shadow-emerald-500/20"
        >
          <RefreshCw className="w-4 h-4" />
          Réessayer
        </button>
        <Link
          href="/dashboard/annonces"
          className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.07] hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold text-white transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Link>
      </div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function AnnonceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const { data, isLoading, isError, refetch } = useQuery<ListingDetail>({
    queryKey: ['listing-owner', id],
    queryFn: () =>
      nestFetch<ListingDetail>(NEST_API.LISTINGS.FIND_ONE(id), { method: 'GET' }),
    staleTime: 30_000,
  });

  if (isLoading) return <ListingOwnerDetailSkeleton />;
  if (isError || !data) return <ErrorState onRetry={refetch} />;

  return <ListingOwnerDetail listing={data} />;
}
