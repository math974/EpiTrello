import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../components/auth/AuthProvider';

// Disable static generation for this page (requires authentication)
export const getServerSideProps = async () => {
  return {
    props: {},
  };
};

export default function BoardsPage() {
  const router = useRouter();
  const { user, loading, checkAuth } = useAuth();

  // Check authentication on mount and attempt refresh if needed
  useEffect(() => {
    const verifyAuth = async () => {
      if (!loading) {
        // If no user, try to refresh auth (might have valid refresh token cookie)
        if (!user) {
          await checkAuth();
        }
      }
    };

    verifyAuth();
  }, [loading, user, checkAuth]);

  // Redirect to login if not authenticated after checking
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  // Redirect to /app if authenticated (workspace sidebar will handle workspace selection)
  useEffect(() => {
    if (!loading && user) {
      // The sidebar will handle redirecting to the first workspace if available
      router.replace('/app');
    }
  }, [user, loading, router]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-sky-300 border-t-transparent mx-auto" />
          <p className="text-sm text-white/70">Verification de l'authentification...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  // This page is deprecated - redirecting to /app
  return null;
}
