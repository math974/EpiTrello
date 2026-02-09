import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import AuthLayout from '../components/auth/AuthLayout';
import LoginForm from '../components/auth/LoginForm';
import { useAuth } from '@/components/auth/AuthProvider';

type LoginErrorState = 'none' | 'invalid' | 'network' | 'oauth';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  
  // Redirect to /boards if already authenticated
  useEffect(() => {
    if (!loading && user) {
      router.replace('/boards');
    }
  }, [user, loading, router]);

  const errorState = useMemo<LoginErrorState>(() => {
    const value = router.query.error;
    if (value === 'invalid' || value === 'network' || value === 'oauth') return value;
    if (value === 'none') return 'none';
    return 'none';
  }, [router.query.error]);
  const oauthLoadingProvider = useMemo<'github' | 'discord' | null>(() => {
    const value = router.query.oauth;
    if (value === 'github' || value === 'discord') return value;
    return null;
  }, [router.query.oauth]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-sky-300 border-t-transparent mx-auto" />
          <p className="text-sm text-white/70">Chargement...</p>
        </div>
      </div>
    );
  }

  // Don't render login form if authenticated (will redirect)
  if (user) {
    return null;
  }

  return (
    <AuthLayout
      title="Bienvenue"
      subtitle="Connectez-vous pour acceder a votre espace"
    >
      <LoginForm errorState={errorState} oauthLoadingProvider={oauthLoadingProvider} />
    </AuthLayout>
  );
}
