import { Share } from 'react-native';
import { formatAmount } from '../owner-home/lib/format';

/** Site public : les liens partagés s'ouvrent même sans l'app (même valeur que metadataBase du web). */
export const SITE_URL = (process.env.EXPO_PUBLIC_SITE_URL || 'https://klef.sn').replace(/\/$/, '');

/** Partage d'une annonce, pensé pour WhatsApp : titre, lieu, prix, garantie, lien. */
export function shareListing(l: { id: string; titre: string; ville?: string | null; quartier?: string | null; prixSejour?: number | null; nbNuits?: number | null; nightly?: number | null }) {
  const place = [l.quartier, l.ville].filter(Boolean).join(', ');
  const price = l.prixSejour
    ? `${formatAmount(l.prixSejour)} FCFA pour ${l.nbNuits} nuit${(l.nbNuits ?? 0) > 1 ? 's' : ''}`
    : l.nightly
      ? `dès ${formatAmount(l.nightly)} FCFA la nuit`
      : null;
  const message = [`${l.titre}${place ? ` · ${place}` : ''}`, price, 'Paiement protégé : l’hôte n’est payé qu’à l’arrivée.', `${SITE_URL}/explorer/${l.id}`]
    .filter(Boolean)
    .join('\n');
  return Share.share({ message, title: l.titre }).catch(() => {});
}

/** Partage d'une escale : « 5 logements à Saly sur Paixi ». */
export function shareEscale(e: { label: string; count: number; fromPrice: number }) {
  const message = `${e.count} logement${e.count > 1 ? 's' : ''} à ${e.label} sur Paixi, dès ${formatAmount(e.fromPrice)} FCFA la nuit.\n${SITE_URL}/explorer?ville=${encodeURIComponent(e.label)}`;
  return Share.share({ message, title: e.label }).catch(() => {});
}
