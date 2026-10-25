import { redirect } from 'next/navigation';

// L'activation de l'espace propriétaire se fait désormais depuis la page propriétaires
export default function BecomeHostRoute() {
  redirect('/proprietaires');
}
