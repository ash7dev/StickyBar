import { Suspense } from 'react';
import { OtpForm } from '@/features/auth/components/otp-form';

export const metadata = { title: 'Vérification — Klef' };

export default function VerifyPage() {
  return (
    <Suspense>
      <OtpForm />
    </Suspense>
  );
}
