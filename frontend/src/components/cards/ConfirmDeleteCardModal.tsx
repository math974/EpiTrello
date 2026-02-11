import { FiAlertTriangle, FiX } from 'react-icons/fi';

type ConfirmDeleteCardModalProps = {
  isOpen: boolean;
  cardTitle: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
};

export default function ConfirmDeleteCardModal({
  isOpen,
  cardTitle,
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmDeleteCardModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex items-start gap-4">
            <div className="shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <FiAlertTriangle className="text-red-600" size={20} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete card?</h3>
              <p className="text-sm text-gray-600 mb-4">
                This will permanently delete the card <strong>"{cardTitle}"</strong>. This action cannot be undone.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={onConfirm}
                  disabled={isLoading}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  onClick={onCancel}
                  disabled={isLoading}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="shrink-0 p-1 text-gray-400 hover:text-gray-600 rounded-md transition-colors disabled:opacity-50"
              aria-label="Close"
            >
              <FiX size={20} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

