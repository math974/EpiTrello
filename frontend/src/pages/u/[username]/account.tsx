import { useMemo } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shadcn/ui/card';
import { Button } from '@/components/shadcn/ui/button';
import { Input } from '@/components/shadcn/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shadcn/ui/tabs';

const DEFAULT_USERNAME = 'utilisateur';

export default function AccountSettingsPage() {
  const router = useRouter();
  const username = useMemo(() => {
    const value = router.query.username;
    if (typeof value === 'string' && value.trim().length > 0) return value;
    return DEFAULT_USERNAME;
  }, [router.query.username]);

  return (
    <div className="min-h-screen bg-trello-bg-light">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-trello-gray">Compte</p>
            <h1 className="text-2xl font-semibold text-trello-navy">{username}</h1>
          </div>
          <Link href="/boards" className="text-sm font-medium text-trello-blue hover:underline">
            Retour aux tableaux
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-6 py-8 md:grid-cols-[240px,1fr]">
        <aside className="space-y-2">
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.25em] text-trello-gray">Navigation</p>
            <nav className="mt-4 space-y-2 text-sm">
              <a className="block rounded-lg bg-trello-bg-gray px-3 py-2 font-medium text-trello-navy" href="#profile">
                Profil et visibilite
              </a>
              <a className="block rounded-lg px-3 py-2 text-trello-gray hover:bg-trello-bg-gray" href="#activity">
                Activite
              </a>
              <a className="block rounded-lg px-3 py-2 text-trello-gray hover:bg-trello-bg-gray" href="#settings">
                Parametres
              </a>
            </nav>
          </div>
          <div className="rounded-xl border border-dashed border-gray-200 p-4 text-xs text-trello-gray">
            Votre profil public et vos preferences de compte sont geres ici.
          </div>
        </aside>

        <section className="space-y-6">
          <Tabs defaultValue="profile">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">Profil</TabsTrigger>
              <TabsTrigger value="activity">Activite</TabsTrigger>
              <TabsTrigger value="settings">Parametres</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" id="profile" className="space-y-6">
              <Card>
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
            </TabsContent>

            <TabsContent value="activity" id="activity" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Activite recente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-trello-gray">
                  <div className="rounded-lg bg-trello-bg-gray px-3 py-2">Vous avez cree un tableau "Projet mobile".</div>
                  <div className="rounded-lg bg-trello-bg-gray px-3 py-2">Vous avez deplace une carte vers "Fait".</div>
                  <div className="rounded-lg bg-trello-bg-gray px-3 py-2">Vous avez invite une equipe.</div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" id="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Parametres du compte</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>
      </main>
    </div>
  );
}
