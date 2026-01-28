import { useMemo } from 'react';
import { useRouter } from 'next/router';
import AuthLayout from '../components/auth/AuthLayout';
import SignupForm from '../components/auth/SignupForm';

type SignupErrorState = 'none' | 'invalid' | 'network' | 'exists';

export default function SignupPage() {
  const router = useRouter();
  const errorState = useMemo<SignupErrorState>(() => {
    const value = router.query.error;
    if (value === 'invalid' || value === 'network' || value === 'exists') return value;
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
      title="Creer un compte"
      subtitle="Rejoignez EpiTrello en quelques secondes"
    >
      <SignupForm errorState={errorState} oauthLoadingProvider={oauthLoadingProvider} />
    </AuthLayout>
  );
}
