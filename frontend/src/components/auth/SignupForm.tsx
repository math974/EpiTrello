import Link from 'next/link';
import OAuthButtons from './OAuthButtons';
import { Button } from '@/components/shadcn/ui/button';
import { Input } from '@/components/shadcn/ui/input';
import { Separator } from '@/components/shadcn/ui/separator';

type SignupFormProps = {
  oauthLoadingProvider?: 'github' | 'discord' | null;
};

export default function SignupForm({ oauthLoadingProvider = null }: SignupFormProps) {
  return (
    <div className="space-y-6">
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-trello-navy">Nom</label>
          <Input
            type="text"
            placeholder="Votre nom"
            className="mt-1 bg-white/80"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-trello-navy">Email</label>
          <Input
            type="email"
            placeholder="vous@exemple.com"
            className="mt-1 bg-white/80"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-trello-navy">Mot de passe</label>
          <Input
            type="password"
            placeholder="••••••••"
            className="mt-1 bg-white/80"
          />
        </div>
        <Button
          type="submit"
          className="w-full bg-trello-blue text-white shadow-lg shadow-blue-200/70 hover:-translate-y-0.5 hover:bg-trello-blue-dark"
        >
          Créer un compte
        </Button>
      </form>

      <div className="relative">
        <Separator />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="bg-background px-2 text-xs uppercase text-trello-gray">Ou</span>
        </div>
      </div>

      <OAuthButtons loadingProvider={oauthLoadingProvider} />

      <div className="text-center text-sm text-trello-gray">
        Deja un compte ?{' '}
        <Link href="/login" className="text-trello-blue hover:underline">
          Se connecter
        </Link>
      </div>
    </div>
  );
}
