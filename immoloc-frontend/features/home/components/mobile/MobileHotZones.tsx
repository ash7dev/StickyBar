'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Waves, Building2, Landmark, TreePine, Sun, Anchor, ArrowRight } from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import { listingsApi } from '@/lib/nestjs/listings.api';
import { HOT_ZONES, type ZoneConfig, type ZoneIconType } from './zones.config';

interface ZoneWithCount extends ZoneConfig {
  count: number;
}

const ICON_MAP: Record<ZoneIconType, React.ComponentType<LucideProps>> = {
  waves:    Waves,
  building: Building2,
  landmark: Landmark,
  tree:     TreePine,
  sun:      Sun,
  anchor:   Anchor,
};

function SkeletonCard() {
  return (
    <div className="shrink-0 w-[140px] h-[185px] rounded-[1.8rem] bg-background-alt animate-pulse" />
  );
}

function ZoneCard({ zone }: { zone: ZoneWithCount }) {
  const Icon = ICON_MAP[zone.icon];

  return (
    <Link
      href={`/logements?ville=${encodeURIComponent(zone.ville)}`}
      className="relative shrink-0 w-[140px] h-[185px] rounded-[1.8rem] overflow-hidden active:scale-[0.96] transition-transform duration-150 snap-start"
      style={{ background: zone.gradient }}
    >
      {/* Dot pattern */}
      <div
        className="absolute inset-0 opacity-[0.055]"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '12px 12px',
        }}
      />

      {/* Ambient glow */}
      <div
        className="absolute -top-8 -left-8 w-36 h-36 rounded-full blur-[50px] pointer-events-none"
        style={{ background: zone.glow }}
      />

      {/* Bottom fade */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent" />

      <div className="relative z-10 flex flex-col justify-between h-full p-4">

        {/* Icon box */}
        <div>
          <div
            className="w-10 h-10 rounded-[13px] flex items-center justify-center mb-2"
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.18)',
            }}
          >
            <Icon className="w-5 h-5" style={{ color: zone.iconColor }} />
          </div>
          <span className="text-[8px] font-bold text-white/40 uppercase tracking-[0.22em]">
            {zone.zone}
          </span>
        </div>

        {/* Name + count + arrow */}
        <div className="space-y-1.5">
          {/* Count pill */}
          <div
            className="inline-flex items-center px-2 py-0.5 rounded-full"
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.16)',
            }}
          >
            <span className="text-[8.5px] font-black text-white/80 leading-none">
              {zone.count} annonce{zone.count > 1 ? 's' : ''}
            </span>
          </div>

          <h3 className="text-[19px] font-black text-white leading-none tracking-tight">
            {zone.label}
          </h3>

          <div className="flex items-center gap-1">
            <span className="text-[9px] font-bold text-white/45">Explorer</span>
            <ArrowRight className="w-3 h-3 text-white/45" />
          </div>
        </div>
      </div>
    </Link>
  );
}

export function MobileHotZones() {
  const [zones, setZones] = useState<ZoneWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all(
      HOT_ZONES.map((z) =>
        listingsApi
          .search({ ville: z.ville, limit: 1 })
          .then((res) => ({ ...z, count: res.total }))
          .catch(() => ({ ...z, count: 0 })),
      ),
    )
      .then((results) => setZones(results.filter((z) => z.count > 0)))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && zones.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="px-4">
        <p className="text-[8px] font-black uppercase tracking-[0.3em] text-emerald-600 mb-0.5">
          Où séjourner
        </p>
        <h2 className="text-[15px] font-black text-foreground leading-none">
          Zones populaires
        </h2>
      </div>

      <div
        className="flex gap-2.5 overflow-x-auto px-4 pb-1 snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
          : zones.map((zone) => <ZoneCard key={zone.ville} zone={zone} />)}
      </div>
    </section>
  );
}
