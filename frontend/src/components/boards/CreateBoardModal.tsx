import { useEffect, useState } from 'react';
import { FiX } from 'react-icons/fi';

type CreateBoardModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string) => Promise<void>;
  isLoading?: boolean;
  workspaceName?: string;
};

export default function CreateBoardModal({
  isOpen,
  onClose,
  onCreate,
  isLoading = false,
  workspaceName,
}: CreateBoardModalProps) {
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Board title is required');
      return;
    }

    if (title.trim().length < 1) {
      setError('Board title must be at least 1 character');
      return;
    }

    try {
      await onCreate(title.trim());
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create board');
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    setTitle('');
    setError(null);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={handleClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-trello-navy">Create Board</h2>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Close"
            >
              <FiX size={24} />
            </button>
          </div>

          {workspaceName && (
            <p className="mb-4 text-sm text-gray-600">
              Creating board in <span className="font-medium">{workspaceName}</span>
            </p>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="board-title" className="mb-2 block text-sm font-medium text-trello-navy">
                Board title
              </label>
              <input
                id="board-title"
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setError(null);
                }}
                placeholder="Ex: Roadmap marketing"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-trello-blue focus:ring-2 focus:ring-trello-blue/40"
                disabled={isLoading}
                autoFocus
              />
              {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
            </div>

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
                type="submit"
                disabled={isLoading || !title.trim()}
                className="rounded-md bg-trello-blue px-4 py-2 text-sm font-semibold text-white hover:bg-trello-blue-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading && (
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isLoading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

