import { useState } from 'react';
import { CardModel } from '../../generated/graphql';
import { archiveCard } from '@/lib/cardsClient';
import { FiArchive, FiX, FiRotateCcw } from 'react-icons/fi';

type ArchivedCardWithList = CardModel & {
  listTitle: string;
};

type ArchivedCardsDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  archivedCards: ArchivedCardWithList[];
  boardId: string;
  onUpdate: () => void;
};

export default function ArchivedCardsDrawer({
  isOpen,
  onClose,
  archivedCards,
  boardId,
  onUpdate,
}: ArchivedCardsDrawerProps) {
  const [isRestoring, setIsRestoring] = useState<string | null>(null);

  const handleRestore = async (cardId: string) => {
    try {
      setIsRestoring(cardId);
      await archiveCard(cardId, false, boardId);
      onUpdate();
    } catch (err: any) {
      console.error('Error restoring card:', err);
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
            Archived Cards
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
          {archivedCards.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No archived cards
            </p>
          ) : (
            <div className="space-y-2">
              {archivedCards.map((card) => (
                <div
                  key={card.id}
                  className="flex flex-col gap-1 p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-trello-navy truncate">
                        {card.title}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        List: {card.listTitle}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRestore(card.id)}
                      disabled={isRestoring === card.id}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs text-trello-blue hover:bg-trello-blue/10 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isRestoring === card.id ? (
                        <>
                          <svg
                            className="animate-spin h-3 w-3"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Restoring...
                        </>
                      ) : (
                        <>
                          <FiRotateCcw size={14} />
                          Restore
                        </>
                      )}
                    </button>
                  </div>
                  {card.description && (
                    <div className="text-xs text-gray-600 line-clamp-2 mt-1">
                      {card.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}


