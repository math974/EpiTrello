import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { setAccessToken } from '@/lib/tokenStore';
import { me } from '@/lib/authClient';
import { useAuth } from '@/components/auth/AuthProvider';
import { REFRESH_TOKEN_MUTATION } from '@/lib/auth.graphql';
import { print } from 'graphql';

export default function OAuthCallbackPage() {
  const router = useRouter();
  const { checkAuth } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check for error in URL
        if (router.query.error) {
          setStatus('error');
          setErrorMessage(router.query.error as string);
          setTimeout(() => {
            router.replace('/login?error=oauth');
          }, 3000);
          return;
        }

        // Check if accessToken is in URL
        const accessToken = router.query.accessToken as string | undefined;

        if (accessToken) {
          // Store access token
          setAccessToken(accessToken);

          // Fetch user data
          const user = await me();
          if (!user) {
            throw new Error('Failed to fetch user data');
          }

          // Refresh auth state
          await checkAuth();

          // Clean up URL and redirect to /boards
          setStatus('success');
          setTimeout(() => {
            router.replace('/boards');
          }, 1000);
        } else {
          // No token in URL - try to refresh from cookie
          // The refresh token should be in httpOnly cookie
          // We need to call the refresh mutation
          const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_API || 'http://localhost:4000/graphql';
          
          try {
            const response = await fetch(graphqlUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include', // Include cookies
              body: JSON.stringify({
                query: print(REFRESH_TOKEN_MUTATION),
                variables: {
                  input: {}, // Empty input - will use cookie
                },
              }),
            });

            const result = await response.json();

            if (result.errors) {
              throw new Error(result.errors[0]?.message || 'Failed to refresh token');
            }

            if (result.data?.refreshToken?.accessToken) {
              // Store access token
              setAccessToken(result.data.refreshToken.accessToken);

              // Fetch user data
              const user = await me();
              if (!user) {
                throw new Error('Failed to fetch user data');
              }

              // Refresh auth state
              await checkAuth();

              // Clean up URL and redirect to /boards
              setStatus('success');
              setTimeout(() => {
                router.replace('/boards');
              }, 1000);
            } else {
              throw new Error('No access token in refresh response');
            }
          } catch (refreshError) {
            console.error('Failed to refresh token from cookie:', refreshError);
            setStatus('error');
            setErrorMessage('Failed to complete authentication');
            setTimeout(() => {
              router.replace('/login?error=oauth');
            }, 3000);
          }
        }
      } catch (error: any) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        setErrorMessage(error?.message || 'Authentication failed');
        setTimeout(() => {
          router.replace('/login?error=oauth');
        }, 3000);
      }
    };

    // Only run when router is ready
    if (router.isReady) {
      handleCallback();
    }
  }, [router.isReady, router.query, router, checkAuth]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
      <div className="text-center">
        {status === 'loading' && (
          <>
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-sky-300 border-t-transparent mx-auto" />
            <p className="text-sm text-white/70">Finalisation de la connexion...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="mb-4 mx-auto h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm text-white/70">Connexion réussie ! Redirection...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="mb-4 mx-auto h-8 w-8 rounded-full bg-red-500 flex items-center justify-center">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-sm text-red-400 mb-2">Erreur d'authentification</p>
            {errorMessage && <p className="text-xs text-white/50">{errorMessage}</p>}
            <p className="text-xs text-white/50 mt-2">Redirection vers la page de connexion...</p>
          </>
        )}
      </div>
    </div>
  );
}

