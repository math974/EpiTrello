import { useEffect, useState } from 'react';
import { LabelModel, WorkspaceModel } from '../../generated/graphql';
import { createLabel, updateLabel, deleteLabel } from '@/lib/labelsClient';
import { FiX, FiTrash2, FiPlus, FiEdit2 } from 'react-icons/fi';

const PRESET_COLORS = [
  '#61bd4f', '#f2d600', '#ff9f1a', '#eb5a46', '#c377e0',
  '#0079bf', '#00c2e0', '#51e898', '#ff78cb', '#344563',
];

type ManageWorkspaceLabelsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  workspace: WorkspaceModel;
  onWorkspaceUpdate?: (workspace: WorkspaceModel) => void;
};

export default function ManageWorkspaceLabelsModal({
  isOpen,
  onClose,
  workspace,
  onWorkspaceUpdate,
}: ManageWorkspaceLabelsModalProps) {
  const [labels, setLabels] = useState<LabelModel[]>(workspace.labels || []);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLabels(workspace.labels || []);
      setNewName('');
      setNewColor(PRESET_COLORS[0]);
      setEditingId(null);
      setError(null);
    }
  }, [isOpen, workspace.id, workspace.labels]);

  const refreshWorkspace = async () => {
    try {
      const { getWorkspace } = await import('@/lib/workspacesClient');
      const updated = await getWorkspace(workspace.id);
      if (updated) {
        setLabels(updated.labels || []);
        if (onWorkspaceUpdate) onWorkspaceUpdate(updated);
      }
    } catch (err) {
      console.error('Error refreshing workspace:', err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!newName.trim()) {
      setError('Name is required');
      return;
    }
    try {
      setIsCreating(true);
      await createLabel(workspace.id, newName.trim(), newColor);
      setNewName('');
      setNewColor(PRESET_COLORS[0]);
      await refreshWorkspace();
    } catch (err: any) {
      setError(err.message || 'Failed to create label');
    } finally {
      setIsCreating(false);
    }
  };

  const startEdit = (label: LabelModel) => {
    setEditingId(label.id);
    setEditName(label.name);
    setEditColor(label.color);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setError(null);
    if (!editName.trim()) {
      setError('Name is required');
      return;
    }
    try {
      setIsSaving(true);
      await updateLabel(editingId, workspace.id, { name: editName.trim(), color: editColor });
      setEditingId(null);
      await refreshWorkspace();
    } catch (err: any) {
      setError(err.message || 'Failed to update label');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (labelId: string) => {
    try {
      setIsDeleting(labelId);
      await deleteLabel(labelId, workspace.id);
      await refreshWorkspace();
    } catch (err: any) {
      setError(err.message || 'Failed to delete label');
    } finally {
      setIsDeleting(null);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] flex flex-col pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Labels</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
              aria-label="Close"
            >
              <FiX size={20} />
            </button>
          </div>

          <div className="p-4 overflow-y-auto flex-1">
            {error && (
              <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Create new label */}
            <form onSubmit={handleCreate} className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">New label</label>
              <div className="flex gap-2 flex-wrap items-center">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Label name"
                  className="flex-1 min-w-[120px] px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isCreating}
                />
                <div className="flex items-center gap-1">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewColor(c)}
                      className={`w-8 h-8 rounded-md border-2 transition-all ${
                        newColor === c ? 'border-gray-800 scale-110' : 'border-transparent hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border border-gray-300"
                  title="Custom color"
                />
                <button
                  type="submit"
                  disabled={isCreating || !newName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>

            {/* List of labels */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Workspace labels</label>
              {labels.length === 0 ? (
                <p className="text-sm text-gray-500">No labels yet. Create one above.</p>
              ) : (
                labels.map((label) => (
                  <div
                    key={label.id}
                    className="flex items-center gap-2 p-2 rounded-md border border-gray-200 hover:bg-gray-50"
                  >
                    {editingId === label.id ? (
                      <form onSubmit={handleUpdate} className="flex-1 flex gap-2 items-center flex-wrap">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 min-w-0 px-2 py-1 text-sm border border-gray-300 rounded"
                          autoFocus
                        />
                        <input
                          type="color"
                          value={editColor}
                          onChange={(e) => setEditColor(e.target.value)}
                          className="w-8 h-8 rounded cursor-pointer border"
                        />
                        <button
                          type="submit"
                          disabled={isSaving || !editName.trim()}
                          className="px-2 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button type="button" onClick={cancelEdit} className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-200 rounded">
                          Cancel
                        </button>
                      </form>
                    ) : (
                      <>
                        <div
                          className="w-8 h-8 rounded shrink-0"
                          style={{ backgroundColor: label.color }}
                          title={label.color}
                        />
                        <span className="flex-1 text-sm font-medium text-gray-900 truncate">{label.name}</span>
                        <button
                          type="button"
                          onClick={() => startEdit(label)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          aria-label="Edit label"
                        >
                          <FiEdit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(label.id)}
                          disabled={isDeleting === label.id}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                          aria-label="Delete label"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
