export function fcfa(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(Math.round(n));
}

export function dateLong(s: string): string {
  return new Date(s).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

export function dateTime(s: string): string {
  return new Date(s).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function canSeeCoordonnees(statut: string, dateDebut: string): boolean {
  if (['CANCELLED', 'COMPLETED', 'EXPIRED', 'PENDING', 'PAID'].includes(statut)) return false;
  if (['DISPUTED', 'CHECKED_IN'].includes(statut)) return true;
  if (statut === 'CONFIRMED') {
    return (new Date(dateDebut).getTime() - Date.now()) <= 24 * 60 * 60 * 1000;
  }
  return false;
}
