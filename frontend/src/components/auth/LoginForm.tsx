import { useState, FormEvent } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import OAuthButtons from './OAuthButtons';
import { Button } from '@/components/shadcn/ui/button';
import { Input } from '@/components/shadcn/ui/input';
import { Separator } from '@/components/shadcn/ui/separator';
import { login } from '@/lib/authClient';
import { useAuth } from './AuthProvider';

type LoginErrorState = 'none' | 'invalid' | 'network' | 'oauth';

type LoginFormProps = {
  errorState?: LoginErrorState;
  oauthLoadingProvider?: 'github' | 'discord' | null;
};

export default function LoginForm({ errorState: initialErrorState = 'none', oauthLoadingProvider = null }: LoginFormProps) {
  const router = useRouter();
  const { checkAuth } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errorState, setErrorState] = useState<LoginErrorState>(initialErrorState);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const errorBanner =
    errorState === 'network'
      ? 'Network unavailable. Check your connection and try again.'
      : errorState === 'invalid'
        ? 'Invalid email or password. Please try again.'
        : errorState === 'oauth'
          ? 'OAuth sign-in failed. Please try again.'
          : null;
  const fieldErrors = errorState === 'invalid'
    ? {
        email: 'Invalid email',
        password: 'Invalid password',
      }
    : {};

  return (
    <div className="space-y-6">
      {errorBanner && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {errorBanner}
        </div>
      )}
      <form
        className="space-y-4"
        onSubmit={async (e: FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          setIsLoading(true);
          setErrorState('none');

          try {
            // Call login mutation
            await login(formData.email, formData.password);

            // Token is already stored by login() function
            // Refresh auth state
            await checkAuth();

            // Redirect to /boards route
            await router.push('/boards');
          } catch (error: any) {
            setIsLoading(false);
            // Apollo puts 4xx/5xx response body in networkError.result.errors; graphQLErrors can be empty
            const gqlErrors =
              error?.networkError?.result?.errors ?? error?.graphQLErrors ?? [];
            const first = gqlErrors[0];
            const msg = (first?.message ?? error?.message ?? '').toLowerCase();
            const code = first?.extensions?.code ?? error?.extensions?.code;
            const statusCode =
              first?.extensions?.originalError?.statusCode ??
              first?.extensions?.status ??
              first?.extensions?.statusCode ??
              error?.networkError?.statusCode ??
              error?.statusCode;
            const isInvalidCredentials =
              code === 'UNAUTHORIZED' ||
              code === 'UNAUTHENTICATED' ||
              code === 'BAD_REQUEST' ||
              statusCode === 401 ||
              msg.includes('invalid credentials') ||
              msg.includes('unauthorized');
            if (isInvalidCredentials) {
              setErrorState('invalid');
            } else if (error?.networkError && gqlErrors.length === 0) {
              setErrorState('network');
            } else {
              console.error('Login error:', error);
              setErrorState('network');
            }
          }
        }}
      >
        <div>
          <label className="block text-sm font-medium text-white/80">Email</label>
          <Input
            type="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            disabled={isLoading}
            className={`mt-1 bg-white/10 text-white placeholder:text-white/40 border-white/10 focus-visible:ring-sky-300 ${
              fieldErrors.email ? 'border-red-300 focus-visible:ring-red-200' : ''
            }`}
          />
          {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-white/80">Password</label>
          <Input
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            disabled={isLoading}
            className={`mt-1 bg-white/10 text-white placeholder:text-white/40 border-white/10 focus-visible:ring-sky-300 ${
              fieldErrors.password ? 'border-red-300 focus-visible:ring-red-200' : ''
            }`}
          />
          {fieldErrors.password && <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>}
        </div>
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-sky-300 to-emerald-300 text-slate-950 shadow-lg shadow-emerald-500/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>

      <div className="relative">
        <Separator />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="bg-slate-950 px-2 text-xs uppercase text-white/50">Or</span>
        </div>
      </div>

      <OAuthButtons loadingProvider={oauthLoadingProvider} />
      <p className="text-center text-xs text-white/50">
        If your OAuth account already exists, you will be signed in automatically.
      </p>

      <div className="text-center text-sm text-white/60">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-sky-300 hover:underline">
          Create an account
        </Link>
      </div>
    </div>
  );
}
