import { useEffect, useState } from 'react';
import { WorkspaceModel, WorkspaceMemberModel } from '../../generated/graphql';
import { addWorkspaceMember, removeWorkspaceMember, getWorkspace } from '@/lib/workspacesClient';
import { FiX, FiTrash2, FiUserPlus } from 'react-icons/fi';
import { useAuth } from '@/components/auth/AuthProvider';

type ManageWorkspaceMembersModalProps = {
  isOpen: boolean;
  onClose: () => void;
  workspace: WorkspaceModel;
  onWorkspaceUpdate?: (workspace: WorkspaceModel) => void;
};

export default function ManageWorkspaceMembersModal({
  isOpen,
  onClose,
  workspace,
  onWorkspaceUpdate,
}: ManageWorkspaceMembersModalProps) {
  const { user } = useAuth();
  const [members, setMembers] = useState<WorkspaceMemberModel[]>(workspace.members || []);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMembers(workspace.members || []);
      setEmail('');
      setError(null);
      // Refresh workspace data when modal opens
      refreshWorkspace();
    }
  }, [isOpen, workspace.id]);

  const refreshWorkspace = async () => {
    try {
      setIsLoading(true);
      const updated = await getWorkspace(workspace.id);
      if (updated) {
        setMembers(updated.members || []);
        if (onWorkspaceUpdate) {
          onWorkspaceUpdate(updated);
        }
      }
    } catch (err: any) {
      console.error('Error refreshing workspace:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setIsAdding(true);
      await addWorkspaceMember(workspace.id, email.trim());
      setEmail('');
      await refreshWorkspace();
    } catch (err: any) {
      setError(err.message || 'Failed to add member');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (isRemoving) return;

    try {
      setIsRemoving(userId);
      await removeWorkspaceMember(workspace.id, userId);
      await refreshWorkspace();
    } catch (err: any) {
      setError(err.message || 'Failed to remove member');
      setIsRemoving(null);
    }
  };

  const handleClose = () => {
    if (isAdding || isRemoving) return;
    setEmail('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  const isOwner = workspace.ownerId === user?.id;
  const canManageMembers = isOwner; // Only workspace owner can manage members

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={handleClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-trello-navy">Manage Members</h2>
            <button
              onClick={handleClose}
              disabled={isAdding || isRemoving}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Close"
            >
              <FiX size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            {error && (
              <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Add Member Form */}
            {canManageMembers && (
              <form onSubmit={handleAddMember} className="mb-6">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError(null);
                      }}
                      placeholder="Enter email address"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-trello-blue focus:ring-2 focus:ring-trello-blue/40"
                      disabled={isAdding || isRemoving}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isAdding || isRemoving || !email.trim()}
                    className="flex items-center gap-2 rounded-md bg-trello-blue px-4 py-2 text-sm font-semibold text-white hover:bg-trello-blue-dark disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAdding && (
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    <FiUserPlus size={16} />
                    {isAdding ? 'Adding...' : 'Add Member'}
                  </button>
                </div>
              </form>
            )}

            {/* Members List */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-trello-navy">
                Members ({members.length})
              </h3>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg py-2 px-3">
                      <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-gray-200" />
                      <div className="flex-1">
                        <div className="h-4 w-32 animate-pulse rounded bg-gray-200 mb-1" />
                        <div className="h-3 w-48 animate-pulse rounded bg-gray-200" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : members.length === 0 ? (
                <p className="py-4 text-center text-sm text-gray-500">No members yet</p>
              ) : (
                <div className="space-y-2">
                  {members.map((member) => {
                    const isCurrentUser = member.userId === user?.id;
                    const isMemberOwner = member.role === 'OWNER';
                    const canRemove = canManageMembers && !isCurrentUser && !isMemberOwner;

                    return (
                      <div
                        key={member.userId}
                        className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-pink-500 text-white font-semibold text-sm">
                            {member.user?.username?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-trello-navy">
                                {member.user?.username || 'Unknown User'}
                                {isCurrentUser && (
                                  <span className="ml-2 text-xs text-gray-500">(You)</span>
                                )}
                              </p>
                              {isMemberOwner && (
                                <span className="rounded-full bg-trello-blue px-2 py-0.5 text-xs font-semibold text-white">
                                  Owner
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">{member.user?.email || 'No email'}</p>
                          </div>
                        </div>
                        {canRemove && (
                          <button
                            onClick={() => handleRemoveMember(member.userId)}
                            disabled={isRemoving === member.userId || isRemoving !== null}
                            className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Remove member"
                          >
                            {isRemoving === member.userId && (
                              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            )}
                            <FiTrash2 size={16} />
                            {isRemoving === member.userId ? 'Removing...' : 'Remove'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-6 py-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isAdding || isRemoving}
              className="rounded-md border border-gray-200 px-4 py-2 text-sm text-trello-gray hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

