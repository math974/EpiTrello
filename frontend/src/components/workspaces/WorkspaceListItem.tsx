import { useState, useRef, useEffect } from 'react';
import { WorkspaceModel } from '../../generated/graphql';
import { FiMoreVertical, FiEdit2, FiTrash2 } from 'react-icons/fi';

type WorkspaceListItemProps = {
  workspace: WorkspaceModel;
  isSelected: boolean;
  isCollapsed: boolean;
  onClick: () => void;
  onEdit: (workspace: WorkspaceModel) => void;
  onDelete: (workspace: WorkspaceModel) => void;
};

// Generate a color based on workspace name for consistent coloring
function getWorkspaceColor(name: string): string {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-yellow-500',
    'bg-indigo-500',
    'bg-red-500',
    'bg-teal-500',
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

export default function WorkspaceListItem({ 
  workspace, 
  isSelected, 
  isCollapsed, 
  onClick,
  onEdit,
  onDelete
}: WorkspaceListItemProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const initials = workspace.name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const colorClass = getWorkspaceColor(workspace.name);

  // Close menu when clicking outside
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

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    onEdit(workspace);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    onDelete(workspace);
  };

  if (isCollapsed) {
    return (
      <button
        onClick={onClick}
        className="flex w-full items-center justify-center px-2 py-2 rounded-md transition-colors"
        aria-selected={isSelected}
        title={workspace.name}
      >
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${colorClass} text-white text-sm font-bold ${
          isSelected ? 'ring-2 ring-trello-blue ring-offset-2 ring-offset-gray-800' : ''
        }`}>
          {initials}
        </div>
      </button>
    );
  }

  return (
    <div className="group relative">
      <div
        onClick={onClick}
        className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors cursor-pointer ${
          isSelected
            ? 'bg-trello-blue text-white'
            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
        }`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
        aria-selected={isSelected}
      >
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${colorClass} text-white text-sm font-bold`}>
          {initials}
        </div>
        <span className="truncate text-sm font-medium flex-1">{workspace.name}</span>
      </div>
      
      <button
        onClick={handleMenuClick}
        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white transition-opacity p-1 rounded-md hover:bg-gray-600"
        aria-label="Workspace options"
      >
        <FiMoreVertical size={16} />
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
          <div
            ref={menuRef}
            className="absolute right-0 top-full mt-1 z-50 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1"
          >
            <button
              onClick={handleEdit}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-trello-navy hover:bg-gray-100 transition-colors"
            >
              <FiEdit2 size={16} />
              <span>Edit workspace</span>
            </button>
            <button
              onClick={handleDelete}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <FiTrash2 size={16} />
              <span>Delete workspace</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
