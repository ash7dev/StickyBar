import { RegisterForm } from '@/features/auth/components/register-form';

export const metadata = { title: 'Inscription — ImmoLoc' };

interface Props {
  searchParams: Promise<{ next?: string }>;
}

export default async function RegisterPage({ searchParams }: Props) {
  const { next } = await searchParams;
  return <RegisterForm next={next} />;
}
