import { TileSkeleton } from './Tile';

/** Squelette de l'accueil hôte : même mosaïque que la page chargée. */
export function HomeSkeleton() {
  return (
    <div className="space-y-6 pb-12" aria-busy="true" aria-label="Chargement du tableau de bord">
      <div className="h-11 w-3/5 animate-pulse rounded-pill bg-background-card/70" />
      <div className="flex flex-wrap gap-5">
        <TileSkeleton span={2} className="min-h-[300px]" />
        <TileSkeleton className="min-h-[300px]" />
        <TileSkeleton span={2} className="min-h-[340px]" />
        <TileSkeleton />
        <TileSkeleton span={2} />
        <TileSkeleton />
      </div>
    </div>
  );
}
