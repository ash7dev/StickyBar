import { redirect } from 'next/navigation';

export default function ConfidentialiteRedirect() {
  redirect('/legal/privacy');
}
