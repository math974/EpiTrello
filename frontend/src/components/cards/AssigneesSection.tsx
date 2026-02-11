import { useState, useEffect, useRef } from 'react';
import { UserModel, WorkspaceMemberModel } from '../../generated/graphql';
import { getWorkspace } from '@/lib/workspacesClient';
import { FiX, FiUserPlus } from 'react-icons/fi';

type AssigneesSectionProps = {
  cardId: string;
  assignees: UserModel[];
  workspaceId: string;
  onAssign: (userId: string) => Promise<void>;
  onUnassign: (userId: string) => Promise<void>;
  /** Called with new assignees list after assign/unassign success (optimistic UI, no refetch) */
  onAssigneesChange?: (newAssignees: UserModel[]) => void;
};

function AssigneeAvatar({
  assignee,
  onClick,
  className = '',
}: {
  assignee: UserModel;
  onClick: () => void;
  className?: string;
}) {
  const initial = (assignee.username || assignee.email || '?').charAt(0).toUpperCase();
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-8 h-8 rounded-full bg-trello-blue flex items-center justify-center text-white text-sm font-medium shrink-0 hover:ring-2 hover:ring-trello-blue hover:ring-offset-2 transition-shadow ${className}`}
      title={assignee.username || assignee.email || ''}
      aria-label={`Assignee: ${assignee.username || assignee.email}`}
    >
      {initial}
    </button>
  );
}

export default function AssigneesSection({
  cardId,
  assignees,
  workspaceId,
  onAssign,
  onUnassign,
  onAssigneesChange,
}: AssigneesSectionProps) {
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMemberModel[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [showMemberPicker, setShowMemberPicker] = useState(false);
  const [isAssigning, setIsAssigning] = useState<string | null>(null);
  const [profileOpenForId, setProfileOpenForId] = useState<string | null>(null);
  const profilePopoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showMemberPicker && workspaceId) {
      loadWorkspaceMembers();
    }
  }, [showMemberPicker, workspaceId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profilePopoverRef.current && !profilePopoverRef.current.contains(e.target as Node)) {
        setProfileOpenForId(null);
      }
    };
    if (profileOpenForId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [profileOpenForId]);

  const loadWorkspaceMembers = async () => {
    if (!workspaceId) return;

    setIsLoadingMembers(true);
    try {
      const workspace = await getWorkspace(workspaceId);
      if (workspace?.members) {
        setWorkspaceMembers(workspace.members);
      }
    } catch (error: any) {
      console.error('Error loading workspace members:', error);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const handleAssign = async (userId: string, addedUser?: UserModel) => {
    if (assignees.some((a) => a.id === userId)) return;
    setIsAssigning(userId);
    try {
      await onAssign(userId);
      if (onAssigneesChange && addedUser) {
        onAssigneesChange([...assignees, addedUser]);
      }
      setShowMemberPicker(false);
    } catch (error: any) {
      console.error('Error assigning user:', error);
    } finally {
      setIsAssigning(null);
    }
  };

  const handleUnassign = async (userId: string) => {
    setIsAssigning(userId);
    try {
      await onUnassign(userId);
      if (onAssigneesChange) {
        onAssigneesChange(assignees.filter((a) => a.id !== userId));
      }
      setProfileOpenForId(null);
    } catch (error: any) {
      console.error('Error unassigning user:', error);
    } finally {
      setIsAssigning(null);
    }
  };

  const assigneeIds = new Set(assignees.map((a) => a.id));
  const availableMembers = workspaceMembers.filter(
    (member) => !assigneeIds.has(member.userId)
  );
  const profileAssignee = profileOpenForId ? assignees.find((a) => a.id === profileOpenForId) : null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">Members</h3>
        <button
          onClick={() => setShowMemberPicker(!showMemberPicker)}
          className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
        >
          <FiUserPlus size={14} />
          Assign
        </button>
      </div>

      {/* Assignees: round avatars only; click opens profile card */}
      <div className="flex flex-wrap items-center gap-2">
        {assignees.map((assignee) => (
          <div key={assignee.id} className="relative" ref={profileOpenForId === assignee.id ? profilePopoverRef : undefined}>
            <AssigneeAvatar
              assignee={assignee}
              onClick={() => setProfileOpenForId(profileOpenForId === assignee.id ? null : assignee.id)}
            />
            {profileOpenForId === assignee.id && profileAssignee && (
              <div
                className="absolute left-0 top-full z-50 mt-2 w-56 rounded-lg border border-gray-200 bg-white shadow-lg p-4"
                style={{ minWidth: '14rem' }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-trello-blue flex items-center justify-center text-white text-lg font-medium shrink-0">
                    {(profileAssignee.username || profileAssignee.email || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {profileAssignee.username || '—'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {profileAssignee.email || '—'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleUnassign(profileAssignee.id)}
                  disabled={isAssigning === profileAssignee.id}
                  className="w-full flex items-center justify-center gap-2 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                >
                  {isAssigning === profileAssignee.id ? (
                    <span className="inline-block w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <FiX size={14} />
                      Remove from card
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Member Picker */}
      {showMemberPicker && (
        <div className="border border-gray-200 rounded-md p-3 bg-white shadow-sm mt-2">
          {isLoadingMembers ? (
            <div className="text-sm text-gray-500 text-center py-2">Loading members...</div>
          ) : availableMembers.length === 0 ? (
            <div className="text-sm text-gray-500 text-center py-2">
              {assignees.length > 0 ? 'All members are assigned' : 'No members available'}
            </div>
          ) : (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {availableMembers.map((member) => {
                const user = member.user;
                if (!user) return null;
                return (
                  <button
                    key={member.userId}
                    onClick={() => handleAssign(member.userId, user)}
                    disabled={isAssigning === member.userId}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-left hover:bg-gray-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-medium">
                      {(user.username || user.email || '').charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-gray-700 flex-1">
                      {user.username || user.email}
                    </span>
                    {isAssigning === member.userId && (
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
          <button
            onClick={() => setShowMemberPicker(false)}
            className="mt-2 w-full text-sm text-gray-600 hover:text-gray-800 py-1"
          >
            Cancel
          </button>
        </div>
      )}

      {assignees.length === 0 && !showMemberPicker && (
        <p className="text-sm text-gray-500">No members assigned</p>
      )}
    </div>
  );
}

