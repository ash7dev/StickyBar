import { PublicPropertyCard } from './PublicPropertyCard';
import { listingsApi } from '@/lib/nestjs';
import type { SearchListingsParams } from '@/lib/nestjs';
import { Building2 } from 'lucide-react';

interface Props {
  params: SearchListingsParams;
}

export async function PublicPropertyGrid({ params }: Props) {
  let result;
  try {
    result = await listingsApi.search(params);
  } catch {
    result = { data: [], total: 0, page: 1, limit: 12 };
  }

  const { data: listings, total } = result;

  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-5 text-center">
        <div className="w-20 h-20 rounded-3xl bg-background-alt flex items-center justify-center">
          <Building2 className="w-9 h-9 text-foreground-muted" />
        </div>
        <div>
          <h3 className="text-lg font-black text-foreground">Aucun logement trouvé</h3>
          <p className="text-sm font-medium text-foreground-muted mt-1 max-w-xs">
            Essayez d&apos;élargir vos critères de recherche.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm font-medium text-foreground-muted mb-8">
        <span className="font-black text-foreground">{total}</span> logement{total > 1 ? 's' : ''} trouvé{total > 1 ? 's' : ''}
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.map((listing) => (
          <PublicPropertyCard key={listing.id} listing={listing} />
        ))}
      </div>
    </div>
  );
}
