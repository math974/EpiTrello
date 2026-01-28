import { useMemo } from 'react';
import { useRouter } from 'next/router';
import AuthLayout from '../components/auth/AuthLayout';
import LoginForm from '../components/auth/LoginForm';

export default function LoginPage() {
  const router = useRouter();
  const oauthLoadingProvider = useMemo<'github' | 'discord' | null>(() => {
    const value = router.query.oauth;
    if (value === 'github' || value === 'discord') return value;
    return null;
  }, [router.query.oauth]);

  return (
    <AuthLayout
      title="Bienvenue"
      subtitle="Connectez-vous pour acceder a votre espace"
    >
      <LoginForm oauthLoadingProvider={oauthLoadingProvider} />
    </AuthLayout>
  );
}
