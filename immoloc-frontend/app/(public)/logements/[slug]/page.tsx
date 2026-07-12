/* eslint-disable @typescript-eslint/no-explicit-any */
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { listingsApi } from '@/lib/nestjs';
import type { ListingType } from '@/lib/nestjs';
import { ListingGallery } from '@/features/listings/components/web/ListingGallery';
import { PricePreviewWidget } from '@/features/listings/components/web/PricePreviewWidget';
import { MobileReservationSheet } from '@/features/listings/components/web/MobileReservationSheet';
import { ListingInfo } from '@/features/listings/components/web/ListingInfo';
import { ListingFilters } from '@/features/listings/components/web/ListingFilters';
import { PublicPropertyGrid } from '@/features/listings/components/web/PublicPropertyGrid';
import { PageBanner } from '@/components/ui/page-banner';
import { BRAND } from '@/lib/config';

// UUID = detail (always fresh); city slug = ISR via fetch cache
export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    type?: string;
    dateDebut?: string;
    dateFin?: string;
    nbPersonnes?: string;
    prixMax?: string;
    page?: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  if (UUID_RE.test(slug)) {
    try {
      const listing = await listingsApi.findOne(slug);
      const mainPhoto = listing.photos.find((p) => p.estPrincipale) ?? listing.photos[0];
      return {
        title: `${listing.titre} — ${BRAND.name}`,
        description: listing.description.slice(0, 160),
        openGraph: {
          title: listing.titre,
          description: listing.description.slice(0, 160),
          images: mainPhoto ? [{ url: mainPhoto.url, width: 1200, height: 800, alt: listing.titre }] : [],
          type: 'website',
        },
      };
    } catch {
      return { title: `Logement — ${BRAND.name}` };
    }
  }

  const ville = decodeURIComponent(slug);
  return {
    title: `Logements à ${ville} — ${BRAND.name}`,
    description: `Découvrez les meilleures locations à ${ville} : villas, appartements, studios. Réservation sécurisée par séquestre.`,
    openGraph: {
      title: `Logements à ${ville} — ${BRAND.name}`,
      description: `Trouvez votre logement idéal à ${ville} sur ${BRAND.name}. Propriétaires vérifiés, paiement sécurisé.`,
      type: 'website',
    },
  };
}

// City listing page — ISR 60s
async function CityListingsPage({
  slug,
  searchParams,
}: {
  slug: string;
  searchParams: Awaited<Props['searchParams']>;
}) {
  const ville = decodeURIComponent(slug);

  const gridParams = {
    ville,
    ...(searchParams.type && { type: searchParams.type as ListingType }),
    ...(searchParams.prixMax && { prixMax: parseInt(searchParams.prixMax) }),
    ...(searchParams.nbPersonnes && { capaciteMin: parseInt(searchParams.nbPersonnes) }),
    page: searchParams.page ? parseInt(searchParams.page) : 1,
    limit: 12,
  };

  return (
    <NuqsAdapter>
      <div className="min-h-screen bg-background-card">
        <PageBanner
          variant="dark"
          badge="Sénégal · Premium"
          title={`Logements à ${ville}`}
          subtitle="Tous les biens vérifiés, photos réelles, réservation sécurisée."
          breadcrumbs={[
            { label: 'Accueil', href: '/' },
            { label: 'Logements', href: '/logements' },
            { label: ville },
          ]}
        />
        <ListingFilters />
        <div className="max-w-7xl mx-auto px-6 py-10">
          <Suspense fallback={<GridSkeleton />}>
            <PublicPropertyGrid params={gridParams} />
          </Suspense>
        </div>
      </div>
    </NuqsAdapter>
  );
}

