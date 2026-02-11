import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CardModel } from '../../generated/graphql';
import { FiCheck, FiCheckSquare, FiClock, FiMessageSquare, FiAlignLeft, FiPaperclip } from 'react-icons/fi';

type CardItemProps = {
  card: CardModel;
  listId: string;
  index?: number;
  onClick: () => void;
  onToggleDone?: () => void;
};

export default function CardItem({ card, listId, index = 0, onClick, onToggleDone }: CardItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: { type: 'card' as const, listId, index },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const assignees = card.assignees || [];
  const visibleAssignees = assignees.slice(0, 3);
  const remainingCount = assignees.length - 3;
  const dueDateStr = card.dueDate
    ? new Date(card.dueDate).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
      })
    : null;
  const commentCount = card.comments?.length ?? 0;
  const attachmentCount = card.attachments?.length ?? 0;
  const hasDescription = Boolean(card.description?.trim());
  const checklistStats = (card.checklists ?? []).reduce(
    (acc, cl) => {
      const items = cl.items ?? [];
      acc.total += items.length;
      acc.checked += items.filter((i) => i.checked).length;
      return acc;
    },
    { total: 0, checked: 0 }
  );
  const hasChecklistItems = checklistStats.total > 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group bg-white rounded-md shadow-sm p-3 mb-2 cursor-pointer hover:shadow-md transition-all ${
        card.done ? 'opacity-75' : ''
      } ${isDragging ? 'ring-2 ring-blue-400' : ''}`}
      onClick={(e) => {
        // Prevent opening modal when dragging
        if (!isDragging) {
          onClick();
        }
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-2">
            {card.done && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleDone?.();
                }}
                className="shrink-0 mt-0.5 text-green-600 hover:text-green-700"
                aria-label="Mark as not done"
              >
                <FiCheck size={16} />
              </button>
            )}
            <h3 className={`text-sm font-medium text-gray-800 flex-1 ${card.done ? 'line-through text-gray-500' : ''}`}>
              {card.title}
            </h3>
          </div>
          
          {(card.labels?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {(card.labels ?? []).slice(0, 5).map((label) => (
                <span
                  key={label.id}
                  className="inline-block h-2 min-w-[24px] rounded-full shrink-0"
                  style={{ backgroundColor: label.color, width: '24px' }}
                  title={label.name}
                />
              ))}
              {(card.labels?.length ?? 0) > 5 && (
                <span className="text-xs text-gray-500">+{(card.labels?.length ?? 0) - 5}</span>
              )}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {hasChecklistItems && (
              <div
                className="flex items-center gap-1 text-xs text-gray-600 bg-gray-100 rounded px-1.5 py-0.5"
                title={`Checklist: ${checklistStats.checked}/${checklistStats.total} items`}
              >
                <FiCheckSquare size={12} className="shrink-0 text-gray-500" />
                <span>{checklistStats.checked}/{checklistStats.total}</span>
              </div>
            )}
            {dueDateStr && (
              <div
                className="flex items-center gap-1 text-xs text-gray-600 bg-gray-100 rounded px-1.5 py-0.5"
                title={`Due ${new Date(card.dueDate!).toLocaleDateString(undefined, { dateStyle: 'medium' })}`}
              >
                <FiClock size={12} className="shrink-0 text-gray-500" />
                <span>{dueDateStr}</span>
              </div>
            )}
            {commentCount > 0 && (
              <div
                className="flex items-center gap-1 text-xs text-gray-600 bg-gray-100 rounded px-1.5 py-0.5"
                title={`${commentCount} comment${commentCount !== 1 ? 's' : ''}`}
              >
                <FiMessageSquare size={12} className="shrink-0 text-gray-500" />
                <span>{commentCount}</span>
              </div>
            )}
            {attachmentCount > 0 && (
              <div
                className="flex items-center gap-1 text-xs text-gray-600 bg-gray-100 rounded px-1.5 py-0.5"
                title={`${attachmentCount} attachment${attachmentCount !== 1 ? 's' : ''}`}
              >
                <FiPaperclip size={12} className="shrink-0 text-gray-500" />
                <span>{attachmentCount}</span>
              </div>
            )}
            {hasDescription && (
              <div
                className="flex items-center text-gray-500 rounded px-1.5 py-0.5"
                title="This card has a description"
              >
                <FiAlignLeft size={12} className="shrink-0" />
              </div>
            )}
            {assignees.length > 0 && (
              <div className="flex items-center gap-1">
                {visibleAssignees.map((assignee) => (
                  <div
                    key={assignee.id}
                    className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium"
                    title={assignee.username || assignee.email}
                  >
                    {(assignee.username || assignee.email || '').charAt(0).toUpperCase()}
                  </div>
                ))}
                {remainingCount > 0 && (
                  <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-medium">
                    +{remainingCount}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {!card.done && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleDone?.();
            }}
            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
            aria-label="Mark as done"
            title="Mark as done"
          >
            <FiCheck size={14} className="text-gray-400" />
          </button>
        )}
      </div>
    </div>
  );
}

