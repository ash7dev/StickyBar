import { Alert, Linking } from 'react-native';
import { SITE_URL } from '../../../share/share';
import { waNumber } from '../../lib/today';

export const callOwner = (phone?: string | null) => phone && Linking.openURL(`tel:${phone}`);

export function whatsappOwner(phone: string | null | undefined, text: string) {
  if (!phone) return;
  Linking.openURL(`https://wa.me/${waNumber(phone)}?text=${encodeURIComponent(text)}`).catch(() =>
    Alert.alert('WhatsApp indisponible', 'Installez WhatsApp ou appelez directement le propriétaire.'),
  );
}

/** Message d'invitation pour un propriétaire dont le compte a été créé par son gestionnaire. */
export const inviteText = (prenom: string, managerPrenom?: string | null) =>
  `Bonjour ${prenom}, ici ${managerPrenom ?? 'votre gestionnaire'} de Paixi Managed. Votre logement est en ligne sur Paixi. Connectez-vous avec ce numéro pour suivre vos réservations et vos revenus : ${SITE_URL}`;

export const maskPhone = (p?: string | null) => {
  const d = (p ?? '').replace(/\D/g, '').replace(/^221/, '');
  return d.length >= 4 ? `${d.slice(0, 2)} ••• •• ${d.slice(-2)}` : p ?? '';
};
