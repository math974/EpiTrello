import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { ApolloProvider } from '@apollo/client';
import { apolloClient } from '../lib/apollo';
import { AuthProvider } from '../components/auth/AuthProvider';
import WorkspaceSidebar from '../components/workspaces/WorkspaceSidebar';
import Navbar from '../components/Navbar';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isAppRoute = router.pathname.startsWith('/app') || router.pathname === '/boards';

  return (
    <ApolloProvider client={apolloClient}>
      <AuthProvider>
        {isAppRoute ? (
          <>
            <WorkspaceSidebar />
            <div
              className="flex flex-col overflow-hidden transition-all duration-300"
              id="main-content"
              style={{ marginLeft: '256px', height: '100vh', minHeight: 0 }}
            >
              <Navbar />
              <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <Component {...pageProps} />
              </main>
            </div>
          </>
        ) : (
          <Component {...pageProps} />
        )}
      </AuthProvider>
    </ApolloProvider>
  );
}

