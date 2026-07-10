import { LoginForm } from '@/features/auth/components/login-form';

export const metadata = { title: 'Connexion — ImmoLoc' };

interface Props {
  searchParams: Promise<{ next?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const { next } = await searchParams;
  return <LoginForm next={next} />;
}
