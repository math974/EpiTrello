import { Button } from '@/components/shadcn/ui/button';

export default function OAuthButtons() {
  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        className="w-full justify-center gap-2 border-slate-300 bg-white/70 text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-900 hover:bg-slate-900 hover:text-white"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.25.82-.56 0-.28-.02-1.2-.02-2.18-3.02.55-3.8-.74-4.05-1.41-.14-.36-.74-1.41-1.27-1.7-.43-.23-1.04-.8-.01-.82.97-.02 1.66.9 1.89 1.27 1.11 1.86 2.89 1.34 3.6 1.02.11-.82.43-1.34.78-1.64-2.67-.3-5.46-1.34-5.46-5.95 0-1.31.46-2.38 1.23-3.22-.12-.3-.54-1.52.12-3.16 0 0 1-.32 3.3 1.23.96-.27 1.98-.4 3-.4s2.05.14 3 .4c2.3-1.56 3.3-1.23 3.3-1.23.66 1.64.24 2.86.12 3.16.77.84 1.23 1.91 1.23 3.22 0 4.63-2.8 5.65-5.47 5.95.44.38.82 1.11.82 2.25 0 1.62-.02 2.93-.02 3.34 0 .31.22.68.82.56A12 12 0 0 0 12 .5Z"
          />
        </svg>
        Continuer avec GitHub
      </Button>
      <Button
        type="button"
        variant="outline"
        className="w-full justify-center gap-2 border-slate-300 bg-white/70 text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-900 hover:bg-gradient-to-r hover:from-slate-900 hover:via-slate-800 hover:to-blue-900 hover:text-white"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M20.32 4.9a19.8 19.8 0 0 0-4.87-1.5c-.2.36-.43.85-.6 1.23a18.5 18.5 0 0 0-5.7 0c-.17-.38-.4-.87-.6-1.23a19.7 19.7 0 0 0-4.87 1.5A20.3 20.3 0 0 0 .5 17.9c1.8 1.33 3.54 2.13 5.25 2.66.43-.6.82-1.25 1.12-1.93-.6-.22-1.16-.5-1.7-.84l.4-.3c3.27 1.5 6.83 1.5 10.07 0l.4.3c-.54.34-1.1.62-1.7.84.3.68.69 1.33 1.12 1.93 1.71-.53 3.45-1.33 5.25-2.66A20.3 20.3 0 0 0 20.32 4.9ZM8.5 14.6c-1 0-1.83-.92-1.83-2.05 0-1.13.8-2.05 1.83-2.05s1.83.92 1.83 2.05c0 1.13-.8 2.05-1.83 2.05Zm7 0c-1 0-1.83-.92-1.83-2.05 0-1.13.8-2.05 1.83-2.05s1.83.92 1.83 2.05c0 1.13-.8 2.05-1.83 2.05Z"
          />
        </svg>
        Continuer avec Discord
      </Button>
    </div>
  );
}
