import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Sidebar, Menu, MenuItem } from 'react-pro-sidebar';
import { useAuth } from '@/components/auth/AuthProvider';
import { myWorkspaces, createWorkspace, updateWorkspace, deleteWorkspace, WorkspaceModel } from '@/lib/workspacesClient';
import CreateWorkspaceModal from './CreateWorkspaceModal';
import EditWorkspaceModal from './EditWorkspaceModal';
import DeleteWorkspaceConfirmModal from './DeleteWorkspaceConfirmModal';
import WorkspaceListItem from './WorkspaceListItem';
import { FiPlus, FiChevronsLeft, FiChevronsRight, FiGrid, FiChevronDown, FiChevronUp } from 'react-icons/fi';

export default function WorkspaceSidebar() {
  const router = useRouter();
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<WorkspaceModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [workspacesExpanded, setWorkspacesExpanded] = useState(true);
  const [editingWorkspace, setEditingWorkspace] = useState<WorkspaceModel | null>(null);
  const [deletingWorkspace, setDeletingWorkspace] = useState<WorkspaceModel | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get selected workspace from URL
  const selectedWorkspaceId = router.query.workspaceId as string | undefined;

  // Update main content margin when sidebar collapses
  useEffect(() => {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.style.marginLeft = collapsed ? '80px' : '256px';
    }
  }, [collapsed]);

  // Fetch workspaces on mount
  useEffect(() => {
    if (!user) return;

    const fetchWorkspaces = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await myWorkspaces();
        setWorkspaces(data);

        // If no workspace selected and we have workspaces, redirect to first one
        if (!selectedWorkspaceId && data.length > 0 && router.pathname.startsWith('/app')) {
          router.replace(`/app/workspaces/${data[0].id}`);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load workspaces');
        console.error('Error fetching workspaces:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspaces();
  }, [user, selectedWorkspaceId, router]);

  const handleWorkspaceClick = (workspaceId: string) => {
    router.push(`/app/workspaces/${workspaceId}`);
  };

  const handleCreateWorkspace = async (name: string) => {
    try {
      setIsCreating(true);
      const newWorkspace = await createWorkspace(name);
      
      // Add to list
      setWorkspaces((prev) => [...prev, newWorkspace]);
      
      // Select and redirect to new workspace
      router.push(`/app/workspaces/${newWorkspace.id}`);
    } catch (err: any) {
      throw err; // Let modal handle the error
    } finally {
      setIsCreating(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    if (user) {
      myWorkspaces()
        .then((data) => {
          setWorkspaces(data);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message || 'Failed to load workspaces');
          setLoading(false);
        });
    }
  };

  const handleUpdateWorkspace = async (id: string, name: string) => {
    try {
      setIsUpdating(true);
      const updatedWorkspace = await updateWorkspace(id, name);
      setWorkspaces((prev) => prev.map((ws) => (ws.id === id ? updatedWorkspace : ws)));
      setEditingWorkspace(null);
    } catch (err: any) {
      throw err; // Let modal handle the error
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteWorkspace = async (id: string) => {
    try {
      setIsDeleting(true);
      await deleteWorkspace(id);
      setWorkspaces((prev) => prev.filter((ws) => ws.id !== id));
      
      // If deleted workspace was selected, redirect to first available or empty state
      if (selectedWorkspaceId === id) {
        const remaining = workspaces.filter((ws) => ws.id !== id);
        if (remaining.length > 0) {
          router.push(`/app/workspaces/${remaining[0].id}`);
        } else {
          router.push('/app');
        }
      }
      
      setDeletingWorkspace(null);
    } catch (err: any) {
      throw err; // Let modal handle the error
    } finally {
      setIsDeleting(false);
    }
  };

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

  return (
    <>
      <Sidebar
        collapsed={collapsed}
        width="256px"
        collapsedWidth="80px"
        backgroundColor="#1a202c"
        rootStyles={{
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          borderRight: '1px solid #374151',
        }}
      >
        {/* Header */}
        <div style={{ borderBottom: '1px solid #374151', padding: '1rem' }}>
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
            <div className="flex items-center gap-2">
              <svg className="w-7 h-7 text-trello-blue" viewBox="0 0 24 24" fill="currentColor">
                <rect x="3" y="3" width="7" height="18" rx="1.5" />
                <rect x="14" y="3" width="7" height="11" rx="1.5" />
              </svg>
              {!collapsed && <span className="font-bold text-lg text-white">EpiTrello</span>}
            </div>
            {!collapsed && (
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Collapse sidebar"
              >
                <FiChevronsLeft size={20} />
              </button>
            )}
          </div>
          {collapsed && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="w-full mt-2 flex justify-center text-gray-400 hover:text-white transition-colors"
              aria-label="Expand sidebar"
            >
              <FiChevronsRight size={20} />
            </button>
          )}
        </div>

        {/* Workspaces Section */}
        <div className="flex flex-col flex-1 overflow-hidden" style={{ height: 'calc(100vh - 140px)' }}>
          <div className="px-4 py-3 border-b border-gray-700">
            {!collapsed ? (
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setWorkspacesExpanded(!workspacesExpanded)}
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                  <h2 className="text-xs font-semibold uppercase tracking-wider">Workspaces</h2>
                  {workspacesExpanded ? (
                    <FiChevronDown size={16} />
                  ) : (
                    <FiChevronUp size={16} />
                  )}
                </button>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="Create workspace"
                >
                  <FiPlus size={18} />
                </button>
              </div>
            ) : (
              <div className="flex justify-center">
                <FiGrid size={20} className="text-gray-400" />
              </div>
            )}
          </div>

          {/* Workspaces List - Scrollable */}
          {workspacesExpanded && (
          <div className="flex-1 overflow-y-auto px-2 py-2">
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={`flex items-center gap-3 rounded-lg py-2 ${collapsed ? 'justify-center' : 'px-3'}`}>
                    <div className="h-8 w-8 shrink-0 animate-pulse rounded-md bg-gray-700" />
                    {!collapsed && <div className="h-4 w-full animate-pulse rounded bg-gray-700" />}
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className={`px-3 py-4 text-center ${collapsed ? 'px-2' : ''}`}>
                {!collapsed && (
                  <>
                    <p className="mb-2 text-xs text-red-400">{error}</p>
                    <button
                      onClick={handleRetry}
                      className="text-xs text-trello-blue hover:underline font-medium"
                    >
                      Retry
                    </button>
                  </>
                )}
                {collapsed && (
                  <button
                    onClick={handleRetry}
                    className="text-red-400 hover:text-red-300"
                    title="Retry"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                )}
              </div>
            ) : workspaces.length === 0 ? (
              <div className={`px-3 py-4 text-center ${collapsed ? 'px-2' : ''}`}>
                {!collapsed && (
                  <>
                    <p className="mb-2 text-xs text-gray-400">No workspace yet</p>
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="text-xs text-trello-blue hover:underline font-medium"
                    >
                      Create workspace
                    </button>
                  </>
                )}
                {collapsed && (
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="text-gray-400 hover:text-white"
                    title="Create workspace"
                  >
                    <FiPlus size={20} />
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                {workspaces.map((workspace) => (
                  <WorkspaceListItem
                    key={workspace.id}
                    workspace={workspace}
                    isSelected={workspace.id === selectedWorkspaceId}
                    isCollapsed={collapsed}
                    onClick={() => handleWorkspaceClick(workspace.id)}
                    onEdit={(ws) => setEditingWorkspace(ws)}
                    onDelete={(ws) => setDeletingWorkspace(ws)}
                  />
                ))}
              </div>
            )}
          </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #374151', padding: '0.5rem 1rem' }}>
          {!collapsed && (
            <p className="text-xs text-gray-500">v1.0.0</p>
          )}
        </div>
      </Sidebar>

      <CreateWorkspaceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateWorkspace}
        isLoading={isCreating}
      />

      <EditWorkspaceModal
        isOpen={editingWorkspace !== null}
        onClose={() => setEditingWorkspace(null)}
        onUpdate={handleUpdateWorkspace}
        workspace={editingWorkspace}
        isLoading={isUpdating}
      />

      <DeleteWorkspaceConfirmModal
        isOpen={deletingWorkspace !== null}
        onClose={() => setDeletingWorkspace(null)}
        onConfirm={handleDeleteWorkspace}
        workspace={deletingWorkspace}
        isLoading={isDeleting}
      />
    </>
  );
}
