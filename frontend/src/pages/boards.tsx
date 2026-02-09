import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import { useAuth } from '../components/auth/AuthProvider';

// Disable static generation for this page (requires authentication)
export const getServerSideProps = async () => {
  return {
    props: {},
  };
};

const RECENT_BOARDS = [
  { id: 'board-1', name: 'Lancement mobile' },
  { id: 'board-2', name: 'Roadmap produit' },
];

const FAVORITE_BOARDS = [
  { id: 'board-9', name: 'Backlog prioritaire' },
  { id: 'board-10', name: 'Design review' },
];

const WORKSPACE_LIST = [
  { id: 'workspace-1', name: 'Epitech' },
  { id: 'workspace-2', name: 'Side project' },
  { id: 'workspace-3', name: 'Clients' },
];

const WORKSPACE_BOARDS: Record<string, { id: string; name: string }[]> = {
  'workspace-1': [
    { id: 'board-3', name: 'Design system' },
    { id: 'board-4', name: 'Sprint croissance' },
  ],
  'workspace-2': [
    { id: 'board-5', name: 'Ops & outils' },
    { id: 'board-6', name: 'Roadmap Q2' },
  ],
  'workspace-3': [
    { id: 'board-7', name: 'Client A' },
    { id: 'board-8', name: 'Client B' },
  ],
};

const WORKSPACE_COLLABORATORS: Record<
  string,
  { id: string; name: string; email: string; role: 'Admin' | 'Membre'; isMe?: boolean; boards: string[] }[]
> = {
  'workspace-1': [
    { id: 'collab-1', name: 'Hasnain', email: 'hasnain@epitrello.com', role: 'Admin', isMe: true, boards: ['Design system', 'Sprint croissance'] },
    { id: 'collab-2', name: 'Sarah', email: 'sarah@epitrello.com', role: 'Admin', boards: ['Design system'] },
    { id: 'collab-3', name: 'Mathieu', email: 'math@epitrello.com', role: 'Membre', boards: ['Sprint croissance'] },
  ],
  'workspace-2': [
    { id: 'collab-4', name: 'Ali', email: 'ali@epitrello.com', role: 'Admin', boards: ['Ops & outils', 'Roadmap Q2'] },
  ],
  'workspace-3': [
    { id: 'collab-5', name: 'Nina', email: 'nina@epitrello.com', role: 'Admin', boards: ['Client A'] },
  ],
};

