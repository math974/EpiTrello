import { useState, FormEvent } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import OAuthButtons from './OAuthButtons';
import { Button } from '@/components/shadcn/ui/button';
import { Input } from '@/components/shadcn/ui/input';
import { Separator } from '@/components/shadcn/ui/separator';
import { login } from '@/lib/authClient';
import { useAuth } from './AuthProvider';

type LoginErrorState = 'none' | 'invalid' | 'network';

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
      ? 'Reseau indisponible. Verifiez votre connexion et reessayez.'
      : errorState === 'invalid'
        ? 'Identifiants invalides. Verifiez votre email et mot de passe.'
        : null;
  const fieldErrors = errorState === 'invalid'
    ? {
        email: 'Email invalide',
        password: 'Mot de passe invalide',
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
            // Handle different error types
            if (error?.graphQLErrors && Array.isArray(error.graphQLErrors) && error.graphQLErrors.length > 0) {
              const gqlError = error.graphQLErrors[0];
              if (gqlError?.extensions?.code === 'UNAUTHORIZED' || gqlError?.extensions?.code === 'BAD_REQUEST') {
                setErrorState('invalid');
              } else {
                setErrorState('network');
              }
            } else if (error?.networkError) {
              setErrorState('network');
            } else {
              // Log error for debugging
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
            placeholder="vous@exemple.com"
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
          <label className="block text-sm font-medium text-white/80">Mot de passe</label>
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
          {isLoading ? 'Connexion en cours...' : 'Se connecter'}
        </Button>
      </form>

      <div className="relative">
        <Separator />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="bg-slate-950 px-2 text-xs uppercase text-white/50">Ou</span>
        </div>
      </div>

      <OAuthButtons loadingProvider={oauthLoadingProvider} />
      <p className="text-center text-xs text-white/50">
        Si votre compte OAuth existe deja, vous serez connecte automatiquement.
      </p>

      <div className="text-center text-sm text-white/60">
        Pas encore de compte ?{' '}
        <Link href="/signup" className="text-sky-300 hover:underline">
          Créer un compte
        </Link>
      </div>
    </div>
  );
}
