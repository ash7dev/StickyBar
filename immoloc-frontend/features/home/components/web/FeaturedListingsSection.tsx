import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { PublicPropertyGrid } from '@/features/listings/components/web/PublicPropertyGrid';

function CardSkeleton() {
  return (
    <div className="bg-background-card rounded-[2rem] overflow-hidden border border-border animate-pulse shadow-sm">
      <div className="aspect-[4/3] bg-background-alt" />
      <div className="p-6 space-y-3">
        <div className="h-3 bg-background-alt rounded-full w-1/3" />
        <div className="h-4 bg-background-alt rounded-full w-3/4" />
        <div className="h-3 bg-background-alt rounded-full w-1/2" />
      </div>
    </div>
  );
}

export function FeaturedListingsSection() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-16">
      <div className="flex items-end justify-between mb-12">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Sélection vérifiée</span>
          </div>
          <h2 className="text-4xl font-black text-foreground tracking-tight">Biens à la une</h2>
        </div>
        <Link
          href="/logements"
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm"
        >
          Voir tout <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      <Suspense
        fallback={
          <div className="grid md:grid-cols-3 gap-6">
            {[0, 1, 2].map((i) => <CardSkeleton key={i} />)}
          </div>
        }
      >
        <PublicPropertyGrid params={{ limit: 6, page: 1 }} />
      </Suspense>
    </section>
  );
}

