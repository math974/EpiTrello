import { useState, useRef, useEffect } from 'react';
import { ListModel } from '../../generated/graphql';
import { updateList, archiveList, deleteList } from '@/lib/listsClient';
import ListActionsMenu from './ListActionsMenu';
import { FiMove } from 'react-icons/fi';

type ListHeaderProps = {
  list: ListModel;
  boardId: string;
  onUpdate: () => void;
  dragHandleProps?: any;
};

export default function ListHeader({ list, boardId, onUpdate, dragHandleProps }: ListHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(list.title);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTitle(list.title);
  }, [list.title]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleBlur = async () => {
    if (title.trim() === '') {
      setError('Title cannot be empty');
      setTitle(list.title);
      setIsEditing(false);
      return;
    }

    if (title.trim() === list.title) {
      setIsEditing(false);
      return;
    }

    try {
      setIsUpdating(true);
      setError(null);
      await updateList(list.id, title.trim(), boardId);
      setIsEditing(false);
      onUpdate();
    } catch (err: any) {
      setError(err.message || 'Failed to update list');
      setTitle(list.title);
      setIsEditing(false);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setTitle(list.title);
      setError(null);
      setIsEditing(false);
    }
  };

  const handleArchive = async () => {
    try {
      setIsUpdating(true);
      await archiveList(list.id, true, boardId);
      onUpdate();
    } catch (err: any) {
      console.error('Error archiving list:', err);
      // TODO: Show toast error
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsUpdating(true);
      await deleteList(list.id, boardId);
      onUpdate();
    } catch (err: any) {
      console.error('Error deleting list:', err);
      // TODO: Show toast error
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center gap-2 mb-2">
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setError(null);
          }}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={isUpdating}
          className="flex-1 px-2 py-1 text-sm font-semibold bg-white border border-trello-blue rounded focus:outline-none focus:ring-2 focus:ring-trello-blue"
        />
      ) : (
        <>
          {dragHandleProps && (
            <div
              {...dragHandleProps}
              className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 transition-colors"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <FiMove size={18} />
            </div>
          )}
          <h3
            onDoubleClick={handleDoubleClick}
            className="flex-1 px-2 py-1 text-sm font-semibold text-trello-navy cursor-text hover:bg-white/50 rounded"
          >
            {list.title}
          </h3>
        </>
      )}
      {error && <span className="text-xs text-red-600">{error}</span>}
      {!isEditing && (
        <div onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
          <ListActionsMenu
            list={list}
            onRename={() => setIsEditing(true)}
            onArchive={handleArchive}
            onDelete={handleDelete}
            isUpdating={isUpdating}
          />
        </div>
      )}
    </div>
  );
}

