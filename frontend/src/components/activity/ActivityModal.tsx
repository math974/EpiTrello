import { useState, useEffect, useCallback } from 'react';
import { FiX } from 'react-icons/fi';
import { myWorkspaces } from '@/lib/workspacesClient';
import { getWorkspaceActivity } from '@/lib/activitiesClient';
import { formatActivityMessage, formatActivityDate } from './formatActivityMessage';
import type { WorkspaceModel, ActivityFeedModel } from '../../generated/graphql';

type ActivityModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const LIMIT = 25;

export default function ActivityModal({ isOpen, onClose }: ActivityModalProps) {
  const [workspaces, setWorkspaces] = useState<WorkspaceModel[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [feed, setFeed] = useState<ActivityFeedModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWorkspaces = useCallback(async () => {
    try {
      const list = await myWorkspaces();
      setWorkspaces(list);
      if (list.length > 0 && !selectedWorkspaceId) {
        setSelectedWorkspaceId(list[0].id);
      }
    } catch (e) {
      console.error('Failed to load workspaces', e);
      setError('Failed to load workspaces.');
    }
  }, [selectedWorkspaceId]);

  const loadActivity = useCallback(
    async (cursor?: string | null, append = false) => {
      if (!selectedWorkspaceId) return;
      try {
        if (append) setLoadingMore(true);
        else setLoading(true);
        setError(null);
        const data = await getWorkspaceActivity(selectedWorkspaceId, LIMIT, cursor);
        setFeed((prev) => {
          if (append && prev) {
            return {
              activities: [...prev.activities, ...data.activities],
              hasMore: data.hasMore,
              nextCursor: data.nextCursor,
            };
          }
          return data;
        });
      } catch (e) {
        console.error('Failed to load activity', e);
        setError('Failed to load activity.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [selectedWorkspaceId]
  );

  useEffect(() => {
    if (isOpen) {
      loadWorkspaces();
    }
  }, [isOpen, loadWorkspaces]);

  useEffect(() => {
    if (isOpen && selectedWorkspaceId) {
      setFeed(null);
      loadActivity(null, false);
    }
  }, [isOpen, selectedWorkspaceId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLoadMore = () => {
    if (feed?.nextCursor && selectedWorkspaceId) {
      loadActivity(feed.nextCursor, true);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} aria-hidden="true" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200 shrink-0">
            <h2 className="text-lg font-semibold text-gray-900">Activity</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
              aria-label="Close"
            >
              <FiX size={20} />
            </button>
          </div>

          {workspaces.length > 0 && (
            <div className="px-4 pt-3 pb-2 border-b border-gray-100 shrink-0">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Workspace</label>
              <select
                value={selectedWorkspaceId ?? ''}
                onChange={(e) => setSelectedWorkspaceId(e.target.value || null)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {workspaces.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 min-h-0">
            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600 mb-4">
                {error}
              </div>
            )}

            {loading && !feed && (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-trello-blue border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!loading && workspaces.length === 0 && (
              <p className="text-sm text-gray-500 py-8 text-center">No workspace. Create a workspace to see activity.</p>
            )}

            {feed && !loading && feed.activities.length === 0 && (
              <p className="text-sm text-gray-500 py-8 text-center">No recent activity in this workspace.</p>
            )}

            {feed && feed.activities.length > 0 && (
              <ul className="space-y-3">
                {feed.activities.map((activity) => {
                  const actorName = activity.actor?.username || activity.actor?.email || 'Someone';
                  const initial = actorName.charAt(0).toUpperCase();
                  const message = formatActivityMessage(
                    activity.type,
                    activity.metadata ?? undefined,
                    activity.board?.title
                  );
                  const time = formatActivityDate(activity.createdAt);

                  return (
                    <li
                      key={activity.id}
                      className="flex gap-3 py-2 px-3 rounded-lg hover:bg-gray-50"
                    >
                      <div
                        className="w-8 h-8 rounded-full bg-trello-blue flex items-center justify-center text-white text-sm font-medium shrink-0"
                        title={actorName}
                      >
                        {initial}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">{actorName}</span>{' '}
                          <span className="text-gray-600">{message}</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{time}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {feed && feed.hasMore && (
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-4 py-2 text-sm font-medium text-trello-blue hover:bg-blue-50 rounded-md disabled:opacity-50"
                >
                  {loadingMore ? 'Loading…' : 'Load more'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
