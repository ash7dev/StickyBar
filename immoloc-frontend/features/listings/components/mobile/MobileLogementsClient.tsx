'use client';

import { useEffect, useState } from 'react';
import { useQueryStates, parseAsString, parseAsInteger } from 'nuqs';
import { LayoutGrid, Building2, TreePine, BedDouble, Home, ChevronDown } from 'lucide-react';
import { listingsApi } from '@/lib/nestjs/listings.api';
import type { Listing, ListingType } from '@/lib/nestjs/types';
import { MobileHeroBanner } from '@/features/home/components/mobile/MobileHeroBanner';
import { MobileListingGridCard } from '@/features/home/components/mobile/MobileListingGridCard';
import { ListingFiltersMobile } from '../web/ListingFilters';

const TYPE_CHIPS = [
  { value: '',            label: 'Tous',         Icon: LayoutGrid },
  { value: 'APPARTEMENT', label: 'Appartements', Icon: Building2  },
  { value: 'VILLA',       label: 'Villas',       Icon: TreePine   },
  { value: 'CHAMBRE',     label: 'Chambres',     Icon: BedDouble  },
  { value: 'AUTRES',      label: 'Autres',       Icon: Home       },
];

const SECTION_META: Record<string, { label: string; Icon: typeof LayoutGrid }> = {
  '':            { label: 'Tous les logements', Icon: LayoutGrid },
  'APPARTEMENT': { label: 'Appartements',       Icon: Building2  },
  'VILLA':       { label: 'Villas',             Icon: TreePine   },
  'CHAMBRE':     { label: 'Chambres',           Icon: BedDouble  },
  'AUTRES':      { label: 'Autres logements',   Icon: Home       },
};

const PAGE_SIZE = 12;

function SkeletonCard() {
  return (
    <div className="rounded-[1.4rem] bg-neutral-100 animate-pulse" style={{ aspectRatio: '3/4' }} />
  );
}

type PageData = { key: string; listings: Listing[]; total: number; page: number };

export function MobileLogementsClient() {
  const [filters, setFilters] = useQueryStates(
    {
      ville:       parseAsString.withDefault(''),
      type:        parseAsString.withDefault(''),
      prixMin:     parseAsInteger,
      prixMax:     parseAsInteger,
      nbPersonnes: parseAsInteger.withDefault(1),
    },
    { shallow: false },
  );

  const filterKey = [
    filters.ville, filters.type,
    filters.prixMin, filters.prixMax, filters.nbPersonnes,
  ].join('|');

  const [data, setData]               = useState<PageData | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // loading est dérivé — pas de setState synchrone dans l'effet
  const loading  = !data || data.key !== filterKey;
  const listings = loading ? [] : data.listings;
  const total    = data?.total ?? 0;
  const page     = data?.page ?? 1;

  useEffect(() => {
    let cancelled = false;

    const params = {
      ...(filters.ville           && { ville:       filters.ville              }),
      ...(filters.type            && { type:        filters.type as ListingType }),
      ...(filters.prixMin         && { prixMin:     filters.prixMin             }),
      ...(filters.prixMax         && { prixMax:     filters.prixMax             }),
      ...(filters.nbPersonnes > 1 && { capaciteMin: filters.nbPersonnes         }),
      page: 1, limit: PAGE_SIZE,
    };

    listingsApi.search(params)
      .then((res) => {
        if (!cancelled) setData({ key: filterKey, listings: res.data, total: res.total, page: 1 });
      })
      .catch(() => {
        if (!cancelled) setData({ key: filterKey, listings: [], total: 0, page: 1 });
      });

    return () => { cancelled = true; };
  }, [filterKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = () => {
    const next = page + 1;
    setLoadingMore(true);
    listingsApi.search({
      ...(filters.ville           && { ville:       filters.ville              }),
      ...(filters.type            && { type:        filters.type as ListingType }),
      ...(filters.prixMin         && { prixMin:     filters.prixMin             }),
      ...(filters.prixMax         && { prixMax:     filters.prixMax             }),
      ...(filters.nbPersonnes > 1 && { capaciteMin: filters.nbPersonnes         }),
      page: next, limit: PAGE_SIZE,
    })
      .then((res) => {
        setData((prev) => prev
          ? { ...prev, listings: [...prev.listings, ...res.data], page: next }
          : prev,
        );
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  };

  const hasMore     = listings.length < total;
  const meta        = SECTION_META[filters.type] ?? SECTION_META[''];
  const SectionIcon = meta.Icon;

  return (
    <div className="flex flex-col bg-background">

      <MobileHeroBanner showCta={false} />

      {/* ── Type filter chips — sticky ── */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border">
        <div
          className="flex gap-2 overflow-x-auto px-4 py-3"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {TYPE_CHIPS.map(({ value, label, Icon }) => {
            const active = filters.type === value;
            return (
              <button
                key={value || 'all'}
                onClick={() => setFilters({ type: value })}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full shrink-0 transition-all duration-200 active:scale-95 text-[12px] font-bold"
                style={active ? {
                  background: 'linear-gradient(135deg, var(--primary-600), var(--primary-500))',
                  color: 'white',
                  boxShadow: '0 4px 14px rgba(20,101,76,0.3)',
                } : {
                  background: 'var(--neutral-100)',
                  color: 'var(--neutral-600)',
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Titre section + filtres ── */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary-50 flex items-center justify-center shrink-0">
            <SectionIcon className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-primary-500 mb-0.5">
              {filters.ville || 'Toutes zones'}
            </p>
            {loading ? (
              <div className="h-5 w-28 bg-neutral-100 rounded-full animate-pulse" />
            ) : (
              <h2 className="text-[18px] font-black text-foreground leading-none tracking-tight">
                {meta.label}
              </h2>
            )}
          </div>
        </div>
        <ListingFiltersMobile />
      </div>

      {/* ── Grille 2 colonnes ── */}
      <div className="px-4 pb-36">
        <div className="grid grid-cols-2 gap-3">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
            : listings.map((listing) => (
                <MobileListingGridCard key={listing.id} listing={listing} />
              ))}
        </div>

        {!loading && listings.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center">
              <LayoutGrid className="w-7 h-7 text-neutral-300" />
            </div>
            <p className="text-[15px] font-black text-foreground">Aucun résultat</p>
            <p className="text-[12px] text-foreground-muted">
              Essayez d&apos;élargir vos critères de recherche
            </p>
          </div>
        )}

        {hasMore && !loading && (
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="w-full mt-5 py-4 rounded-2xl border-2 border-neutral-200 bg-neutral-100 text-[13px] font-black text-foreground flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loadingMore
              ? <div className="w-4 h-4 border-2 border-neutral-300 border-t-primary-500 rounded-full animate-spin" />
              : <><ChevronDown className="w-4 h-4" /> Voir plus</>}
          </button>
        )}
      </div>

    </div>
  );
}
