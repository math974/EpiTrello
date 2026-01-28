import { useMemo } from 'react';
import { useRouter } from 'next/router';
import AuthLayout from '../components/auth/AuthLayout';
import LoginForm from '../components/auth/LoginForm';

type LoginErrorState = 'none' | 'invalid' | 'network';

export default function LoginPage() {
  const router = useRouter();
  const errorState = useMemo<LoginErrorState>(() => {
    const value = router.query.error;
    if (value === 'invalid' || value === 'network') return value;
    if (value === 'none') return 'none';
    return 'none';
  }, [router.query.error]);
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
      <LoginForm errorState={errorState} oauthLoadingProvider={oauthLoadingProvider} />
    </AuthLayout>
  );
}
