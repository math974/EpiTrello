import { useState, useRef, useEffect } from 'react';
import { FiX, FiPlus } from 'react-icons/fi';

type CreateCardInlineProps = {
  listId: string;
  boardId: string;
  onCreate: (title: string) => Promise<void>;
  onCancel?: () => void;
};

export default function CreateCardInline({ listId, boardId, onCreate, onCancel }: CreateCardInlineProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isCreating && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isCreating]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    const trimmedTitle = title.trim();
    if (!trimmedTitle || isLoading) {
      return;
    }

    setIsLoading(true);
    try {
      await onCreate(trimmedTitle);
      setTitle('');
      setIsCreating(false);
    } catch (error: any) {
      console.error('Error creating card:', error);
      // Keep the form open on error so user can retry
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleCancel = () => {
    setTitle('');
    setIsCreating(false);
    onCancel?.();
  };

  if (!isCreating) {
    return (
      <button
        onClick={() => setIsCreating(true)}
        className="w-full text-left text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md p-2 transition-colors flex items-center gap-2"
      >
        <FiPlus size={16} />
        Add a card
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mb-2">
      <textarea
        ref={textareaRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          // Delay to allow submit button click
          setTimeout(() => {
            if (!title.trim()) {
              handleCancel();
            }
          }, 200);
        }}
        placeholder="Enter a title for this card..."
        disabled={isLoading}
        rows={3}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
      />
      <div className="flex items-center gap-2 mt-2">
        <button
          type="submit"
          disabled={!title.trim() || isLoading}
          className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Adding...' : 'Add card'}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={isLoading}
          className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
          aria-label="Cancel"
        >
          <FiX size={18} />
        </button>
      </div>
    </form>
  );
}

