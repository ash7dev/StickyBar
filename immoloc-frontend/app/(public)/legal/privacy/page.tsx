import type { Metadata } from 'next';
import { PrivacyPage } from '@/features/legal/components/PrivacyPage';
import { BRAND } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Politique de Confidentialité',
  description: `Découvrez comment ${BRAND.name} collecte, utilise et protège vos données personnelles, conformément à la loi sénégalaise et au RGPD.`,
};

export default function PrivacyRoute() {
  return <PrivacyPage />;
}
