import { useState } from 'react';
import { createList } from '@/lib/listsClient';
import { FiPlus, FiX } from 'react-icons/fi';

type CreateListFormInlineProps = {
  boardId: string;
  onCreated: () => void;
};

export default function CreateListFormInline({ boardId, onCreated }: CreateListFormInlineProps) {
  console.log('[CreateListFormInline] Rendering with boardId:', boardId);
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('List title is required');
      return;
    }

    try {
      setIsSubmitting(true);
      await createList(boardId, title.trim());
      setTitle('');
      setIsCreating(false);
      onCreated();
    } catch (err: any) {
      setError(err.message || 'Failed to create list');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setTitle('');
    setError(null);
    setIsCreating(false);
  };

  if (!isCreating) {
    return (
      <button
        onClick={() => setIsCreating(true)}
        className="w-72 shrink-0 bg-white/20 hover:bg-white/30 rounded-lg p-3 text-sm font-medium text-white transition-colors flex items-center gap-2 min-h-[40px] shadow-md"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
      >
        <FiPlus size={18} />
        Add a list
      </button>
    );
  }

  return (
    <div className="w-72 shrink-0 bg-gray-100 rounded-lg p-3">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setError(null);
          }}
          placeholder="Enter list title..."
          autoFocus
          disabled={isSubmitting}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-trello-blue focus:border-trello-blue"
        />
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        <div className="flex items-center gap-2 mt-2">
          <button
            type="submit"
            disabled={isSubmitting || !title.trim()}
            className="px-4 py-1.5 bg-trello-blue text-white text-sm font-medium rounded-md hover:bg-trello-blue-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Adding...' : 'Add list'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="p-1.5 text-gray-600 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Cancel"
          >
            <FiX size={20} />
          </button>
        </div>
      </form>
    </div>
  );
}

