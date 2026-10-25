import { redirect } from 'next/navigation';

// Paixi Managed est présenté sur la page propriétaires, avec le formulaire de rappel
export default function ManagedRoute() {
  redirect('/proprietaires#rappel');
}
