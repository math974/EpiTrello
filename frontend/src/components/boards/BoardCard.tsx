import { useState } from 'react';
import { useRouter } from 'next/router';
import { BoardModel } from '../../generated/graphql';
import { FiMoreVertical, FiEdit, FiTrash2 } from 'react-icons/fi';

type BoardCardProps = {
  board: BoardModel;
  onEdit?: (board: BoardModel) => void;
  onDelete?: (board: BoardModel) => void;
  canEdit?: boolean;
};

export default function BoardCard({ board, onEdit, onDelete, canEdit = false }: BoardCardProps) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[BoardCard] Navigating to board:', board.id);
    router.replace(`/app/boards/${board.id}`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(board);
      setShowMenu(false);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(board);
      setShowMenu(false);
    }
  };

  return (
    <div className="group relative">
      <button
        onClick={handleClick}
        className={`relative w-full rounded-lg p-4 text-left transition-all hover:shadow-lg ${
          board.description ? 'h-40' : 'h-32'
        }`}
        style={{ backgroundColor: board.background || '#0079bf' }}
      >
        <div className="flex h-full flex-col justify-between">
          <div>
            <h3 className="font-semibold text-white drop-shadow-md mb-1">{board.title}</h3>
            {board.description && (
              <p className="text-xs text-white/90 drop-shadow-md line-clamp-2">
                {board.description}
              </p>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/80 drop-shadow-md">
              {new Date(board.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="absolute inset-0 rounded-lg bg-black/0 transition-all group-hover:bg-black/10" />
      </button>

      {canEdit && (onEdit || onDelete) && (
        <div className="absolute right-2 top-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="rounded-md bg-white/20 p-1.5 text-white opacity-0 transition-opacity hover:bg-white/30 group-hover:opacity-100"
            aria-label="Board options"
          >
            <FiMoreVertical size={18} />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full z-20 mt-2 w-48 rounded-md bg-white shadow-lg border border-gray-200 py-1">
                {onEdit && (
                  <button
                    onClick={handleEdit}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <FiEdit size={16} /> Edit board
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <FiTrash2 size={16} /> Delete board
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

