import type { Metadata } from 'next';
import { HowItWorksPage } from '@/features/home/components/HowItWorksPage';
import { BRAND } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Comment ça marche',
  description: `Découvrez comment ${BRAND.name} fonctionne : recherche, réservation, séquestre et encaissement — un guide complet pour locataires et propriétaires.`,
};

export default function CommentCaMarcheRoute() {
  return <HowItWorksPage />;
}
