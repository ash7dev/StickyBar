/**
 * Chemin de retour après connexion (`?next=`), par ex. l'écran de paiement avec les dates choisies.
 * Seuls les chemins internes sont acceptés ; sinon on retombe sur l'accueil voyageur.
 */
export function safeNext(next?: string | string[] | null): string {
  const n = Array.isArray(next) ? next[0] : next;
  return n && n.startsWith('/') && !n.startsWith('//') ? n : '/(tenant)';
}

/** Suffixe à recoller sur un lien d'auth pour garder le chemin de retour. */
export function nextQuery(next?: string | string[] | null, sep: '?' | '&' = '?'): string {
  const n = Array.isArray(next) ? next[0] : next;
  return n ? `${sep}next=${encodeURIComponent(n)}` : '';
}
