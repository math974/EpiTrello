import { useState } from 'react';
import Navbar from '../components/Navbar';

const RECENT_BOARDS = [
  { id: 'board-1', name: 'Lancement mobile' },
  { id: 'board-2', name: 'Roadmap produit' },
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

export default function BoardsPage() {
  const [activePanel, setActivePanel] = useState<'tableaux' | { workspaceId: string; view: 'boards' | 'members' | 'settings' } | null>('tableaux');
  const [openWorkspaces, setOpenWorkspaces] = useState<string[]>([]);
  const [openWorkspaceBoards, setOpenWorkspaceBoards] = useState<string[]>([]);

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
            </div>
          ) : (
            <span>Selectionnez “Tableaux” ou un workspace dans la colonne de gauche.</span>
          )}
        </section>
      </main>
    </div>
  );
}
