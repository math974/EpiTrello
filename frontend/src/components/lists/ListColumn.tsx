import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ListModel } from '../../generated/graphql';
import ListHeader from './ListHeader';

type ListColumnProps = {
  list: ListModel;
  boardId: string;
  onUpdate: () => void;
  isReordering?: boolean;
};

export default function ListColumn({ list, boardId, onUpdate, isReordering = false }: ListColumnProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: list.id, disabled: isReordering });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
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
      {/* Cards will go here in future */}
      <div className="flex-1 overflow-y-auto min-h-[100px] mt-2">
        {/* Placeholder for cards - will be implemented later */}
        <div className="text-xs text-gray-500 text-center py-4">
          No cards yet
        </div>
      </div>
    </div>
  );
}

