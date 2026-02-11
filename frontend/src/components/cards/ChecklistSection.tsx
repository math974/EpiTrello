'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  defaultDropAnimationSideEffects,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FiCheckSquare, FiSquare, FiTrash2, FiMove, FiPlus } from 'react-icons/fi';
import {
  createChecklist,
  updateChecklist,
  deleteChecklist,
  reorderChecklists,
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  reorderChecklistItems,
} from '@/lib/checklistsClient';
import type { ChecklistModel, ChecklistItemModel } from '../../generated/graphql';

const CHECKLIST_PREFIX = 'cl-';
const ITEM_PREFIX = 'item-';

function checklistSortId(id: string) {
  return CHECKLIST_PREFIX + id;
}
function itemSortId(id: string) {
  return ITEM_PREFIX + id;
}

type ChecklistSectionProps = {
  cardId: string;
  boardId: string;
  checklists: ChecklistModel[];
  onUpdate: () => void;
};

// Sortable checklist row (title + delete, contains items)
function SortableChecklistBlock({
  checklist,
  cardId,
  boardId,
  onUpdate,
  onItemAdded,
  onEditTitle,
  editingChecklistId,
  setEditingChecklistId,
}: {
  checklist: ChecklistModel;
  cardId: string;
  boardId: string;
  onUpdate: () => void;
  onItemAdded: (checklistId: string, item: ChecklistItemModel) => void;
  onEditTitle: (id: string, title: string) => void;
  editingChecklistId: string | null;
  setEditingChecklistId: (id: string | null) => void;
}) {
  const [newItemContent, setNewItemContent] = useState('');
  const [addingItem, setAddingItem] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [titleDraft, setTitleDraft] = useState(checklist.title);
  const isEditing = editingChecklistId === checklist.id;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: checklistSortId(checklist.id),
    data: { type: 'checklist' as const, checklist },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const items = (checklist.items ?? []).slice().sort((a, b) => a.position - b.position);
  const checkedCount = items.filter((i) => i.checked).length;

  const handleSaveTitle = async () => {
    const t = titleDraft.trim() || 'Checklist';
    if (t === checklist.title) {
      setEditingChecklistId(null);
      return;
    }
    setSaving(true);
    try {
      await updateChecklist(checklist.id, t, boardId);
      onEditTitle(checklist.id, t);
      onUpdate();
      setEditingChecklistId(null);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteChecklist = async () => {
    setDeleting(true);
    try {
      await deleteChecklist(checklist.id, boardId);
      onUpdate();
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(false);
    }
  };

  const handleAddItem = async () => {
    const content = newItemContent.trim();
    if (!content) return;
    setNewItemContent('');
    setAddingItem(true);
    try {
      const created = await createChecklistItem(checklist.id, content, boardId);
      onItemAdded(checklist.id, created);
    } catch (e) {
      console.error(e);
    } finally {
      setAddingItem(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="mb-6 rounded-lg border border-gray-200 bg-gray-50/50 p-3"
    >
      <div className="mb-2 flex items-center gap-2">
        <button
          className="touch-none cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder checklist"
        >
          <FiMove size={16} />
        </button>
        {isEditing ? (
          <div className="flex-1 flex items-center gap-2">
            <input
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveTitle();
                if (e.key === 'Escape') {
                  setTitleDraft(checklist.title);
                  setEditingChecklistId(null);
                }
              }}
              disabled={saving}
              className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm font-medium"
              autoFocus
            />
          </div>
        ) : (
          <button
            onClick={() => setEditingChecklistId(checklist.id)}
            className="flex-1 text-left text-sm font-medium text-gray-800 hover:bg-gray-100 rounded px-1 py-0.5 -mx-1"
          >
            {checklist.title}
          </button>
        )}
        <span className="text-xs text-gray-500 shrink-0">
          {checkedCount}/{items.length}
        </span>
        <button
          onClick={handleDeleteChecklist}
          disabled={deleting}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
          aria-label="Delete checklist"
        >
          <FiTrash2 size={14} />
        </button>
      </div>

      <div className="ml-6 space-y-1">
        <SortableContext
          items={items.map((i) => itemSortId(i.id))}
          strategy={verticalListSortingStrategy}
        >
          {items.map((item) => (
            <SortableChecklistItem
              key={item.id}
              item={item}
              boardId={boardId}
              onUpdate={onUpdate}
            />
          ))}
        </SortableContext>
        <div className="flex items-center gap-2 pt-1">
          <input
            value={newItemContent}
            onChange={(e) => setNewItemContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddItem();
            }}
            placeholder="Add an item"
            className="flex-1 rounded border border-gray-300 px-2 py-1.5 text-sm"
            disabled={addingItem}
          />
          <button
            onClick={handleAddItem}
            disabled={addingItem || !newItemContent.trim()}
            className="flex items-center gap-1 px-2 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 rounded transition-colors disabled:opacity-50"
          >
            <FiPlus size={14} />
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

function SortableChecklistItem({
  item,
  boardId,
  onUpdate,
}: {
  item: ChecklistItemModel;
  boardId: string;
  onUpdate: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.content);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: itemSortId(item.id),
    data: { type: 'item' as const, checklistId: item.checklistId, item },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSaveContent = async () => {
    const c = draft.trim();
    if (c === item.content) {
      setEditing(false);
      return;
    }
    if (!c) return;
    setSaving(true);
    try {
      await updateChecklistItem(item.id, { content: c }, boardId);
      onUpdate();
      setEditing(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleChecked = async () => {
    try {
      await updateChecklistItem(item.id, { checked: !item.checked }, boardId);
      onUpdate();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteChecklistItem(item.id, boardId);
      onUpdate();
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group flex items-center gap-2 rounded py-1 pr-1"
    >
      <button
        className="touch-none cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 shrink-0 opacity-0 group-hover:opacity-100"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <FiMove size={12} />
      </button>
      <button
        type="button"
        onClick={handleToggleChecked}
        className="shrink-0 text-gray-500 hover:text-gray-700"
        aria-label={item.checked ? 'Uncheck' : 'Check'}
      >
        {item.checked ? (
          <FiCheckSquare size={18} className="text-green-600" />
        ) : (
          <FiSquare size={18} />
        )}
      </button>
      {editing ? (
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleSaveContent}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSaveContent();
            if (e.key === 'Escape') {
              setDraft(item.content);
              setEditing(false);
            }
          }}
          disabled={saving}
          className="flex-1 rounded border border-gray-300 px-2 py-0.5 text-sm"
          autoFocus
        />
      ) : (
        <button
          onClick={() => setEditing(true)}
          className={`flex-1 text-left text-sm rounded px-1 py-0.5 -mx-1 min-w-0 ${
            item.checked ? 'line-through text-gray-500' : 'text-gray-800'
          } hover:bg-gray-100`}
        >
          {item.content || 'Empty'}
        </button>
      )}
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="shrink-0 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
        aria-label="Delete item"
      >
        <FiTrash2 size={12} />
      </button>
    </div>
  );
}

export default function ChecklistSection({
  cardId,
  boardId,
  checklists: initialChecklists,
  onUpdate,
}: ChecklistSectionProps) {
  const [checklists, setChecklists] = useState<ChecklistModel[]>(initialChecklists);
  const [addingChecklist, setAddingChecklist] = useState(false);
  const [newTitle, setNewTitle] = useState('Checklist');
  const [editingChecklistId, setEditingChecklistId] = useState<string | null>(null);

  // Parent passes key={card.id} so we remount when switching cards; no need to sync from props.
  // Same card = same instance = local reorder state is kept.

  const orderedChecklists = [...checklists].sort((a, b) => a.position - b.position);
  const checklistSortIds = orderedChecklists.map((c) => checklistSortId(c.id));

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId.startsWith(CHECKLIST_PREFIX) && overId.startsWith(CHECKLIST_PREFIX)) {
      const fromIndex = orderedChecklists.findIndex((c) => checklistSortId(c.id) === activeId);
      const toIndex = orderedChecklists.findIndex((c) => checklistSortId(c.id) === overId);
      if (fromIndex < 0 || toIndex < 0) return;
      const reordered = arrayMove(orderedChecklists, fromIndex, toIndex);
      setChecklists(reordered);
      try {
        await reorderChecklists(
          cardId,
          reordered.map((c) => c.id),
          boardId
        );
        onUpdate();
      } catch (e) {
        console.error(e);
        setChecklists(initialChecklists);
      }
      return;
    }

    if (activeId.startsWith(ITEM_PREFIX) && overId.startsWith(ITEM_PREFIX)) {
      const activeData = active.data?.current as { checklistId?: string } | undefined;
      const checklistId = activeData?.checklistId;
      if (!checklistId) return;
      const list = orderedChecklists.find((c) => c.id === checklistId);
      if (!list?.items?.length) return;
      const items = [...list.items].sort((a, b) => a.position - b.position);
      const fromIndex = items.findIndex((i) => itemSortId(i.id) === activeId);
      const toIndex = items.findIndex((i) => itemSortId(i.id) === overId);
      if (fromIndex < 0 || toIndex < 0) return;
      const reorderedItems = arrayMove(items, fromIndex, toIndex);
      setChecklists((prev) =>
        prev.map((c) =>
          c.id === checklistId ? { ...c, items: reorderedItems } : c
        )
      );
      try {
        await reorderChecklistItems(
          checklistId,
          reorderedItems.map((i) => i.id),
          boardId
        );
        onUpdate();
      } catch (e) {
        console.error(e);
        setChecklists(initialChecklists);
      }
    }
  };

  const handleAddChecklist = async () => {
    const title = newTitle.trim() || 'Checklist';
    setAddingChecklist(true);
    try {
      const created = await createChecklist(cardId, title, boardId);
      setChecklists((prev) => [...prev, created].sort((a, b) => a.position - b.position));
      setNewTitle('Checklist');
      // Don't call onUpdate() — avoids parent refetch and scroll jump
    } catch (e) {
      console.error(e);
    } finally {
      setAddingChecklist(false);
    }
  };

  const handleItemAdded = (checklistId: string, item: ChecklistItemModel) => {
    setChecklists((prev) =>
      prev.map((c) =>
        c.id === checklistId
          ? {
              ...c,
              items: [...(c.items ?? []), item].sort((a, b) => a.position - b.position),
            }
          : c
      )
    );
  };

  const handleEditTitle = (id: string, title: string) => {
    setChecklists((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title } : c))
    );
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
        <FiCheckSquare size={16} />
        Checklists
      </h3>
      <DndContext
        sensors={useSensors(
          useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
          useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
        )}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={checklistSortIds}
          strategy={verticalListSortingStrategy}
        >
          {orderedChecklists.map((checklist) => (
            <SortableChecklistBlock
              key={checklist.id}
              checklist={checklist}
              cardId={cardId}
              boardId={boardId}
              onUpdate={onUpdate}
              onItemAdded={handleItemAdded}
              onEditTitle={handleEditTitle}
              editingChecklistId={editingChecklistId}
              setEditingChecklistId={setEditingChecklistId}
            />
          ))}
        </SortableContext>

        <DragOverlay
          dropAnimation={{
            sideEffects: defaultDropAnimationSideEffects({
              styles: { active: { opacity: '0.5' } },
            }),
          }}
        >
          {/* Optional: render dragging checklist/item preview if needed */}
        </DragOverlay>
      </DndContext>

      {addingChecklist ? (
        <div className="flex items-center gap-2 mb-4">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddChecklist();
              if (e.key === 'Escape') setAddingChecklist(false);
            }}
            placeholder="Checklist title"
            className="flex-1 rounded border border-gray-300 px-2 py-1.5 text-sm"
            autoFocus
          />
          <button
            onClick={handleAddChecklist}
            disabled={!newTitle.trim()}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Add
          </button>
          <button
            onClick={() => setAddingChecklist(false)}
            className="px-3 py-1.5 text-sm bg-gray-200 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAddingChecklist(true)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded px-2 py-1.5 -mx-2 transition-colors"
        >
          <FiPlus size={16} />
          Add checklist
        </button>
      )}
    </div>
  );
}
