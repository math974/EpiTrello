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
              className="flex flex-1 flex-col overflow-hidden transition-all duration-300" 
              id="main-content" 
              style={{ marginLeft: '256px' }}
            >
              <Navbar />
              <main className="flex-1 overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
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

