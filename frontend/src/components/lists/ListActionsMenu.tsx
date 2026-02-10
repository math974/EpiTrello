import { useState, useRef, useEffect } from 'react';
import { ListModel } from '../../generated/graphql';
import { FiMoreVertical, FiEdit, FiArchive, FiTrash2 } from 'react-icons/fi';
import DeleteListConfirmModal from './DeleteListConfirmModal';

type ListActionsMenuProps = {
  list: ListModel;
  onRename: () => void;
  onArchive: () => void;
  onDelete: () => void;
  isUpdating?: boolean;
};

export default function ListActionsMenu({
  list,
  onRename,
  onArchive,
  onDelete,
  isUpdating = false,
}: ListActionsMenuProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleRename = () => {
    setShowMenu(false);
    onRename();
  };

  const handleArchive = () => {
    setShowMenu(false);
    onArchive();
  };

  const handleDelete = () => {
    setShowMenu(false);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = () => {
    setShowDeleteModal(false);
    onDelete();
  };

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          disabled={isUpdating}
          className="p-1 rounded-md text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="List options"
        >
          <FiMoreVertical size={18} />
        </button>

        {showMenu && (
          <div className="absolute right-0 top-full z-20 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1">
            <button
              onClick={handleRename}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <FiEdit size={16} /> Rename
            </button>
            <button
              onClick={handleArchive}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <FiArchive size={16} /> Archive
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <FiTrash2 size={16} /> Delete
            </button>
          </div>
        )}
      </div>

      <DeleteListConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        list={list}
      />
    </>
  );
}

