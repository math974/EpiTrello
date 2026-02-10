import { BoardModel } from '../../generated/graphql';

type DeleteBoardConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
  isLoading?: boolean;
  board: BoardModel;
};

export default function DeleteBoardConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  board,
}: DeleteBoardConfirmModalProps) {
  if (!isOpen) return null;

  const handleDelete = async () => {
    try {
      await onConfirm(board.id);
      onClose();
    } catch (err: any) {
      console.error('Error deleting board:', err);
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={handleClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
          <h2 className="mb-4 text-lg font-semibold text-red-600">Delete Board</h2>

          <p className="mb-6 text-trello-gray">
            Are you sure you want to delete the board &quot;<span className="font-medium">{board.title}</span>&quot;?
            This action cannot be undone. All lists, cards, and data within this board will be permanently deleted.
          </p>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="rounded-md border border-gray-200 px-4 py-2 text-sm text-trello-gray hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isLoading}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading && (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isLoading ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

