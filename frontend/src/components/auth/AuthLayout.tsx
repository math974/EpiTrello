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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(0,121,191,0.18),_rgba(0,121,191,0))]" />
      <div className="pointer-events-none absolute -bottom-24 right-[-6rem] h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(16,185,129,0.16),_rgba(16,185,129,0))]" />
      <div className="pointer-events-none absolute left-6 top-24 hidden h-56 w-56 rounded-full bg-[radial-gradient(circle,_rgba(15,23,42,0.1),_rgba(15,23,42,0))] md:block" />

      <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md animate-in fade-in duration-700">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-trello-blue to-emerald-500 text-white shadow-lg shadow-emerald-200/70">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                <rect x="3" y="3" width="7" height="18" rx="1.5" />
                <rect x="14" y="3" width="7" height="11" rx="1.5" />
              </svg>
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-trello-gray">EpiTrello</p>
            <h1 className="mt-2 text-3xl font-semibold text-trello-navy">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-trello-gray">{subtitle}</p>}
          </div>

          <Card className="border-slate-200/70 bg-white/90 shadow-xl shadow-slate-200/60 backdrop-blur">
            <CardContent className="p-6">{children}</CardContent>
          </Card>

          {footer && <div className="mt-6 text-center text-sm text-trello-gray">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
