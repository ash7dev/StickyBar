/**
 * Règle d'affichage des coordonnées de contact (Téléphone / Email)
 * 
 * Les coordonnées directes de l'hôte ou du locataire sont masquées et déverrouillées :
 * - Masquées pour : PENDING, PAID, CANCELLED, COMPLETED, EXPIRED
 * - Visibles pour : CHECKED_IN, DISPUTED
 * - Pour CONFIRMED : Déverrouillées uniquement dans la fenêtre des 24h avant le début du séjour.
 */
export function canSeeCoordonnees(statut?: string, dateDebut?: string): boolean {
  if (!statut || !dateDebut) return false;
  if (['CANCELLED', 'COMPLETED', 'EXPIRED', 'PENDING', 'PAID'].includes(statut)) return false;
  if (['DISPUTED', 'CHECKED_IN'].includes(statut)) return true;
  if (statut === 'CONFIRMED') {
    const debutMs = new Date(dateDebut).getTime();
    return (debutMs - Date.now()) <= 24 * 60 * 60 * 1000;
  }
  return false;
}
