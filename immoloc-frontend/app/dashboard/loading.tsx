/**
 * Chargement générique de l'espace hôte. Il s'affiche pendant la navigation vers
 * N'IMPORTE QUEL onglet : il reste neutre (titre + bloc), sans imiter une page précise.
 */
export default function DashboardLoading() {
  return (
    <div className="space-y-6 pb-12" aria-busy="true" aria-label="Chargement">
      <div className="space-y-2">
        <div className="h-3 w-24 animate-pulse rounded-pill bg-background-card/80" />
        <div className="h-9 w-64 animate-pulse rounded-pill bg-background-card/80" />
      </div>
      <div className="h-[420px] animate-pulse rounded-[28px] bg-background-card/70" />
    </div>
  );
}
