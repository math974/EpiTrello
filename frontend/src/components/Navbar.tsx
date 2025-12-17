import { useState, type ReactNode } from 'react';

export default function Navbar() {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <nav className="bg-gradient-to-r from-trello-blue-darker via-trello-blue-dark to-trello-blue h-12 flex items-center justify-between px-4 shadow-md">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 text-white">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <rect x="3" y="3" width="7" height="18" rx="1.5" />
            <rect x="14" y="3" width="7" height="11" rx="1.5" />
          </svg>
          <span className="font-bold text-xl tracking-tight">EpiTrello</span>
        </div>

        <div className="hidden md:flex items-center gap-1 ml-4">
          <NavButton>Espaces de travail</NavButton>
          <NavButton>Récent</NavButton>
          <NavButton>Favoris</NavButton>
        </div>

        <button className="ml-2 bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors">
          Créer
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center">
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher"
              className="bg-white/20 text-white placeholder-white/70 px-3 py-1.5 pl-8 rounded text-sm w-48 focus:w-64 focus:bg-white focus:text-trello-navy focus:placeholder-trello-gray transition-all outline-none"
            />
            <svg className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <button className="text-white/80 hover:text-white p-1.5 rounded hover:bg-white/20 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>

        <button className="text-white/80 hover:text-white p-1.5 rounded hover:bg-white/20 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-semibold text-sm hover:ring-2 hover:ring-white/50 transition-all"
          >
            U
          </button>

          {showProfileMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)} />
              <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-20 py-2">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-xs text-trello-gray uppercase tracking-wide">Compte</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white font-semibold">U</div>
                    <div>
                      <p className="font-medium text-trello-navy">Utilisateur</p>
                      <p className="text-sm text-trello-gray">user@epitrello.com</p>
                    </div>
                  </div>
                </div>
                <div className="py-1">
                  <MenuLink>Profil et visibilité</MenuLink>
                  <MenuLink>Activité</MenuLink>
                  <MenuLink>Cartes</MenuLink>
                  <MenuLink>Paramètres</MenuLink>
                </div>
                <div className="border-t border-gray-100 py-1">
                  <MenuLink>Se déconnecter</MenuLink>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

type ButtonProps = {
  children: ReactNode;
};

function NavButton({ children }: ButtonProps) {
  return (
    <button className="text-white/90 hover:text-white hover:bg-white/20 px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1">
      {children}
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
}

function MenuLink({ children }: ButtonProps) {
  return (
    <button className="w-full text-left px-4 py-2 text-sm text-trello-navy hover:bg-gray-100 transition-colors">
      {children}
    </button>
  );
}

