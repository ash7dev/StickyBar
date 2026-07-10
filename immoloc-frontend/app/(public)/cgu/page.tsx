import type { Metadata } from 'next';
import { CGUPage } from '@/features/legal/components/CGUPage';
import { BRAND } from '@/lib/config';

export const metadata: Metadata = {
  title: `Conditions Générales d'Utilisation`,
  description: `Lisez les conditions générales d'utilisation de ${BRAND.name} — règles de la plateforme, paiements, séquestre, litiges et protection des données.`,
};

export default function CGURoute() {
  return <CGUPage />;
}
