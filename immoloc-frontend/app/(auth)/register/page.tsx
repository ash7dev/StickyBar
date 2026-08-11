import { RegisterForm } from '@/features/auth/components/register-form';

export const metadata = { title: 'Inscription — Klef' };

interface Props {
  searchParams: Promise<{ next?: string; ref?: string }>;
}

export default async function RegisterPage({ searchParams }: Props) {
  const { next, ref } = await searchParams;
  return <RegisterForm next={next} referralCode={ref} />;
}
