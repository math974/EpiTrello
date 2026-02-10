import { BoardModel } from '../../generated/graphql';
import BoardCard from './BoardCard';

type BoardGridProps = {
  boards: BoardModel[];
  onCreateBoard?: () => void;
  onEditBoard?: (board: BoardModel) => void;
  onDeleteBoard?: (board: BoardModel) => void;
  canEdit?: boolean;
};

export default function BoardGrid({ boards, onCreateBoard, onEditBoard, onDeleteBoard, canEdit = false }: BoardGridProps) {
  if (boards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 py-12 px-6">
        <svg
          className="mb-4 h-16 w-16 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="mb-2 text-lg font-medium text-gray-700">No boards yet in this workspace</p>
        <p className="mb-4 text-sm text-gray-500">Get started by creating your first board</p>
        {onCreateBoard && (
          <button
            onClick={onCreateBoard}
            className="rounded-md bg-trello-blue px-4 py-2 text-sm font-semibold text-white hover:bg-trello-blue-dark transition-colors"
          >
            Create your first board
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {boards.map((board) => (
        <BoardCard
          key={board.id}
          board={board}
          onEdit={onEditBoard}
          onDelete={onDeleteBoard}
          canEdit={canEdit}
        />
      ))}
    </div>
  );
}

