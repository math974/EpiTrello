import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/components/auth/AuthProvider';
import { getWorkspace, WorkspaceModel, leaveWorkspace, myWorkspaces } from '@/lib/workspacesClient';
import { workspaceBoards, createBoard, updateBoard, deleteBoard, BoardModel } from '@/lib/boardsClient';
import ManageWorkspaceMembersModal from '@/components/workspaces/ManageWorkspaceMembersModal';
import LeaveWorkspaceConfirmModal from '@/components/workspaces/LeaveWorkspaceConfirmModal';
import BoardGrid from '@/components/boards/BoardGrid';
import CreateBoardModal from '@/components/boards/CreateBoardModal';
import EditBoardModal from '@/components/boards/EditBoardModal';
import DeleteBoardConfirmModal from '@/components/boards/DeleteBoardConfirmModal';
import { FiUsers, FiPlus, FiLogOut } from 'react-icons/fi';

// Disable static generation for this page (requires authentication)
export const getServerSideProps = async () => {
  return {
    props: {},
  };
};

export default function WorkspacePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { workspaceId } = router.query;
  const [workspace, setWorkspace] = useState<WorkspaceModel | null>(null);
  const [boards, setBoards] = useState<BoardModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [boardsLoading, setBoardsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [boardsError, setBoardsError] = useState<string | null>(null);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isCreateBoardModalOpen, setIsCreateBoardModalOpen] = useState(false);
  const [isCreatingBoard, setIsCreatingBoard] = useState(false);
  const [isEditBoardModalOpen, setIsEditBoardModalOpen] = useState(false);
  const [isDeleteBoardModalOpen, setIsDeleteBoardModalOpen] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState<BoardModel | null>(null);
  const [isUpdatingBoard, setIsUpdatingBoard] = useState(false);
  const [isDeletingBoard, setIsDeletingBoard] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);

  // Fetch workspace data
  useEffect(() => {
    if (!user || !workspaceId || typeof workspaceId !== 'string') return;

    const fetchWorkspace = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getWorkspace(workspaceId);
        setWorkspace(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load workspace');
        console.error('Error fetching workspace:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspace();
  }, [user, workspaceId]);

  const fetchBoards = async () => {
    if (!workspaceId || typeof workspaceId !== 'string') return;

    try {
      setBoardsLoading(true);
      setBoardsError(null);
      const data = await workspaceBoards(workspaceId);
      setBoards(data);
    } catch (err: any) {
      setBoardsError(err.message || 'Failed to load boards');
      console.error('Error fetching boards:', err);
    } finally {
      setBoardsLoading(false);
    }
  };

  // Fetch boards data
  useEffect(() => {
    if (!user || !workspaceId || typeof workspaceId !== 'string') return;
    fetchBoards();
  }, [user, workspaceId]);

  const handleCreateBoard = async (title: string) => {
    if (!workspaceId || typeof workspaceId !== 'string') return;

    try {
      setIsCreatingBoard(true);
      const newBoard = await createBoard(workspaceId, title);
      setBoards((prev) => [newBoard, ...prev]);
      setIsCreateBoardModalOpen(false);
      // Navigate to the new board
      router.push(`/app/boards/${newBoard.id}`);
    } catch (err: any) {
      throw err;
    } finally {
      setIsCreatingBoard(false);
    }
  };

  const handleRetryBoards = () => {
    if (!workspaceId || typeof workspaceId !== 'string') return;
    fetchBoards();
  };

  const handleLeaveWorkspace = async (workspaceId: string) => {
    try {
      setIsLeaving(true);
      await leaveWorkspace(workspaceId);
      setIsLeaveModalOpen(false);
      
      // Redirect to first available workspace or home
      const workspaces = await myWorkspaces();
      if (workspaces.length > 0) {
        router.replace(`/app/workspaces/${workspaces[0].id}`);
      } else {
        router.replace('/app');
      }
    } catch (err: any) {
      console.error('Error leaving workspace:', err);
      throw err;
    } finally {
      setIsLeaving(false);
    }
  };

  const handleEditBoard = (board: BoardModel) => {
    setSelectedBoard(board);
    setIsEditBoardModalOpen(true);
  };

  const handleDeleteBoard = (board: BoardModel) => {
    setSelectedBoard(board);
    setIsDeleteBoardModalOpen(true);
  };

  const handleUpdateBoard = async (id: string, title: string, description?: string | null) => {
    if (!workspaceId || typeof workspaceId !== 'string' || !selectedBoard) return;

    try {
      setIsUpdatingBoard(true);
      await updateBoard(id, title, description, undefined, workspaceId);
      await fetchBoards();
      setIsEditBoardModalOpen(false);
      setSelectedBoard(null);
    } catch (err: any) {
      throw err;
    } finally {
      setIsUpdatingBoard(false);
    }
  };

  const handleDeleteBoardConfirm = async (id: string) => {
    if (!workspaceId || typeof workspaceId !== 'string' || !selectedBoard) return;

    try {
      setIsDeletingBoard(true);
      await deleteBoard(id, workspaceId);
      await fetchBoards();
      setIsDeleteBoardModalOpen(false);
      setSelectedBoard(null);
    } catch (err: any) {
      throw err;
    } finally {
      setIsDeletingBoard(false);
    }
  };

  // Show loading state while checking authentication or loading workspace
  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-trello-bg-light">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-trello-blue border-t-transparent mx-auto" />
          <p className="text-sm text-trello-gray">Loading workspace...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="p-6">
        <p className="text-trello-gray">Workspace not found</p>
      </div>
    );
  }

  const isOwner = workspace.ownerId === user.id;
  const canManageMembers = isOwner; // Only workspace owner can manage members
  const currentUserMember = workspace.members?.find((m) => m.userId === user.id);
  const isMember = !!currentUserMember;

  return (
    <>
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-2xl font-semibold text-trello-navy">{workspace.name}</h1>
            <p className="text-sm text-trello-gray">
              {workspace.members?.length || 0} member{workspace.members?.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canManageMembers && (
              <button
                onClick={() => setIsMembersModalOpen(true)}
                className="flex items-center gap-2 rounded-md bg-trello-blue px-4 py-2 text-sm font-semibold text-white hover:bg-trello-blue-dark transition-colors"
              >
                <FiUsers size={18} />
                Manage Members
              </button>
            )}
            {isMember && !isOwner && (
              <button
                onClick={() => setIsLeaveModalOpen(true)}
                className="flex items-center gap-2 rounded-md border border-orange-300 px-4 py-2 text-sm font-semibold text-orange-600 hover:bg-orange-50 transition-colors"
              >
                <FiLogOut size={18} />
                Leave Workspace
              </button>
            )}
          </div>
        </div>

        {/* Boards Section */}
        <div className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-trello-navy">Boards</h2>
            <button
              onClick={() => setIsCreateBoardModalOpen(true)}
              className="flex items-center gap-2 rounded-md bg-trello-blue px-4 py-2 text-sm font-semibold text-white hover:bg-trello-blue-dark transition-colors"
            >
              <FiPlus size={18} />
              Create board
            </button>
          </div>

          {boardsLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 w-full animate-pulse rounded-lg bg-gray-200" />
              ))}
            </div>
          ) : boardsError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-6 text-center">
              <p className="mb-2 text-sm text-red-600">{boardsError}</p>
              <button
                onClick={handleRetryBoards}
                className="text-sm text-trello-blue hover:underline font-medium"
              >
                Retry
              </button>
            </div>
          ) : (
            <BoardGrid
              boards={boards}
              onCreateBoard={() => setIsCreateBoardModalOpen(true)}
              onEditBoard={handleEditBoard}
              onDeleteBoard={handleDeleteBoard}
              canEdit={isOwner || !!currentUserMember}
            />
          )}
        </div>
      </div>

      {workspace && (
        <>
          <ManageWorkspaceMembersModal
            isOpen={isMembersModalOpen}
            onClose={() => setIsMembersModalOpen(false)}
            workspace={workspace}
            onWorkspaceUpdate={(updated) => setWorkspace(updated)}
          />
          <LeaveWorkspaceConfirmModal
            isOpen={isLeaveModalOpen}
            onClose={() => setIsLeaveModalOpen(false)}
            onConfirm={handleLeaveWorkspace}
            isLoading={isLeaving}
            workspace={workspace}
          />
          <CreateBoardModal
            isOpen={isCreateBoardModalOpen}
            onClose={() => setIsCreateBoardModalOpen(false)}
            onCreate={handleCreateBoard}
            isLoading={isCreatingBoard}
            workspaceName={workspace.name}
          />
          {selectedBoard && (
            <>
              <EditBoardModal
                isOpen={isEditBoardModalOpen}
                onClose={() => {
                  setIsEditBoardModalOpen(false);
                  setSelectedBoard(null);
                }}
                onUpdate={handleUpdateBoard}
                isLoading={isUpdatingBoard}
                board={selectedBoard}
              />
              <DeleteBoardConfirmModal
                isOpen={isDeleteBoardModalOpen}
                onClose={() => {
                  setIsDeleteBoardModalOpen(false);
                  setSelectedBoard(null);
                }}
                onConfirm={handleDeleteBoardConfirm}
                isLoading={isDeletingBoard}
                board={selectedBoard}
              />
            </>
          )}
        </>
      )}
    </>
  );
}
