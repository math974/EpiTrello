import { useMemo } from 'react';
import { useRouter } from 'next/router';
import AuthLayout from '../components/auth/AuthLayout';
import SignupForm from '../components/auth/SignupForm';

export default function SignupPage() {
  const router = useRouter();
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
      <SignupForm oauthLoadingProvider={oauthLoadingProvider} />
    </AuthLayout>
  );
}
