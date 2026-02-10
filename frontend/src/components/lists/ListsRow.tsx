import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { ListModel } from '../../generated/graphql';
import ListColumn from './ListColumn';
import CreateListFormInline from './CreateListFormInline';
import { reorderLists } from '@/lib/listsClient';

type ListsRowProps = {
  boardId: string;
  lists: ListModel[];
  archivedLists: ListModel[];
  onBoardUpdate: () => void;
};

export default function ListsRow({ boardId, lists, archivedLists, onBoardUpdate }: ListsRowProps) {
  const [isReordering, setIsReordering] = useState(false);
  const [localLists, setLocalLists] = useState<ListModel[]>(lists);

  // Update local lists when props change
  useEffect(() => {
    setLocalLists(lists);
  }, [lists]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before starting drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = localLists.findIndex((list) => list.id === active.id);
    const newIndex = localLists.findIndex((list) => list.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Optimistic update
    const reorderedLists = arrayMove(localLists, oldIndex, newIndex);
    setLocalLists(reorderedLists);
    setIsReordering(true);

    try {
      const orderedListIds = reorderedLists.map((list) => list.id);
      await reorderLists(boardId, orderedListIds);
      // Refetch to get updated positions from backend
      onBoardUpdate();
    } catch (error: any) {
      console.error('Error reordering lists:', error);
      // Rollback on error
      setLocalLists(lists);
      // TODO: Show toast error
    } finally {
      setIsReordering(false);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={localLists.map((list) => list.id)}
        strategy={horizontalListSortingStrategy}
      >
        <div className="flex items-start gap-4">
          {localLists.map((list) => (
            <ListColumn
              key={list.id}
              list={list}
              boardId={boardId}
              onUpdate={onBoardUpdate}
              isReordering={isReordering}
            />
          ))}
          <CreateListFormInline boardId={boardId} onCreated={onBoardUpdate} />
        </div>
      </SortableContext>
    </DndContext>
  );
}

