import type { OwnerOverviewResponse } from '@/lib/nestjs';
import { percent } from '../lib/format';
import { Tile, TileTitle } from './Tile';

const RADIUS = 50;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Anneau d'occupation sur les 30 derniers jours, tous biens confondus. */
export function OccupancyTile({ occupancy }: { occupancy: OwnerOverviewResponse['occupancy'] }) {
  const dash = Math.min(occupancy.rate, 1) * CIRCUMFERENCE;

  return (
    <Tile tone="dark" labelledBy="home-occupancy" className="items-center justify-center text-center">
      <TileTitle id="home-occupancy" className="self-start text-forest-200 opacity-100">
        Occupation · {occupancy.windowDays} derniers jours
      </TileTitle>
      <svg width="168" height="168" viewBox="0 0 120 120" role="img" aria-label={`Occupation ${percent(occupancy.rate)}`}>
        <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="12" />
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          stroke="var(--lime-400)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${CIRCUMFERENCE}`}
          transform="rotate(-90 60 60)"
        />
        <text x="60" y="67" textAnchor="middle" className="font-display" fontSize="24" fontWeight="600" fill="currentColor">
          {percent(occupancy.rate)}
        </text>
      </svg>
      <p className="text-[13px] text-forest-200">
        {occupancy.bookedNights} nuit{occupancy.bookedNights > 1 ? 's' : ''} louée
        {occupancy.bookedNights > 1 ? 's' : ''} sur {occupancy.availableNights} disponibles
      </p>
    </Tile>
  );
}
