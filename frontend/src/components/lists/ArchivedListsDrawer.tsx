import { useState } from 'react';
import { ListModel } from '../../generated/graphql';
import { archiveList } from '@/lib/listsClient';
import { FiArchive, FiX, FiRotateCcw } from 'react-icons/fi';

type ArchivedListsDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  archivedLists: ListModel[];
  boardId: string;
  onUpdate: () => void;
};

export default function ArchivedListsDrawer({
  isOpen,
  onClose,
  archivedLists,
  boardId,
  onUpdate,
}: ArchivedListsDrawerProps) {
  const [isRestoring, setIsRestoring] = useState<string | null>(null);

  const handleRestore = async (listId: string) => {
    try {
      setIsRestoring(listId);
      await archiveList(listId, false, boardId);
      onUpdate();
    } catch (err: any) {
      console.error('Error restoring list:', err);
      // TODO: Show toast error
    } finally {
      setIsRestoring(null);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-96 bg-white shadow-xl overflow-y-auto">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-trello-navy flex items-center gap-2">
            <FiArchive size={20} />
            Archived Lists
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="p-4">
          {archivedLists.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No archived lists
            </p>
          ) : (
            <div className="space-y-2">
              {archivedLists.map((list) => (
                <div
                  key={list.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <span className="text-sm font-medium text-trello-navy">{list.title}</span>
                  <button
                    onClick={() => handleRestore(list.id)}
                    disabled={isRestoring === list.id}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-trello-blue hover:bg-trello-blue/10 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRestoring === list.id ? (
                      <>
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Restoring...
                      </>
                    ) : (
                      <>
                        <FiRotateCcw size={16} />
                        Restore
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