// Helper: Calculer toutes les dates bloquées (réservations + indisponibilités)
function getDisabledDates(listing: any): Date[] {
  const disabled: Date[] = [];

  // Bloquer toutes les dates dans les réservations actives
  (listing.reservations || []).forEach((res: any) => {
    const start = new Date(res.dateDebut);
    const end = new Date(res.dateFin);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      disabled.push(new Date(d));
    }
  });

  // Bloquer toutes les dates dans les indisponibilités manuelles
  (listing.indisponibilites || []).forEach((indispo: any) => {
    const start = new Date(indispo.dateDebut);
    const end = new Date(indispo.dateFin);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      disabled.push(new Date(d));
    }
  });

  return disabled;
}

// Listing detail page — SSR always fresh
async function ListingDetailPage({ slug }: { slug: string }) {
  let listing;
  try {
    listing = await listingsApi.findOne(slug);
  } catch {
    notFound();
  }

  // Type cast to bypass TS strict enum overlap error
  if ((listing.statut as any) !== 'PUBLISHED') notFound();

  // Calculer les dates bloquées pour le calendrier
  const disabledDates = getDisabledDates(listing);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    name: listing.titre,
    description: listing.description,
    address: {
      '@type': 'PostalAddress',
      addressLocality: listing.ville,
      addressRegion: listing.quartier ?? undefined,
      addressCountry: 'SN',
    },
    priceRange: `${listing.prixBase.toLocaleString('fr-FR')} FCFA/nuit`,
    numberOfRooms: listing.nombreChambres ?? undefined,
    amenityFeature: listing.equipements.map((e) => ({
      '@type': 'LocationFeatureSpecification',
      name: e.nom,
      value: true,
    })),
    photo: listing.photos.map((p) => ({ '@type': 'ImageObject', url: p.url })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="min-h-screen bg-background-card overflow-x-hidden">

        <div className="max-w-7xl mx-auto px-6 py-8">

          {/* ── Bouton retour (mobile uniquement) ── */}
          <div className="mb-4 lg:hidden">
            <Link
              href="/logements"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground-muted hover:text-foreground transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Retour aux logements
            </Link>
          </div>

          <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start relative">
            
            {/* ── Left Column: Gallery + Info ── */}
            <div className="flex flex-col gap-8 min-w-0">
              <ListingGallery photos={listing.photos} title={listing.titre} />
              <ListingInfo listing={listing} />
            </div>

            {/* ── Right Column: Reservation Sidebar (sticky) ── */}
            <div className="hidden lg:block sticky top-6">
              <PricePreviewWidget
                listingId={listing.id}
                prixBase={listing.prixBase}
                nuitesMinimum={listing.nuitesMinimum}
                capaciteMax={listing.capaciteMax}
                ageMin={listing.ageMin}
                personnesBase={listing.personnesBase}
                tarifsPersonnes={listing.tarifsPersonnes}
                tarifsNuits={listing.tarifsNuits}
                disabledDates={disabledDates}
              />
            </div>
          </div>

        </div>

        {/* Bottom spacing — extra on mobile for the sticky bar */}
        <div className="h-8 lg:h-16" />
      </div>

      {/* Mobile sticky bar + bottom sheet */}
      <MobileReservationSheet
        listingId={listing.id}
        prixBase={listing.prixBase}
        nuitesMinimum={listing.nuitesMinimum}
        capaciteMax={listing.capaciteMax}
        ageMin={listing.ageMin}
        personnesBase={listing.personnesBase}
        tarifsPersonnes={listing.tarifsPersonnes}
        tarifsNuits={listing.tarifsNuits}
        disabledDates={disabledDates}
      />
    </>
  );
}

export default async function LogementsSlugPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;

  if (UUID_RE.test(slug)) {
    return <ListingDetailPage slug={slug} />;
  }

  return <CityListingsPage slug={slug} searchParams={sp} />;
}

function GridSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-background-alt rounded-[2rem] overflow-hidden animate-pulse">
          <div className="aspect-[4/3] bg-border" />
          <div className="p-6 space-y-3">
            <div className="h-3 bg-border rounded-full w-1/3" />
            <div className="h-4 bg-border rounded-full w-3/4" />
            <div className="h-3 bg-border rounded-full w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
