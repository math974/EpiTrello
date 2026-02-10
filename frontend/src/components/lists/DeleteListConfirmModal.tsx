import { ListModel } from '../../generated/graphql';
import { FiTrash2 } from 'react-icons/fi';

type DeleteListConfirmModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  list: ListModel;
};

export default function DeleteListConfirmModal({
  isOpen,
  onClose,
  onConfirm,
}: DeleteListConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
          <h2 className="mb-4 text-lg font-semibold text-red-600 flex items-center gap-2">
            <FiTrash2 size={20} /> Delete List
          </h2>

          <p className="mb-6 text-trello-gray">
            Are you sure you want to delete this list? This action cannot be undone. All cards within this list will be permanently deleted.
          </p>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-200 px-4 py-2 text-sm text-trello-gray hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

