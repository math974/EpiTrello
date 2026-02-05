import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shadcn/ui/card';
import { Button } from '@/components/shadcn/ui/button';
import { Input } from '@/components/shadcn/ui/input';

const DEFAULT_USERNAME = 'utilisateur';

export default function AccountSettingsPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('profile');
  const [textSize, setTextSize] = useState<'sm' | 'md' | 'lg'>('md');
  const username = useMemo(() => {
    const value = router.query.username;
    if (typeof value === 'string' && value.trim().length > 0) return value;
    return DEFAULT_USERNAME;
  }, [router.query.username]);

  const containerTextSize = textSize === 'sm' ? 'text-sm' : textSize === 'lg' ? 'text-lg' : 'text-base';

  useEffect(() => {
    const updateActive = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'profile' || hash === 'activity' || hash === 'settings' || hash === 'accessibility') {
        setActiveSection(hash);
        return;
      }
      setActiveSection('profile');
    };

    updateActive();
    window.addEventListener('hashchange', updateActive);
    return () => window.removeEventListener('hashchange', updateActive);
  }, []);

  return (
    <div className={`min-h-screen bg-trello-bg-light ${containerTextSize}`}>
      <Navbar />

      <main className="mx-auto grid max-w-6xl gap-6 px-6 py-8 md:grid-cols-[240px,1fr]">
        <aside className="space-y-2">
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-trello-gray/70 whitespace-nowrap">Paramètres personnels</p>
            <nav className="mt-4 space-y-2 text-sm">
              <a
                className={`block rounded-lg px-3 py-2 font-medium ${
                  activeSection === 'profile'
                    ? 'bg-trello-bg-gray text-trello-navy'
                    : 'text-trello-gray hover:bg-trello-bg-gray'
                }`}
                href="#profile"
              >
                Profil et visibilité
              </a>
              <a
                className={`block rounded-lg px-3 py-2 ${
                  activeSection === 'activity'
                    ? 'bg-trello-bg-gray text-trello-navy font-medium'
                    : 'text-trello-gray hover:bg-trello-bg-gray'
                }`}
                href="#activity"
              >
                Activite
              </a>
              <a
                className={`block rounded-lg px-3 py-2 ${
                  activeSection === 'settings'
                    ? 'bg-trello-bg-gray text-trello-navy font-medium'
                    : 'text-trello-gray hover:bg-trello-bg-gray'
                }`}
                href="#settings"
              >
                Parametres
              </a>
              <a
                className={`block rounded-lg px-3 py-2 ${
                  activeSection === 'accessibility'
                    ? 'bg-trello-bg-gray text-trello-navy font-medium'
                    : 'text-trello-gray hover:bg-trello-bg-gray'
                }`}
                href="#accessibility"
              >
                Accessibilité
              </a>
            </nav>
          </div>
          <div className="rounded-xl border border-dashed border-gray-200 p-4 text-xs text-trello-gray">
            Votre profil public et vos preferences de compte sont geres ici.
          </div>
        </aside>

        <section className="space-y-6">
          {activeSection === 'profile' && (
            <Card id="profile">
              <CardHeader>
                <CardTitle>Profil et visibilite</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-trello-navy">Nom d utilisateur</label>
                    <Input className="mt-2" defaultValue={username} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-trello-navy">Email</label>
                    <Input className="mt-2" type="email" placeholder="vous@exemple.com" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-trello-navy">Bio</label>
                  <Input className="mt-2" placeholder="Parlez de vous en une phrase" />
                </div>
                <div className="flex justify-end">
                  <Button className="bg-trello-blue hover:bg-trello-blue-dark">Enregistrer</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'activity' && (
            <Card id="activity">
              <CardHeader>
                <CardTitle>Activite recente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-trello-gray">
                <div className="rounded-lg bg-trello-bg-gray px-3 py-2">Vous avez cree un tableau \"Projet mobile\".</div>
                <div className="rounded-lg bg-trello-bg-gray px-3 py-2">Vous avez deplace une carte vers \"Fait\".</div>
                <div className="rounded-lg bg-trello-bg-gray px-3 py-2">Vous avez invite une equipe.</div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'settings' && (
            <Card id="settings">
              <CardHeader>
                <CardTitle>Paramètres du compte</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-trello-navy">Email</label>
                  <Input className="mt-2" type="email" placeholder="Nouveau email" />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-trello-navy">Mot de passe</label>
                    <Input className="mt-2" type="password" placeholder="Nouveau mot de passe" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-trello-navy">Confirmation</label>
                    <Input className="mt-2" type="password" placeholder="Confirmez le mot de passe" />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  <span>Les changements sont uniquement visuels pour le moment.</span>
                  <Button variant="outline">Mettre a jour</Button>
                </div>
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-900">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold">Zone dangereuse</p>
                      <p className="text-xs text-red-700">
                        Supprimer votre compte effacera toutes vos donnees. Cette action est definitive.
                      </p>
                    </div>
                    <Button className="bg-red-600 text-white hover:bg-red-700">Supprimer le compte</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'accessibility' && (
            <Card id="accessibility">
              <CardHeader>
                <CardTitle>Accessibilite</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-trello-navy">Taille du texte</label>
                  <select
                    className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-trello-blue"
                    value={textSize}
                    onChange={(event) => {
                      const value = event.target.value as 'sm' | 'md' | 'lg';
                      setTextSize(value);
                    }}
                  >
                    <option value="sm">Petit</option>
                    <option value="md">Standard</option>
                    <option value="lg">Grand</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-trello-navy">Langue</label>
                  <select
                    className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-trello-blue"
                    defaultValue="fr"
                  >
                    <option value="fr">Francais</option>
                    <option value="en">English</option>
                    <option value="es">Espanol</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          )}
        </section>
      </main>
    </div>
  );
}
