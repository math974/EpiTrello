import { Button } from '@/components/shadcn/ui/button';

type Provider = 'github' | 'google';

type OAuthButtonsProps = {
  loadingProvider?: Provider | null;
  onProviderClick?: (provider: Provider) => void;
};

export default function OAuthButtons({ loadingProvider = null, onProviderClick }: OAuthButtonsProps) {
  const isGithubLoading = loadingProvider === 'github';
  const isGoogleLoading = loadingProvider === 'google';
  const isBusy = loadingProvider !== null;

  // Get backend URL from GraphQL API URL
  const getBackendUrl = () => {
    const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_API || 'http://localhost:4000/graphql';
    // Remove /graphql suffix to get base URL
    return graphqlUrl.replace('/graphql', '');
  };

  const handleOAuth = (provider: Provider) => {
    if (onProviderClick) {
      onProviderClick(provider);
    } else {
      // Redirect to backend OAuth endpoint
      const backendUrl = getBackendUrl();
      window.location.href = `${backendUrl}/auth/${provider}`;
    }
  };

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        disabled={isBusy}
        onClick={() => handleOAuth('google')}
        className="w-full justify-center gap-2 border-white/15 bg-white/5 text-white/80 shadow-sm transition hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-60"
      >
        {isGoogleLoading ? <Spinner /> : <GoogleIcon />}
        {isGoogleLoading ? 'Connexion en cours...' : 'Continuer avec Google'}
      </Button>
      <Button
        type="button"
        variant="outline"
        disabled={isBusy}
        onClick={() => handleOAuth('github')}
        className="w-full justify-center gap-2 border-white/15 bg-white/5 text-white/80 shadow-sm transition hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-60"
      >
        {isGithubLoading ? <Spinner /> : <GitHubIcon />}
        {isGithubLoading ? 'Connexion en cours...' : 'Continuer avec GitHub'}
      </Button>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M12 2a10 10 0 0 1 10 10h-3a7 7 0 0 0-7-7z" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.25.82-.56 0-.28-.02-1.2-.02-2.18-3.02.55-3.8-.74-4.05-1.41-.14-.36-.74-1.41-1.27-1.7-.43-.23-1.04-.8-.01-.82.97-.02 1.66.9 1.89 1.27 1.11 1.86 2.89 1.34 3.6 1.02.11-.82.43-1.34.78-1.64-2.67-.3-5.46-1.34-5.46-5.95 0-1.31.46-2.38 1.23-3.22-.12-.3-.54-1.52.12-3.16 0 0 1-.32 3.3 1.23.96-.27 1.98-.4 3-.4s2.05.14 3 .4c2.3-1.56 3.3-1.23 3.3-1.23.66 1.64.24 2.86.12 3.16.77.84 1.23 1.91 1.23 3.22 0 4.63-2.8 5.65-5.47 5.95.44.38.82 1.11.82 2.25 0 1.62-.02 2.93-.02 3.34 0 .31.22.68.82.56A12 12 0 0 0 12 .5Z"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
