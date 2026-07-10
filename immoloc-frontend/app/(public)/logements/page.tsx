import { Suspense } from 'react';
import type { Metadata } from 'next';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { Building2, MapPin, ShieldCheck, Star } from 'lucide-react';
import { PageBanner } from '@/components/ui/page-banner';
import { ListingFilters, ListingFiltersMobile } from '@/features/listings/components/web/ListingFilters';
import { PublicPropertyGrid } from '@/features/listings/components/web/PublicPropertyGrid';
import { MobileLogementsClient } from '@/features/listings/components/mobile/MobileLogementsClient';
import { BRAND } from '@/lib/config';
import type { ListingType } from '@/lib/nestjs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `Tous les logements — ${BRAND.name}`,
  description: 'Découvrez tous nos logements au Sénégal : villas, appartements, studios. Propriétaires vérifiés, réservation sécurisée par séquestre.',
  openGraph: {
    title: `Logements au Sénégal — ${BRAND.name}`,
    description: 'Trouvez votre logement idéal sur ImmoLoc. Propriétaires vérifiés, paiement sécurisé.',
    type: 'website',
  },
};

interface Props {
  searchParams: Promise<{
    ville?: string;
    type?: string;
    dateDebut?: string;
    dateFin?: string;
    nbPersonnes?: string;
    prixMin?: string;
    prixMax?: string;
    page?: string;
  }>;
}

const STATS = [
  { icon: Building2,  value: '500+', label: 'logements'    },
  { icon: MapPin,     value: '8',    label: 'villes'        },
  { icon: ShieldCheck,value: '100%', label: 'vérifiés'      },
  { icon: Star,       value: '4.8★', label: 'note moyenne'  },
];

function GridSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-neutral-100 rounded-[2rem] overflow-hidden animate-pulse">
          <div className="aspect-[4/3] bg-neutral-200" />
          <div className="p-6 space-y-3">
            <div className="h-3 bg-neutral-200 rounded-full w-1/3" />
            <div className="h-4 bg-neutral-200 rounded-full w-3/4" />
            <div className="h-3 bg-neutral-200 rounded-full w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function LogementsPage({ searchParams }: Props) {
  const sp = await searchParams;

  const gridParams = {
    ...(sp.ville      && { ville:      sp.ville              }),
    ...(sp.type       && { type:       sp.type as ListingType }),
    ...(sp.prixMin    && { prixMin:    parseInt(sp.prixMin)   }),
    ...(sp.prixMax    && { prixMax:    parseInt(sp.prixMax)   }),
    ...(sp.nbPersonnes && { capaciteMin: parseInt(sp.nbPersonnes) }),
    page:  sp.page ? parseInt(sp.page) : 1,
    limit: 12,
  };

  return (
    <NuqsAdapter>
      <div className="min-h-screen bg-background">

        {/* ── Vue mobile ── */}
        <div className="lg:hidden">
          <MobileLogementsClient />
        </div>

        {/* ── Vue desktop ── */}
        <div className="hidden lg:block">

          <PageBanner
            variant="dark"
            badge="Sénégal · Premium"
            title="Tous les logements"
            subtitle="Biens vérifiés, photos réelles, paiement sécurisé par séquestre."
            breadcrumbs={[
              { label: 'Accueil',    href: '/' },
              { label: 'Logements' },
            ]}
          >
            <div className="flex items-center gap-3 flex-wrap">
              {STATS.map(({ icon: Icon, value, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm"
                >
                  <Icon className="w-3.5 h-3.5 text-primary-400" />
                  <span className="text-xs font-black text-white">{value}</span>
                  <span className="text-xs font-medium text-white/40">{label}</span>
                </div>
              ))}
            </div>
          </PageBanner>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-16">
            <div className="flex gap-6 xl:gap-8 items-start">

              <aside className="w-72 xl:w-80 shrink-0 sticky top-[80px]">
                <ListingFilters />
              </aside>

              <div className="flex-1 min-w-0">
                <Suspense fallback={<GridSkeleton />}>
                  <PublicPropertyGrid params={gridParams} />
                </Suspense>
              </div>

            </div>
          </div>

        </div>

      </div>
    </NuqsAdapter>
  );
}
