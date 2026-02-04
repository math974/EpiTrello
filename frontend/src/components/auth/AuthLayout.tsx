import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/shadcn/ui/card';

type AuthLayoutProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export default function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(14,165,233,0.35),_rgba(15,23,42,0))]" />
      <div className="pointer-events-none absolute -bottom-32 right-[-6rem] h-80 w-80 rounded-full bg-[radial-gradient(circle,_rgba(16,185,129,0.25),_rgba(15,23,42,0))]" />
      <div className="pointer-events-none absolute left-6 top-24 hidden h-64 w-64 rounded-full bg-[radial-gradient(circle,_rgba(99,102,241,0.2),_rgba(15,23,42,0))] md:block" />

      <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md animate-in fade-in duration-700">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/30">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                <rect x="3" y="3" width="7" height="18" rx="1.5" />
                <rect x="14" y="3" width="7" height="11" rx="1.5" />
              </svg>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">EpiTrello</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-white/70">{subtitle}</p>}
          </div>

          <Card className="border-white/10 bg-white/5 shadow-2xl shadow-slate-950/60 backdrop-blur">
            <CardContent className="p-6">{children}</CardContent>
          </Card>

          {footer && <div className="mt-6 text-center text-sm text-white/60">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
