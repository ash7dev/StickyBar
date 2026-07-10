import type { Metadata } from 'next';
import { ContactPage } from '@/features/contact/components/ContactPage';
import { BRAND } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Contact',
  description: `Contactez l'équipe ${BRAND.name} par WhatsApp, téléphone ou email. Nous répondons sous 24 h.`,
};

export default function ContactRoute() {
  return <ContactPage />;
}
