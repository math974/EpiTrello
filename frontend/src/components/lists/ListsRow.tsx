import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCorners,
  pointerWithin,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
  useDroppable,
} from '@dnd-kit/core';
import type { CollisionDetection } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Fragment, useRef } from 'react';
import { ListModel, CardModel } from '../../generated/graphql';
import ListColumn from './ListColumn';
import CreateListFormInline from './CreateListFormInline';
import CardItem from '../cards/CardItem';
import { reorderLists } from '@/lib/listsClient';
import { moveCard } from '@/lib/cardsClient';

type ListsRowProps = {
  boardId: string;
  workspaceId: string;
  lists: ListModel[];
  archivedLists: ListModel[];
  onBoardUpdate: () => void;
  onCardClick: (card: CardModel) => void;
};

export default function ListsRow({ 
  boardId, 
  workspaceId,
  lists, 
  archivedLists, 
  onBoardUpdate,
  onCardClick,
}: ListsRowProps) {
  const [isReordering, setIsReordering] = useState(false);
  const [localLists, setLocalLists] = useState<ListModel[]>(lists);
  const [activeCard, setActiveCard] = useState<CardModel | null>(null);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [dropIndicatorIndex, setDropIndicatorIndex] = useState<number | null>(null);
  const [isMovingCard, setIsMovingCard] = useState(false);
  const [overListId, setOverListId] = useState<string | null>(null);

  const lastCardDropRef = useRef<{ targetListId: string; targetIndex: number } | null>(null);
  const dragSourceRef = useRef<{ listId: string; index: number } | null>(null);
  const { setNodeRef: setBeforeFirstRef } = useDroppable({ id: 'list-before-first' });
  const { setNodeRef: setAfterLastRef } = useDroppable({ id: 'list-after-last' });

  // Update local lists when props change
  useEffect(() => {
    setLocalLists(lists);
  }, [lists]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: { active: { opacity: '0' } },
    }),
  };

  /** Pour le drag de listes : on détermine la cible par la position X du centre de l’élément déplacé, pas par "closest corner", pour éviter le décalage gauche→droite. */
  const collisionDetection: CollisionDetection = (args) => {
    const { active, collisionRect, droppableRects, droppableContainers } = args;
    const isDraggingList = localLists.some((l) => l.id === active.id);
    if (isDraggingList) {
      const centerX = collisionRect.left + collisionRect.width / 2;
      const listContainers = droppableContainers.filter((c) => {
        const id = String(c.id);
        return id.startsWith('list-') && id !== 'list-before-first' && id !== 'list-after-last';
      });
      const withRects = listContainers
        .map((c) => ({ container: c, rect: droppableRects.get(c.id) }))
        .filter((x): x is { container: (typeof listContainers)[0]; rect: NonNullable<typeof x.rect> } => x.rect != null);
      const sortedLists = [...withRects].sort((a, b) => a.rect.left - b.rect.left);
      if (sortedLists.length === 0) return closestCorners(args);
      const insideIndex = sortedLists.findIndex(({ rect }) => rect.left <= centerX && centerX < rect.right);
      if (insideIndex >= 0) return [{ id: sortedLists[insideIndex].container.id }];
      const gapIndex = sortedLists.findIndex(({ rect }) => rect.left > centerX);
      if (gapIndex === 0) return [{ id: 'list-before-first' }];
      if (gapIndex < 0) return [{ id: 'list-after-last' }];
      return [{ id: sortedLists[gapIndex].container.id }];
    }
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions?.length) return pointerCollisions;
    return closestCorners(args);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const isList = localLists.some((list) => list.id === active.id);
    if (isList) {
      setActiveListId(active.id as string);
      return;
    }
    const allCards = localLists.flatMap((list) => list.cards || []);
    const card = allCards.find((c) => c.id === active.id);
    if (card) {
      setActiveCard(card);
      const data = active.data?.current as { listId?: string; index?: number } | undefined;
      const sourceList = localLists.find((l) => (l.cards || []).some((c) => c.id === card.id));
      const listId = data?.listId ?? sourceList?.id;
      const index =
        data?.index ??
        (sourceList ? getCardsInOrder(sourceList).findIndex((c) => c.id === card.id) : 0);
      if (listId != null && index >= 0) dragSourceRef.current = { listId, index };
    }
  };

  /** Order = position order (same as backend). Ensures indices we send to moveCard match DB. */
  const getCardsInOrder = (list: ListModel, excludeCardId?: string): CardModel[] =>
    (list.cards || [])
      .filter((c) => !c.archived && (excludeCardId == null || c.id !== excludeCardId))
      .sort((a, b) => a.position - b.position);

  /** Move card to (toListId, toIndex) in local state — optimistic preview. Reorder arrays only, no position recalc. */
  const moveCardInLocalLists = (
    lists: ListModel[],
    card: CardModel,
    toListId: string,
    toIndex: number
  ): ListModel[] => {
    const fromList = lists.find((l) => (l.cards || []).some((c) => c.id === card.id));
    if (!fromList) return lists;
    const toList = lists.find((l) => l.id === toListId);
    if (!toList) return lists;

    const fromCards = getCardsInOrder(fromList, card.id);
    const toCardsRaw =
      fromList.id === toList.id ? fromCards : getCardsInOrder(toList);
    const toCards = [...toCardsRaw];
    toCards.splice(Math.min(toIndex, toCards.length), 0, card);

    return lists.map((list) => {
      if (list.id === fromList.id && list.id !== toListId) {
        return { ...list, cards: fromCards };
      }
      if (list.id === toListId) {
        return { ...list, cards: toCards };
      }
      return list;
    });
  };

  /** Compute card drop target from over (card or list). Prefer over.data.listId for cards. Insert before over card, or at end if over list. */
  const getCardDropTarget = (
    overId: string | number,
    overData: { listId?: string; type?: string } | null,
    card: CardModel,
    lists: ListModel[]
  ): { targetListId: string; targetIndex: number } | null => {
    const overIdStr = String(overId);
    let targetListId: string | null = null;
    if (overIdStr.startsWith('list-')) {
      targetListId = overIdStr.replace('list-', '');
    } else if (overData?.listId) {
      targetListId = overData.listId;
    } else {
      const targetList = lists.find((list) =>
        (list.cards || []).some((c) => c.id === overId)
      );
      if (targetList) targetListId = targetList.id;
    }
    if (!targetListId) return null;

    const targetList = lists.find((l) => l.id === targetListId);
    if (!targetList) return null;

    const fullTargetCards = getCardsInOrder(targetList);
    let targetIndex = fullTargetCards.length;
    if (overIdStr !== `list-${targetListId}`) {
      const overCardIndex = fullTargetCards.findIndex((c) => c.id === overId);
      if (overCardIndex >= 0) targetIndex = overCardIndex;
    }
    return { targetListId, targetIndex };
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) {
      setOverListId(null);
      if (activeListId) setDropIndicatorIndex(null);
      return;
    }

    if (activeListId) {
      const overIdStr = String(over.id);
      let barIndex: number;
      if (overIdStr === 'list-before-first') barIndex = 0;
      else if (overIdStr === 'list-after-last') barIndex = localLists.length;
      else if (localLists.some((l) => l.id === over.id)) barIndex = localLists.findIndex((l) => l.id === over.id);
      else if (overIdStr.startsWith('list-')) barIndex = localLists.findIndex((l) => l.id === overIdStr.replace('list-', ''));
      else {
        const listWithOver = localLists.find((l) => (l.cards || []).some((c) => c.id === over.id));
        barIndex = listWithOver ? localLists.findIndex((l) => l.id === listWithOver.id) : 0;
      }
      setDropIndicatorIndex(barIndex >= 0 ? barIndex : null);
      return;
    }

    // Dragging a card: use stable source from dragSourceRef (never from mutated localLists).
    const allCards = localLists.flatMap((list) => list.cards || []);
    const card = allCards.find((c) => c.id === active.id);
    if (!card) return;

    const source = dragSourceRef.current;
    if (!source) return;

    const overIdStr = String(over.id);
    const overData = (over.data?.current || null) as { listId?: string; type?: string } | null;
    if (overIdStr.startsWith('list-')) setOverListId(overIdStr.replace('list-', ''));
    else setOverListId(overData?.listId ?? null);

    const dropTarget = getCardDropTarget(over.id, overData, card, localLists);
    if (!dropTarget) {
      lastCardDropRef.current = null;
      return;
    }

    const { targetListId, targetIndex } = dropTarget;
    lastCardDropRef.current = { targetListId, targetIndex };
    // No state update during drag — list stays fixed, slot stays at card's original position. Move only on drop.
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const wasDraggingList = !!activeListId;
    const wasDraggingCard = localLists.some((l) => (l.cards || []).some((c) => c.id === active.id));
    setActiveCard(null);
    setOverListId(null);

    if (!over) {
      if (wasDraggingList) {
        // No valid drop target for list: just clear visual state, don't try to compute indices
        setActiveListId(null);
        setDropIndicatorIndex(null);
        return;
      }
      if (wasDraggingCard && !lastCardDropRef.current) {
        lastCardDropRef.current = null;
        dragSourceRef.current = null;
        return;
      }
      if (!wasDraggingCard && !wasDraggingList) return;
    }

    // List DnD: over.id = list, list-${id}, list-before-first, list-after-last, or card.
    const oldListIndex = localLists.findIndex((l) => l.id === active.id);
    if (oldListIndex !== -1) {
      setActiveListId(null);
      setDropIndicatorIndex(null);
      let newListIndex = -1;
      const overIdStr = String(over!.id);
      if (overIdStr === 'list-before-first') newListIndex = 0;
      else if (overIdStr === 'list-after-last') newListIndex = localLists.length;
      else if (localLists.some((l) => l.id === over!.id)) {
        newListIndex = localLists.findIndex((l) => l.id === over!.id);
      } else if (overIdStr.startsWith('list-')) {
        newListIndex = localLists.findIndex((l) => l.id === overIdStr.replace('list-', ''));
      } else {
        const listWithOver = localLists.find((l) =>
          (l.cards || []).some((c) => c.id === over!.id)
        );
        if (listWithOver) newListIndex = localLists.findIndex((l) => l.id === listWithOver.id);
      }
      const toIndex = newListIndex >= localLists.length ? localLists.length - 1 : newListIndex;
      if (newListIndex !== -1 && toIndex !== oldListIndex) {
        const reorderedLists = arrayMove(localLists, oldListIndex, toIndex);
        setLocalLists(reorderedLists);
        setIsReordering(true);
        try {
          await reorderLists(boardId, reorderedLists.map((l) => l.id));
          onBoardUpdate();
        } catch (error: any) {
          console.error('Error reordering lists:', error);
          setLocalLists(lists);
        } finally {
          setIsReordering(false);
        }
      }
      return;
    }

    // Handle card movement — use last bar position (lastCardDropRef) when available so drop matches bar
    const allCards = localLists.flatMap((list) => list.cards || []);
    const card = allCards.find((c) => c.id === active.id);
    if (!card) {
      lastCardDropRef.current = null;
      dragSourceRef.current = null;
      return;
    }

    const sourceList = localLists.find((list) =>
      (list.cards || []).some((c) => c.id === card.id)
    );
    if (!sourceList) {
      lastCardDropRef.current = null;
      dragSourceRef.current = null;
      return;
    }

    let targetListId: string | null = lastCardDropRef.current?.targetListId ?? null;
    let targetIndex = lastCardDropRef.current?.targetIndex ?? 0;
    if (!lastCardDropRef.current && over) {
      const overData = (over.data?.current || null) as { listId?: string } | null;
      const fallback = getCardDropTarget(over.id, overData, card, localLists);
      if (fallback) {
        targetListId = fallback.targetListId;
        targetIndex = fallback.targetIndex;
      }
    }

    if (!targetListId) {
      lastCardDropRef.current = null;
      dragSourceRef.current = null;
      return;
    }

    const targetList = localLists.find((list) => list.id === targetListId);
    if (!targetList) {
      lastCardDropRef.current = null;
      dragSourceRef.current = null;
      return;
    }

    const targetCards = getCardsInOrder(targetList, card.id);
    const fromIndex = dragSourceRef.current?.index ?? getCardsInOrder(sourceList).findIndex((c) => c.id === card.id);
    let finalIndex = targetIndex;
    // Same list + moving down: "insert before card at K" in full list → in list-without-card that slot is at K-1.
    if (sourceList.id === targetListId && fromIndex >= 0 && fromIndex < targetIndex) {
      finalIndex = targetIndex - 1;
    }
    finalIndex = Math.max(0, Math.min(finalIndex, targetCards.length));

    // Optimistic update
    const updatedLists = localLists.map((list) => {
      if (list.id === sourceList.id && list.id !== targetList.id) {
        // Remove from source list (only if different from target)
        return {
          ...list,
          cards: (list.cards || []).filter((c) => c.id !== card.id),
        };
      }
      if (list.id === targetList.id) {
        const newCards = [...targetCards];
        newCards.splice(finalIndex, 0, card);
        return {
          ...list,
          cards: newCards.map((c, idx) => ({ ...c, position: idx })),
        };
      }
      return list;
    });
    setLocalLists(updatedLists);
    setIsMovingCard(true);

    try {
      await moveCard(card.id, targetListId, finalIndex, boardId);
      onBoardUpdate();
    } catch (error: any) {
      console.error('Error moving card:', error);
      // Rollback on error
      setLocalLists(lists);
    } finally {
      setIsMovingCard(false);
    }
    lastCardDropRef.current = null;
    dragSourceRef.current = null;
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={localLists.map((list) => list.id)}
        strategy={horizontalListSortingStrategy}
      >
        <div className="flex items-start gap-4">
          <div ref={setBeforeFirstRef} className="w-14 shrink-0 self-stretch min-h-[120px]" aria-hidden />
          {activeListId && dropIndicatorIndex === 0 && (
            <div className="w-1.5 shrink-0 self-stretch min-h-[120px] rounded-full bg-white shadow-[0_0_0_2px_rgba(251,191,36,0.9)] drop-shadow-lg" aria-hidden />
          )}
          {localLists.map((list, index) => (
            <Fragment key={list.id}>
              <ListColumn
                list={list}
                boardId={boardId}
                workspaceId={workspaceId}
                onUpdate={onBoardUpdate}
                isReordering={isReordering}
                onCardClick={onCardClick}
                activeListId={activeListId}
                activeCardId={activeCard?.id ?? null}
              />
              {activeListId && dropIndicatorIndex === index + 1 && (
                <div className="w-1.5 shrink-0 self-stretch min-h-[120px] rounded-full bg-white shadow-[0_0_0_2px_rgba(251,191,36,0.9)] drop-shadow-lg" aria-hidden />
              )}
            </Fragment>
          ))}
          {activeListId && dropIndicatorIndex === localLists.length && (
            <div className="w-1.5 shrink-0 self-stretch min-h-[120px] rounded-full bg-white shadow-[0_0_0_2px_rgba(251,191,36,0.9)] drop-shadow-lg" aria-hidden />
          )}
          <div ref={setAfterLastRef} className="w-14 shrink-0 self-stretch min-h-[120px]" aria-hidden />
          <CreateListFormInline boardId={boardId} onCreated={onBoardUpdate} />
        </div>
      </SortableContext>
      
      <DragOverlay dropAnimation={dropAnimation}>
        {activeCard ? (
          <div className="w-64 bg-white rounded-md shadow-xl p-3 cursor-grabbing">
            <h3 className="text-sm font-medium text-gray-800">{activeCard.title}</h3>
          </div>
        ) : activeListId ? (
          (() => {
            const list = localLists.find((l) => l.id === activeListId);
            if (!list) return null;
            const cardCount = (list.cards || []).filter((c) => !c.archived).length;
            return (
              <div className="w-72 shrink-0 bg-gray-100 rounded-lg shadow-2xl border-2 border-amber-400/80 p-3 flex flex-col cursor-grabbing opacity-95">
                <div className="font-medium text-gray-800 mb-2">{list.title}</div>
                <div className="text-xs text-gray-500">
                  {cardCount} card{cardCount !== 1 ? 's' : ''}
                </div>
                <div className="flex-1 min-h-[60px] mt-2 rounded bg-gray-200/50" />
              </div>
            );
          })()
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

