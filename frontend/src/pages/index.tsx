import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';

const FEATURE_LIST = [
  {
    title: 'Tableaux clairs et visuels',
    description: 'Organisez vos projets avec des listes flexibles, des labels et des cartes riches.',
  },
  {
    title: 'Collaboration temps reel',
    description: 'Partagez un tableau et avancez ensemble avec une vision commune.',
  },
  {
    title: 'Flux de travail fluide',
    description: 'Passez de l idee au fait accompli avec une structure simple et efficace.',
  },
];

const STEPS = [
  {
    title: 'Creez un espace',
    description: 'Lancez un tableau en quelques secondes, puis invitez votre equipe.',
  },
  {
    title: 'Ajoutez vos cartes',
    description: 'Decoupez votre travail en taches claires, directement actionnables.',
  },
  {
    title: 'Faites avancer les projets',
    description: 'Glissez les cartes pour suivre la progression en un coup d oeil.',
  },
];

export default function LandingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Redirect to /boards if user is authenticated
  useEffect(() => {
    if (!loading && user) {
      router.replace('/boards');
    }
  }, [user, loading, router]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-sky-300 border-t-transparent mx-auto" />
          <p className="text-sm text-white/70">Chargement...</p>
        </div>
      </div>
    );
  }

  // Don't render landing page if user is authenticated (will redirect)
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(14,165,233,0.35),_rgba(15,23,42,0))]" />
        <div className="pointer-events-none absolute right-[-120px] top-32 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,_rgba(16,185,129,0.25),_rgba(15,23,42,0))]" />
        <div className="pointer-events-none absolute left-[-140px] bottom-[-120px] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,_rgba(99,102,241,0.2),_rgba(15,23,42,0))]" />

        <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="3" y="3" width="7" height="18" rx="1.5" />
                  <rect x="14" y="3" width="7" height="11" rx="1.5" />
                </svg>
              </div>
              <span className="text-lg font-semibold tracking-wide">EpiTrello</span>
            </div>

            <nav className="hidden items-center gap-8 text-sm text-white/70 md:flex">
              <Link href="#features" className="transition hover:text-white">Fonctionnalites</Link>
              <Link href="#workflow" className="transition hover:text-white">Workflow</Link>
              <Link href="#cta" className="transition hover:text-white">Commencer</Link>
            </nav>

            <div className="flex items-center gap-3 text-sm">
              <Link href="/login" className="text-white/70 transition hover:text-white">Se connecter</Link>
              <Link
                href="/signup"
                className="rounded-full bg-white px-4 py-2 font-semibold text-slate-950 shadow-lg shadow-white/20 transition hover:-translate-y-0.5"
              >
                Creer un compte
              </Link>
            </div>
          </div>
        </header>

        <main className="relative z-10">
          <section className="mx-auto flex max-w-6xl flex-col gap-12 px-6 pb-24 pt-16 md:flex-row md:items-center">
            <div className="flex-1 space-y-8 font-['Space_Grotesk',sans-serif] animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/70">
                Trello, repense pour Epitech
              </div>
              <h1 className="text-4xl font-semibold leading-tight text-white md:text-5xl">
                Votre projet avance mieux quand
                <span className="block bg-gradient-to-r from-sky-300 via-emerald-300 to-sky-100 bg-clip-text text-transparent">
                  tout le monde voit la meme chose.
                </span>
              </h1>
              <p className="max-w-xl text-base text-white/70 md:text-lg">
                EpiTrello rassemble vos idees, vos taches et vos equipes dans un espace clair.
                Creez des tableaux, organisez vos priorites et suivez chaque etape.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/signup"
                  className="rounded-full bg-gradient-to-r from-sky-300 to-emerald-300 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 transition hover:-translate-y-0.5"
                >
                  Demarrer gratuitement
                </Link>
              </div>
              <div className="flex items-center gap-6 text-xs uppercase tracking-[0.3em] text-white/50">
                <span>Planifier</span>
                <span>Prioriser</span>
                <span>Livrer</span>
              </div>
            </div>

            <div className="flex-1 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150">
              <div className="relative mx-auto max-w-md rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/60 backdrop-blur">
                <div className="mb-4 flex items-center justify-between text-sm text-white/70">
                  <span>Tableau: Lancement App</span>
                  <span className="rounded-full bg-emerald-400/20 px-2 py-1 text-xs text-emerald-200">Actif</span>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl bg-slate-900/80 p-4">
                    <p className="text-xs uppercase text-white/50">A faire</p>
                    <div className="mt-3 space-y-3">
                      <div className="rounded-xl bg-white/5 p-3 text-sm text-white/80">Brief produit</div>
                      <div className="rounded-xl bg-white/5 p-3 text-sm text-white/80">Design hero</div>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-slate-900/80 p-4">
                    <p className="text-xs uppercase text-white/50">En cours</p>
                    <div className="mt-3 space-y-3">
                      <div className="rounded-xl bg-white/5 p-3 text-sm text-white/80">Formulaire auth</div>
                      <div className="rounded-xl bg-white/5 p-3 text-sm text-white/80">Composants UI</div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-xs text-white/50">
                  Glisser-deposer pour mettre a jour le statut.
                </div>
              </div>
            </div>
          </section>

          <section id="features" className="mx-auto max-w-6xl px-6 pb-20">
            <div className="grid gap-6 md:grid-cols-3">
              {FEATURE_LIST.map((feature) => (
                <div key={feature.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm text-white/70">{feature.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="workflow" className="mx-auto max-w-6xl px-6 pb-24">
            <div className="grid gap-10 md:grid-cols-[1.1fr,1fr]">
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.4em] text-white/50">Workflow</p>
                <h2 className="text-3xl font-semibold">Tout le monde avance dans la meme direction.</h2>
                <p className="text-sm text-white/70">
                  Une vue claire, des actions rapides et des statuts visibles. EpiTrello simplifie la coordination
                  pour que votre equipe reste alignee.
                </p>
                <div className="flex flex-col gap-4">
                  {STEPS.map((step, index) => (
                    <div key={step.title} className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-semibold">
                        0{index + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold">{step.title}</h3>
                        <p className="text-sm text-white/70">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900/80 to-slate-800 p-8">
                <p className="text-xs uppercase text-white/60">Focus</p>
                <h3 className="mt-4 text-2xl font-semibold">Un espace qui inspire.</h3>
                <p className="mt-2 text-sm text-white/70">
                  Des cartes claires, des couleurs utiles, et une vision d ensemble pour chaque projet.
                </p>
                <div className="mt-6 space-y-3 text-sm text-white/70">
                  <div className="flex items-center justify-between">
                    <span>Roadmap marketing</span>
                    <span className="text-emerald-300">78%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10">
                    <div className="h-2 w-[78%] rounded-full bg-emerald-300" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Prototype mobile</span>
                    <span className="text-sky-300">56%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10">
                    <div className="h-2 w-[56%] rounded-full bg-sky-300" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section id="cta" className="mx-auto max-w-6xl px-6 pb-24">
            <div className="flex flex-col items-start justify-between gap-6 rounded-3xl border border-white/10 bg-gradient-to-r from-white/10 via-white/5 to-transparent p-8 md:flex-row md:items-center">
              <div>
                <h2 className="text-2xl font-semibold">Pret a structurer votre prochain projet ?</h2>
                <p className="mt-2 text-sm text-white/70">Creez votre tableau et commencez maintenant.</p>
              </div>
              <Link
                href="/signup"
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-white/20 transition hover:-translate-y-0.5"
              >
                Creer mon espace
              </Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
