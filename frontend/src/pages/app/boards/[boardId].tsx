import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/components/auth/AuthProvider';
import { getBoard, BoardModel, ListModel } from '@/lib/listsClient';
import ListsRow from '@/components/lists/ListsRow';
import ArchivedItemsDrawer from '@/components/boards/ArchivedItemsDrawer';
import CardModal from '@/components/cards/CardModal';
import { CardModel } from '@/lib/cardsClient';
import type { UserModel } from '@/generated/graphql';
import { FiArrowLeft, FiArchive } from 'react-icons/fi';

// Disable static generation for this page (requires authentication)
export const getServerSideProps = async () => {
  return {
    props: {},
  };
};

export default function BoardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { boardId } = router.query;
  const [board, setBoard] = useState<BoardModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isArchivedDrawerOpen, setIsArchivedDrawerOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CardModel | null>(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  // Fetch board data
  const fetchBoard = useCallback(async () => {
    if (!boardId || typeof boardId !== 'string') {
      console.log('[BoardPage] BoardId not ready:', boardId);
      return;
    }

    try {
      console.log('[BoardPage] Fetching board with id:', boardId);
      setLoading(true);
      setError(null);
      const data = await getBoard(boardId);
      console.log('[BoardPage] Board data received:', data);
      console.log('[BoardPage] Lists count:', data?.lists?.length || 0);
      setBoard(data);
      // Keep selectedCard in sync with fresh board data so modal shows up-to-date assignees
      setSelectedCard((prev) => {
        if (!prev || !data?.lists) return prev;
        const updated = data.lists.flatMap((l) => l.cards || []).find((c) => c.id === prev.id);
        return updated ?? prev;
      });
    } catch (err: any) {
      console.error('[BoardPage] Error fetching board:', err);
      setError(err.message || 'Failed to load board');
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  const handleAssigneesChange = useCallback((cardId: string, newAssignees: UserModel[]) => {
    setBoard((prev) => {
      if (!prev?.lists) return prev;
      return {
        ...prev,
        lists: prev.lists.map((list) => ({
          ...list,
          cards: (list.cards || []).map((c) =>
            c.id === cardId ? { ...c, assignees: newAssignees } : c
          ),
        })),
      };
    });
    setSelectedCard((prev) =>
      prev?.id === cardId ? { ...prev, assignees: newAssignees } : prev
    );
  }, []);

  useEffect(() => {
    console.log('[BoardPage] useEffect triggered - user:', !!user, 'boardId:', boardId, 'router.pathname:', router.pathname, 'router.asPath:', router.asPath);
    if (!user) {
      console.log('[BoardPage] No user, waiting...');
      return;
    }
    if (!boardId || typeof boardId !== 'string') {
      console.log('[BoardPage] BoardId not ready, waiting...');
      return;
    }
    console.log('[BoardPage] Fetching board...');
    fetchBoard();
  }, [user, boardId, fetchBoard, router]);

  // Show loading state while checking authentication or loading board
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '100vh', backgroundColor: '#f4f5f7' }}>
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-trello-blue border-t-transparent mx-auto" />
          <p className="text-sm text-trello-gray">Loading board...</p>
          {boardId && <p className="text-xs text-trello-gray mt-2">Board ID: {boardId}</p>}
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!user && !authLoading) {
    console.log('[BoardPage] No user and not loading, returning null');
    return null;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '100vh', backgroundColor: '#f4f5f7' }}>
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 max-w-md">
          <p className="text-sm text-red-600 mb-2">{error}</p>
          <button
            onClick={fetchBoard}
            className="text-sm text-trello-blue hover:underline font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '100vh', backgroundColor: '#f4f5f7' }}>
        <div className="text-center">
          <p className="text-trello-gray mb-4">Board not found</p>
          <button
            onClick={() => router.back()}
            className="text-sm text-trello-blue hover:underline font-medium"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  // Filter active lists (not archived) and sort by position
  const activeLists = (board.lists || [])
    .filter((list) => !list.archived)
    .sort((a, b) => a.position - b.position);

  const archivedLists = (board.lists || [])
    .filter((list) => list.archived)
    .sort((a, b) => (a.archivedPosition || 0) - (b.archivedPosition || 0));

  // Compute archived cards across all lists
  const archivedCards =
    (board.lists || [])
      .flatMap((list) =>
        (list.cards || [])
          .filter((card) => card.archived)
          .map((card) => ({
            ...card,
            listTitle: list.title,
          }))
      )
      // Sort by archivedPosition if present, otherwise by position
      .sort((a, b) => {
        const aPos = a.archivedPosition ?? a.position;
        const bPos = b.archivedPosition ?? b.position;
        return aPos - bPos;
      });

  console.log('[BoardPage] Active lists:', activeLists);
  console.log('[BoardPage] Archived lists:', archivedLists);
  console.log('[BoardPage] Rendering board page with board:', board.title);
  console.log('[BoardPage] Current URL:', router.asPath, 'Pathname:', router.pathname);

  return (
    <div className="h-full w-full min-h-0 p-4 flex flex-col">
      <div
        className="flex flex-col w-full flex-1 min-h-0 rounded-lg shadow-lg overflow-hidden"
        style={{ backgroundColor: board.background || '#0079bf' }}
      >
        {/* Board Header */}
        <div
          className="px-6 py-4 text-white shrink-0"
          style={{ backgroundColor: board.background || '#0079bf' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  if (board?.workspaceId) {
                    router.push(`/app/workspaces/${board.workspaceId}`);
                  } else {
                    router.back();
                  }
                }}
                className="p-2 rounded-md hover:bg-white/20 transition-colors"
                aria-label="Go back"
              >
                <FiArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-xl font-semibold">{board.title}</h1>
                {board.description && (
                  <p className="text-sm text-white/90 mt-1">{board.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsArchivedDrawerOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-md transition-colors text-sm font-medium"
              >
                <FiArchive size={18} />
                Archived ({archivedLists.length + archivedCards.length})
              </button>
              <div className="text-xs text-white/70">
                {activeLists.length} list{activeLists.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>

        {/* Lists Area - Kanban Board - fills remaining height to bottom */}
        <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto" style={{ backgroundColor: board.background || '#0079bf' }}>
          <div className="p-4">
            <ListsRow
              boardId={board.id}
              workspaceId={board.workspaceId}
              lists={activeLists}
              archivedLists={archivedLists}
              onBoardUpdate={fetchBoard}
              onCardClick={(card) => {
                setSelectedCard(card);
                setIsCardModalOpen(true);
              }}
            />
          </div>
        </div>
      </div>

      {/* Archived Items Drawer (Cards & Lists) */}
      <ArchivedItemsDrawer
        isOpen={isArchivedDrawerOpen}
        onClose={() => setIsArchivedDrawerOpen(false)}
        archivedLists={archivedLists}
        archivedCards={archivedCards}
        boardId={board.id}
        onUpdate={fetchBoard}
      />

      {/* Card Modal */}
      <CardModal
        isOpen={isCardModalOpen}
        card={selectedCard}
        boardId={board.id}
        workspaceId={board.workspaceId}
        onAssigneesChange={handleAssigneesChange}
        onClose={async () => {
          await fetchBoard();
          setIsCardModalOpen(false);
          setSelectedCard(null);
        }}
        onUpdate={async () => {
          await fetchBoard();
        }}
      />
    </div>
  );
}

