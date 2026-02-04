import Link from 'next/link';
import OAuthButtons from './OAuthButtons';
import { Button } from '@/components/shadcn/ui/button';
import { Input } from '@/components/shadcn/ui/input';
import { Separator } from '@/components/shadcn/ui/separator';

type LoginErrorState = 'none' | 'invalid' | 'network';

type LoginFormProps = {
  errorState?: LoginErrorState;
  oauthLoadingProvider?: 'github' | 'discord' | null;
};

export default function LoginForm({ errorState = 'none', oauthLoadingProvider = null }: LoginFormProps) {
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
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white/80">Email</label>
          <Input
            type="email"
            placeholder="vous@exemple.com"
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
            className={`mt-1 bg-white/10 text-white placeholder:text-white/40 border-white/10 focus-visible:ring-sky-300 ${
              fieldErrors.password ? 'border-red-300 focus-visible:ring-red-200' : ''
            }`}
          />
          {fieldErrors.password && <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>}
        </div>
        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-sky-300 to-emerald-300 text-slate-950 shadow-lg shadow-emerald-500/30 hover:-translate-y-0.5"
        >
          Se connecter
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
