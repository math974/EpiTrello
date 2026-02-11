import { useState, useEffect } from 'react';
import { LabelModel } from '../../generated/graphql';
import { getWorkspace } from '@/lib/workspacesClient';
import { addLabelToCard, removeLabelFromCard } from '@/lib/labelsClient';
import { FiTag, FiX } from 'react-icons/fi';

type LabelsSectionProps = {
  cardId: string;
  boardId: string;
  workspaceId: string;
  cardLabels: LabelModel[];
  onUpdate: () => void;
};

export default function LabelsSection({
  cardId,
  boardId,
  workspaceId,
  cardLabels,
  onUpdate,
}: LabelsSectionProps) {
  const [workspaceLabels, setWorkspaceLabels] = useState<LabelModel[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!workspaceId) return;
    getWorkspace(workspaceId).then((w) => {
      setWorkspaceLabels(w?.labels || []);
    });
  }, [workspaceId]);

  const cardLabelIds = new Set((cardLabels || []).map((l) => l.id));
  const availableToAdd = workspaceLabels.filter((l) => !cardLabelIds.has(l.id));

  const handleAdd = async (labelId: string) => {
    try {
      setLoading(true);
      await addLabelToCard(cardId, labelId, boardId);
      setShowPicker(false);
      onUpdate();
    } catch (err) {
      console.error('Add label failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (labelId: string) => {
    try {
      setLoading(true);
      await removeLabelFromCard(cardId, labelId, boardId);
      onUpdate();
    } catch (err) {
      console.error('Remove label failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
        <FiTag size={16} />
        Labels
      </h3>
      <div className="flex flex-wrap items-center gap-2">
        {(cardLabels || []).map((label) => (
          <span
            key={label.id}
            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-white"
            style={{ backgroundColor: label.color }}
          >
            {label.name}
            <button
              type="button"
              onClick={() => handleRemove(label.id)}
              disabled={loading}
              className="ml-0.5 hover:bg-black/20 rounded p-0.5 disabled:opacity-50"
              aria-label={`Remove ${label.name}`}
            >
              <FiX size={12} />
            </button>
          </span>
        ))}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowPicker(!showPicker)}
            disabled={loading}
            className="px-2 py-1 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50"
          >
            + Add label
          </button>
          {showPicker && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowPicker(false)}
                aria-hidden="true"
              />
              <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-[180px] max-h-48 overflow-y-auto">
                {availableToAdd.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-gray-500">No other labels in this workspace.</p>
                ) : (
                  availableToAdd.map((label) => (
                    <button
                      key={label.id}
                      type="button"
                      onClick={() => handleAdd(label.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
                    >
                      <span
                        className="w-4 h-4 rounded shrink-0"
                        style={{ backgroundColor: label.color }}
                      />
                      {label.name}
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
