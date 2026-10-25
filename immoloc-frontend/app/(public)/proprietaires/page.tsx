import type { Metadata } from 'next';
import { OwnersLanding } from '@/features/owners-landing/components/OwnersLanding';
import { BRAND } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Louer votre bien au Sénégal',
  description: `Publiez gratuitement votre logement sur ${BRAND.name} ou confiez-le à un gestionnaire, sans commission. Voyageurs vérifiés, paiement versé sur Wave ou Orange Money dès leur arrivée.`,
};

export default function ProprietairesRoute() {
  return <OwnersLanding />;
}
