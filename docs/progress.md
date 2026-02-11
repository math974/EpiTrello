# EpiTrello - Progress Log

> Running record of implemented features, stack choices, and key changes. Update after each feature/merge.

## Tech Stack
- Frontend: Next.js (pages router) + TypeScript
- Styling: Tailwind CSS
- UI kit: shadcn/ui (components in `frontend/src/components/shadcn/ui`)
- GraphQL client: Apollo Client

## Frontend Features (Implemented)

### Auth UI (Login/Signup)
- Separate pages: `/login` and `/signup`
- Auth layout component + public routing
- UI forms with shadcn Button/Input/Card/Separator
- OAuth buttons (GitHub + Discord)
- Visual style aligned with landing page (dark theme)
- OAuth loading states (controlled via props)
- Error UI (banner + inline errors)
- Query toggles for demo/testing:
  - `/login?error=invalid|network`
  - `/signup?error=invalid|network|exists`
  - `/login?oauth=github|discord`
  - `/signup?oauth=github|discord`

### Landing Page
- Trello-style landing page on `/`
- Kanban moved to `/boards`
- Sticky header on landing page
- Background gradients + hero/feature/workflow/CTA sections

### Account Settings Page
- Route: `/u/[username]/account`
- Default username when missing
- Sections: Profile & Visibility, Activity, Settings, Accessibility
- Left navigation (hash-based) with active state
- Settings: change email + password + danger zone (delete account)
- Accessibility: language selector (more to add later)
- Accessibility: text size selector (small/standard/large)
- Settings: appearance selector (Light/Dark/System)

## Branches / PRs (Key)
- `feature/auth-login-signup-ui` -> merged
- `feature/auth-oauth-buttons` -> merged
- `feature/auth-error-empty-ui` -> merged
- `feature/landing-page` -> merged
- `feature/account-settings` -> PR #74 (open)
- `feature/accessibilite` -> PR #101 (open)
- `feature/auth-visual-align` -> PR #103 (open)
- `feature/account-settings` -> issue #104 (appearance selector)
- `docs/progress` -> this doc

## Notes
- shadcn components live in `frontend/src/components/shadcn/ui`
- Auth pages and landing page use shadcn + Tailwind
- Landing page uses Space Grotesk font (imported in `frontend/src/styles/globals.css`)