export default function BoardsPage() {
  const router = useRouter();
  const { user, loading, checkAuth } = useAuth();
  const [activePanel, setActivePanel] = useState<'tableaux' | { workspaceId: string; view: 'boards' | 'members' | 'settings' } | null>('tableaux');
  const [openWorkspaces, setOpenWorkspaces] = useState<string[]>([]);
  const [openWorkspaceBoards, setOpenWorkspaceBoards] = useState<string[]>([]);

  // Check authentication on mount and attempt refresh if needed
  useEffect(() => {
    const verifyAuth = async () => {
      if (!loading) {
        // If no user, try to refresh auth (might have valid refresh token cookie)
        if (!user) {
          await checkAuth();
        }
      }
    };

    verifyAuth();
  }, [loading, user, checkAuth]);

  // Redirect to login if not authenticated after checking
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-sky-300 border-t-transparent mx-auto" />
          <p className="text-sm text-white/70">Verification de l'authentification...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  const toggleWorkspace = (workspaceId: string) => {
    setOpenWorkspaces((prev) =>
      prev.includes(workspaceId) ? prev.filter((id) => id !== workspaceId) : [...prev, workspaceId]
    );
  };

  const toggleWorkspaceBoards = (workspaceId: string) => {
    setOpenWorkspaceBoards((prev) =>
      prev.includes(workspaceId) ? prev.filter((id) => id !== workspaceId) : [...prev, workspaceId]
    );
  };
  return (
    <div className="min-h-screen bg-trello-bg-light">
      <Navbar />

      <main className="mx-auto grid max-w-6xl gap-6 px-6 py-8 md:grid-cols-[260px,1fr]">
        <aside className="space-y-6">
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <button
              type="button"
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                activePanel === 'tableaux'
                  ? 'bg-trello-bg-gray text-trello-navy'
                  : 'text-trello-gray hover:bg-trello-bg-gray hover:text-trello-navy'
              }`}
              onClick={() => setActivePanel(activePanel === 'tableaux' ? null : 'tableaux')}
            >
              <span className="text-xs font-semibold uppercase tracking-[0.3em]">Tableaux</span>
            </button>
          </div>

          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="px-3 text-xs font-semibold uppercase tracking-[0.3em] text-trello-gray/70">Workspaces</p>
            <div className="mt-3 space-y-2 text-sm">
              {WORKSPACE_LIST.map((workspace) => {
                const isOpen = openWorkspaces.includes(workspace.id);
                const isActiveWorkspace =
                  activePanel !== null && typeof activePanel === 'object' && activePanel.workspaceId === workspace.id;
                return (
                  <div key={workspace.id} className="space-y-1">
                    <button
                      type="button"
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left font-medium transition ${
                        isActiveWorkspace ? 'bg-trello-bg-gray text-trello-navy' : 'text-trello-gray hover:bg-trello-bg-gray hover:text-trello-navy'
                      }`}
                      onClick={() => toggleWorkspace(workspace.id)}
                    >
                      <span>{workspace.name}</span>
                      <span className="text-base">{isOpen ? '−' : '+'}</span>
                    </button>
                    {isOpen && (
                      <div className="ml-3 space-y-1">
                        <button
                          type="button"
                          className={`w-full rounded-lg px-3 py-2 text-left text-xs uppercase tracking-[0.2em] transition ${
                            isActiveWorkspace && activePanel.view === 'boards'
                              ? 'bg-trello-bg-gray text-trello-navy'
                              : 'text-trello-gray hover:bg-trello-bg-gray hover:text-trello-navy'
                          }`}
                          onClick={() => setActivePanel({ workspaceId: workspace.id, view: 'boards' })}
                        >
                          Tableaux
                        </button>
                        <button
                          type="button"
                          className={`w-full rounded-lg px-3 py-2 text-left text-xs uppercase tracking-[0.2em] transition ${
                            isActiveWorkspace && activePanel.view === 'members'
                              ? 'bg-trello-bg-gray text-trello-navy'
                              : 'text-trello-gray hover:bg-trello-bg-gray hover:text-trello-navy'
                          }`}
                          onClick={() => setActivePanel({ workspaceId: workspace.id, view: 'members' })}
                        >
                          Membres
                        </button>
                        <button
                          type="button"
                          className={`w-full rounded-lg px-3 py-2 text-left text-xs uppercase tracking-[0.2em] transition ${
                            isActiveWorkspace && activePanel.view === 'settings'
                              ? 'bg-trello-bg-gray text-trello-navy'
                              : 'text-trello-gray hover:bg-trello-bg-gray hover:text-trello-navy'
                          }`}
                          onClick={() => setActivePanel({ workspaceId: workspace.id, view: 'settings' })}
                        >
                          Parametres
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        <section className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-sm text-trello-gray">
          {activePanel === 'tableaux' ? (
            <div>
              {FAVORITE_BOARDS.length > 0 && (
                <div className="mb-6">
                  <p className="mb-3 text-sm font-semibold text-trello-navy">Favoris</p>
                  <ul className="space-y-2">
                    {FAVORITE_BOARDS.map((board) => (
                      <li key={board.id}>
                        <button
                          type="button"
                          className="w-full rounded-lg px-3 py-2 text-left text-trello-gray transition hover:bg-trello-bg-gray hover:text-trello-navy"
                          onClick={() => console.log('open board', board.id)}
                        >
                          {board.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="mb-3 text-sm font-semibold text-trello-navy">Recents</p>
              <ul className="space-y-2">
                {RECENT_BOARDS.map((board) => (
                  <li key={board.id}>
                    <button
                      type="button"
                      className="w-full rounded-lg px-3 py-2 text-left text-trello-gray transition hover:bg-trello-bg-gray hover:text-trello-navy"
                      onClick={() => console.log('open board', board.id)}
                    >
                      {board.name}
                    </button>
                  </li>
                ))}
              </ul>

              <div className="mt-6 space-y-4">
                {WORKSPACE_LIST.map((workspace) => (
                  <div key={workspace.id}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.3em] text-trello-gray transition hover:bg-trello-bg-gray"
                      onClick={() => toggleWorkspaceBoards(workspace.id)}
                    >
                      <span>{workspace.name}</span>
                      <span className="text-base">{openWorkspaceBoards.includes(workspace.id) ? '−' : '+'}</span>
                    </button>
                    {openWorkspaceBoards.includes(workspace.id) && (
                      <ul className="mt-2 space-y-2">
                        {(WORKSPACE_BOARDS[workspace.id] ?? []).map((board) => (
                          <li key={board.id}>
                            <button
                              type="button"
                              className="w-full rounded-lg px-3 py-2 text-left text-trello-gray transition hover:bg-trello-bg-gray hover:text-trello-navy"
                              onClick={() => console.log('open board', board.id)}
                            >
                              {board.name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : activePanel && typeof activePanel === 'object' ? (
            <div>
              <p className="mb-2 text-sm font-semibold text-trello-navy">Workspace</p>
              <p className="text-xs uppercase tracking-[0.3em] text-trello-gray">
                {WORKSPACE_LIST.find((workspace) => workspace.id === activePanel.workspaceId)?.name ?? 'Workspace'}
              </p>
              <div className="mt-4 rounded-xl bg-trello-bg-gray px-4 py-3 text-sm text-trello-gray">
                Vue: {activePanel.view === 'boards' ? 'Tableaux' : activePanel.view === 'members' ? 'Membres' : 'Parametres'}
              </div>
              {activePanel.view === 'members' && (
                <div className="mt-6 space-y-4 text-sm text-trello-gray">
                  <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-sm font-semibold text-trello-navy">Collaborateurs</p>
                    <p className="mt-2 text-xs text-trello-gray">
                      Liste des membres du workspace avec leurs acces.
                    </p>
                  </div>
                  <div className="space-y-3">
                    {(WORKSPACE_COLLABORATORS[activePanel.workspaceId] ?? []).map((collab) => (
                      <div key={collab.id} className="rounded-xl border border-gray-200 bg-white p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-trello-navy">{collab.name}</p>
                            <p className="text-xs text-trello-gray">{collab.email}</p>
                            <div className="mt-2 flex flex-wrap gap-2 text-xs text-trello-gray">
                              <span className="rounded-full bg-trello-bg-gray px-2 py-1">{collab.role}</span>
                              <span className="rounded-full bg-trello-bg-gray px-2 py-1">
                                Tableaux: {collab.boards.join(', ')}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button className="rounded-md border border-gray-200 px-3 py-2 text-xs text-trello-gray hover:bg-gray-50">
                              Voir les tableaux
                            </button>
                            <button className="rounded-md border border-red-200 px-3 py-2 text-xs text-red-700 hover:bg-red-50">
                              {collab.isMe ? 'Quitter' : 'Supprimer'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {activePanel.view === 'settings' && (
                <div className="mt-6 space-y-4 text-sm text-trello-gray">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold text-trello-navy">Nom du workspace</label>
                      <input
                        className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-trello-blue focus:ring-2 focus:ring-trello-blue/40"
                        defaultValue={
                          WORKSPACE_LIST.find((workspace) => workspace.id === activePanel.workspaceId)?.name ??
                          'Workspace'
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-trello-navy">Visibilite</label>
                      <select className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-trello-blue focus:ring-2 focus:ring-trello-blue/40">
                        <option>Prive</option>
                        <option>Espace de travail</option>
                        <option>Public</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center justify-end">
                    <button className="rounded-md bg-trello-blue px-4 py-2 text-sm font-semibold text-white hover:bg-trello-blue-dark">
                      Enregistrer
                    </button>
                  </div>
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-semibold">Zone dangereuse</p>
                        <p className="text-xs text-red-700">
                          Supprimer ce workspace effacera tous les tableaux associes. Action irreversible.
                        </p>
                      </div>
                      <button className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
                        Supprimer le workspace
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <span>Selectionnez “Tableaux” ou un workspace dans la colonne de gauche.</span>
          )}
        </section>
      </main>
    </div>
  );
}
