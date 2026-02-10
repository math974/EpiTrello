import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/components/auth/AuthProvider';
import { getWorkspace, WorkspaceModel } from '@/lib/workspacesClient';
import ManageWorkspaceMembersModal from '@/components/workspaces/ManageWorkspaceMembersModal';
import { FiUsers } from 'react-icons/fi';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);

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

  // Show loading state while checking authentication
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
          {canManageMembers && (
            <button
              onClick={() => setIsMembersModalOpen(true)}
              className="flex items-center gap-2 rounded-md bg-trello-blue px-4 py-2 text-sm font-semibold text-white hover:bg-trello-blue-dark transition-colors"
            >
              <FiUsers size={18} />
              Manage Members
            </button>
          )}
        </div>

        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
          <h2 className="mb-4 text-lg font-semibold text-trello-navy">Boards</h2>
          <p className="text-sm text-trello-gray">Boards will be displayed here.</p>
        </div>
      </div>

      {workspace && (
        <ManageWorkspaceMembersModal
          isOpen={isMembersModalOpen}
          onClose={() => setIsMembersModalOpen(false)}
          workspace={workspace}
          onWorkspaceUpdate={(updated) => setWorkspace(updated)}
        />
      )}
    </>
  );
}
