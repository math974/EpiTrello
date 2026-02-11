import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { ListModel, CardModel } from '../../generated/graphql';
import ListHeader from './ListHeader';
import CardItem from '../cards/CardItem';
import CreateCardInline from '../cards/CreateCardInline';
import { createCard, setCardDone } from '@/lib/cardsClient';

/** Empty slot where the dragged card is (keeps layout; no "Drop here" text). */
const emptySlotClass = 'min-h-[60px] mb-2 shrink-0';

type ListColumnProps = {
  list: ListModel;
  boardId: string;
  workspaceId: string;
  onUpdate: () => void;
  isReordering?: boolean;
  onCardClick: (card: CardModel) => void;
  activeListId?: string | null;
  /** When dragging a card, its id. Placeholder is shown in place of this card (already moved in state). */
  activeCardId?: string | null;
};

export default function ListColumn({
  list,
  boardId,
  workspaceId,
  onUpdate,
  isReordering = false,
  onCardClick,
  activeListId = null,
  activeCardId = null,
}: ListColumnProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: list.id, disabled: isReordering });

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `list-${list.id}`,
    data: { type: 'list' as const, listId: list.id },
  });

  const isDraggingThisList = isDragging && activeListId === list.id;
  const style = isDraggingThisList
    ? { opacity: 0, transition, cursor: 'grabbing' as const }
    : {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      };

  // Display order = position order (same as backend). Keeps front and DB in sync.
  const activeCards = (list.cards || [])
    .filter((card) => !card.archived)
    .sort((a, b) => a.position - b.position);

  const handleCreateCard = async (title: string) => {
    try {
      await createCard(list.id, title, boardId);
      onUpdate();
    } catch (error: any) {
      console.error('Error creating card:', error);
      throw error;
    }
  };

  const handleToggleDone = async (card: CardModel) => {
    try {
      await setCardDone(card.id, !card.done, boardId);
      onUpdate();
    } catch (error: any) {
      console.error('Error toggling card done:', error);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="w-72 shrink-0 bg-gray-100 rounded-lg p-3 flex flex-col max-h-[calc(100vh-180px)]"
    >
      <div className="mb-2 shrink-0">
        <ListHeader
          list={list}
          boardId={boardId}
          onUpdate={onUpdate}
          dragHandleProps={{ ...attributes, ...listeners }}
        />
      </div>
      
      <div
        ref={setDroppableRef}
        className={`flex-1 overflow-y-auto min-h-[100px] mt-2 ${isOver ? 'bg-gray-100/50 rounded-md' : ''}`}
      >
        <SortableContext
          items={activeCards.map((card) => card.id)}
          strategy={verticalListSortingStrategy}
        >
          {activeCards.length === 0 ? (
            <div className="text-xs text-gray-500 text-center py-4">
              No cards yet
            </div>
          ) : (
            activeCards.map((card, i) =>
              card.id === activeCardId ? (
                <div key={card.id} className={emptySlotClass} aria-hidden />
              ) : (
                <CardItem
                  key={card.id}
                  card={card}
                  listId={list.id}
                  index={i}
                  onClick={() => onCardClick(card)}
                  onToggleDone={() => handleToggleDone(card)}
                />
              )
            )
          )}
        </SortableContext>
      </div>

      {/* Add a card - fixed at bottom, not scrollable */}
      <div className="shrink-0 mt-2">
        <CreateCardInline
          listId={list.id}
          boardId={boardId}
          onCreate={handleCreateCard}
        />
      </div>
    </div>
  );
}

