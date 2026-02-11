import { useState, useEffect, useRef } from 'react';
import { CardModel } from '../../generated/graphql';
import { FiX, FiCheck, FiArchive, FiTrash2, FiCalendar } from 'react-icons/fi';
import AssigneesSection from './AssigneesSection';
import LabelsSection from './LabelsSection';
import CommentsSection from './CommentsSection';
import ConfirmDeleteCardModal from './ConfirmDeleteCardModal';
import {
  updateCard,
  archiveCard,
  deleteCard,
  setCardDone,
  assignUserToCard,
  unassignUserFromCard,
  setCardDueDate,
  clearCardDueDate,
} from '@/lib/cardsClient';

type CardModalProps = {
  isOpen: boolean;
  card: CardModel | null;
  boardId: string;
  workspaceId: string;
  onClose: () => void;
  onUpdate: () => void;
  onAssigneesChange?: (cardId: string, newAssignees: CardModel['assignees']) => void;
};

export default function CardModal({
  isOpen,
  card,
  boardId,
  workspaceId,
  onClose,
  onUpdate,
  onAssigneesChange,
}: CardModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSettingDueDate, setIsSettingDueDate] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [currentCardId, setCurrentCardId] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);
  // Use ref to store saved description that won't be overwritten by useEffect
  const savedDescriptionRef = useRef<string>('');

  useEffect(() => {
    if (card) {
      // Only reset state if it's a different card
      if (currentCardId !== card.id) {
        // Different card - reset everything
        setTitle(card.title || '');
        setDescription(card.description || '');
        savedDescriptionRef.current = ''; // Clear saved description when changing cards
        setIsEditingTitle(false);
        setIsEditingDescription(false);
        setCurrentCardId(card.id);
      } else if (!isEditingDescription && !isEditingTitle) {
        // Same card, not editing - only update if we don't have a saved description in ref
        // If savedDescriptionRef has a value, keep using it and don't overwrite
        if (!savedDescriptionRef.current && description !== (card.description || '')) {
          setDescription(card.description || '');
        }
        if (title !== (card.title || '')) {
          setTitle(card.title || '');
        }
      }
      // If we're editing, don't update state - preserve user input
    }
  }, [card, currentCardId, isEditingDescription, isEditingTitle, title, description]);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    if (isEditingDescription && descriptionTextareaRef.current) {
      descriptionTextareaRef.current.focus();
    }
  }, [isEditingDescription]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (showDeleteConfirm) {
          setShowDeleteConfirm(false);
        } else if (!isEditingTitle && !isEditingDescription) {
          handleClose();
        } else {
          setIsEditingTitle(false);
          setIsEditingDescription(false);
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isEditingTitle, isEditingDescription, showDeleteConfirm]);

  if (!isOpen || !card) return null;

  const handleClose = () => {
    if (isSaving || isDeleting) return;
    setIsEditingTitle(false);
    setIsEditingDescription(false);
    savedDescriptionRef.current = ''; // Clear saved description when closing
    onClose();
  };

  const handleSaveTitle = async () => {
    if (!title.trim() || title.trim() === card.title) {
      setIsEditingTitle(false);
      setTitle(card.title || '');
      return;
    }

    setIsSaving(true);
    try {
      await updateCard(card.id, boardId, { title: title.trim() });
      setIsEditingTitle(false);
      onUpdate();
    } catch (error: any) {
      console.error('Error updating card title:', error);
      setTitle(card.title || '');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDescription = async () => {
    if (description === (card.description || '')) {
      setIsEditingDescription(false);
      return;
    }

    const newDescription = description || null;
    const savedDescription = description; // Save current value to preserve it
    
    setIsSaving(true);
    
    // Store in ref so it won't be overwritten by useEffect
    savedDescriptionRef.current = savedDescription;
    
    // Close editing mode immediately - this will show the saved description
    setIsEditingDescription(false);
    
    // Explicitly set the description to what we saved to ensure it's displayed
    setDescription(savedDescription);
    
    try {
      await updateCard(card.id, boardId, { description: newDescription });
      // Don't call onUpdate() - it causes card prop to change and useEffect overwrites
      // The board will be updated when modal closes
    } catch (error: any) {
      console.error('Error updating card description:', error);
      // Rollback on error
      savedDescriptionRef.current = '';
      setDescription(card.description || '');
      setIsEditingDescription(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleDone = async () => {
    try {
      await setCardDone(card.id, !card.done, boardId);
      onUpdate();
    } catch (error: any) {
      console.error('Error toggling card done:', error);
    }
  };

  const handleArchive = async () => {
    try {
      await archiveCard(card.id, true, boardId);
      onUpdate();
      handleClose();
    } catch (error: any) {
      console.error('Error archiving card:', error);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteCard(card.id, boardId);
      setShowDeleteConfirm(false);
      onUpdate();
      handleClose();
    } catch (error: any) {
      console.error('Error deleting card:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAssign = async (userId: string) => {
    try {
      await assignUserToCard(card.id, userId, boardId);
      if (onAssigneesChange) {
        // AssigneesSection will call onAssigneesChange with new list after success
      } else {
        onUpdate();
      }
    } catch (error: any) {
      console.error('Error assigning user:', error);
      throw error;
    }
  };

  const handleUnassign = async (userId: string) => {
    try {
      await unassignUserFromCard(card.id, userId, boardId);
      if (onAssigneesChange) {
        // AssigneesSection will call onAssigneesChange with new list after success
      } else {
        onUpdate();
      }
    } catch (error: any) {
      console.error('Error unassigning user:', error);
      throw error;
    }
  };

  const handleSetDueDate = async (dateStr: string) => {
    if (!dateStr) return;
    setIsSettingDueDate(true);
    try {
      const dueDate = new Date(dateStr + 'T23:59:59.000Z').toISOString();
      await setCardDueDate(card.id, dueDate, boardId);
      onUpdate();
    } catch (error: any) {
      console.error('Error setting due date:', error);
    } finally {
      setIsSettingDueDate(false);
    }
  };

  const handleClearDueDate = async () => {
    setIsSettingDueDate(true);
    try {
      await clearCardDueDate(card.id, boardId);
      onUpdate();
    } catch (error: any) {
      console.error('Error clearing due date:', error);
    } finally {
      setIsSettingDueDate(false);
    }
  };

  const dueDateValue = card.dueDate
    ? new Date(card.dueDate).toISOString().slice(0, 10)
    : '';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b border-gray-200">
            <div className="flex-1 min-w-0">
              {isEditingTitle ? (
                <input
                  ref={titleInputRef}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleSaveTitle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSaveTitle();
                    } else if (e.key === 'Escape') {
                      setTitle(card.title || '');
                      setIsEditingTitle(false);
                    }
                  }}
                  disabled={isSaving}
                  className="w-full text-xl font-semibold text-gray-900 border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 -mx-2"
                />
              ) : (
                <h2
                  onClick={() => setIsEditingTitle(true)}
                  className="text-xl font-semibold text-gray-900 cursor-text hover:bg-gray-50 rounded px-2 -mx-2 py-1"
                >
                  {title || card.title}
                </h2>
              )}
            </div>
            <button
              onClick={handleClose}
              className="shrink-0 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              aria-label="Close"
            >
              <FiX size={20} />
            </button>
          </div>

          {/* Content: left = description/assignees/due date, right = comments */}
          <div className="flex-1 overflow-hidden flex p-6 gap-6">
            <div className="flex-1 min-w-0 overflow-y-auto">
              {/* Description */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
                {isEditingDescription ? (
                  <div>
                    <textarea
                      ref={descriptionTextareaRef}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setDescription(card.description || '');
                          setIsEditingDescription(false);
                        }
                      }}
                      disabled={isSaving}
                      rows={4}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                      placeholder="Add a more detailed description..."
                    />
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={handleSaveDescription}
                        disabled={isSaving || description === (card.description || '')}
                        className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        {isSaving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => {
                          setDescription(card.description || '');
                          setIsEditingDescription(false);
                        }}
                        disabled={isSaving}
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 disabled:opacity-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => setIsEditingDescription(true)}
                    className="min-h-[60px] px-3 py-2 text-sm text-gray-700 border border-transparent rounded-md cursor-text hover:bg-gray-50 hover:border-gray-200 transition-colors"
                  >
                    {savedDescriptionRef.current || description || (
                      <span className="text-gray-400">Add a more detailed description...</span>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 my-4" aria-hidden="true" />

              {/* Assignees */}
              <AssigneesSection
                cardId={card.id}
                assignees={card.assignees || []}
                workspaceId={workspaceId}
                onAssign={handleAssign}
                onUnassign={handleUnassign}
                onAssigneesChange={
                  onAssigneesChange
                    ? (newAssignees) => onAssigneesChange(card.id, newAssignees ?? [])
                    : undefined
                }
              />

              <div className="border-t border-gray-200 my-4" aria-hidden="true" />

              {/* Labels */}
              <LabelsSection
                cardId={card.id}
                boardId={boardId}
                workspaceId={workspaceId}
                cardLabels={card.labels ?? []}
                onUpdate={onUpdate}
              />

              <div className="border-t border-gray-200 my-4" aria-hidden="true" />

              {/* Due date */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FiCalendar size={16} />
                  Due date
                </h3>
                {card.dueDate ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-gray-700">
                      {new Date(card.dueDate).toLocaleDateString(undefined, {
                        dateStyle: 'medium',
                      })}
                    </span>
                    <input
                      type="date"
                      className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                      value={dueDateValue}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v) handleSetDueDate(v);
                      }}
                      disabled={isSettingDueDate}
                    />
                    <button
                      type="button"
                      onClick={handleClearDueDate}
                      disabled={isSettingDueDate}
                      className="text-sm text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1.5 rounded transition-colors disabled:opacity-50"
                    >
                      Clear due date
                    </button>
                    {isSettingDueDate && (
                      <span className="inline-block w-4 h-4 border-2 border-trello-blue border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="date"
                      className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v) handleSetDueDate(v);
                      }}
                      disabled={isSettingDueDate}
                    />
                    <span className="text-sm text-gray-500">No due date</span>
                    {isSettingDueDate && (
                      <span className="inline-block w-4 h-4 border-2 border-trello-blue border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>
                )}
              </div>
            </div>
            {/* Sidebar: Commentaires */}
            <div className="w-80 shrink-0 border-l border-gray-200 pl-6 flex flex-col min-h-0">
              <CommentsSection
                cardId={card.id}
                boardId={boardId}
                comments={card.comments ?? []}
                onCommentsChange={onUpdate}
              />
            </div>
          </div>

          {/* Actions Footer */}
          <div className="p-6 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleDone}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  card.done
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FiCheck size={16} />
                {card.done ? 'Done' : 'Mark as done'}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleArchive}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                <FiArchive size={16} />
                Archive
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                <FiTrash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteCardModal
        isOpen={showDeleteConfirm}
        cardTitle={card.title}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        isLoading={isDeleting}
      />
    </>
  );
}

