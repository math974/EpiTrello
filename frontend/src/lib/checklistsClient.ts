import { gql } from '@apollo/client';
import { apolloClient } from './apollo';
import {
  CreateChecklistDocument,
  UpdateChecklistDocument,
  DeleteChecklistDocument,
  ReorderChecklistsDocument,
  CreateChecklistItemDocument,
  UpdateChecklistItemDocument,
  DeleteChecklistItemDocument,
  ReorderChecklistItemsDocument,
} from '../generated/graphql';
import type { ChecklistModel, ChecklistItemModel } from '../generated/graphql';

const CHECKLIST_CARD_ID_FRAGMENT = gql`
  fragment ChecklistCardId on ChecklistModel {
    id
    cardId
  }
`;

function cardCacheId(cardId: string): string {
  return `CardModel:${cardId}`;
}
function checklistCacheId(id: string): string {
  return `ChecklistModel:${id}`;
}
function checklistItemCacheId(id: string): string {
  return `ChecklistItemModel:${id}`;
}

/** Creates a checklist and updates Apollo cache (no refetch, so no scroll jump). Caller can also update local state for immediate UI. */
export async function createChecklist(
  cardId: string,
  title: string,
  _boardId: string
): Promise<ChecklistModel> {
  const { data } = await apolloClient.mutate({
    mutation: CreateChecklistDocument,
    variables: { input: { cardId, title } },
    update(cache, { data: result }) {
      if (!result?.createChecklist) return;
      const ref = { __ref: checklistCacheId(result.createChecklist.id) };
      cache.modify({
        id: cardCacheId(cardId),
        fields: {
          checklists(existing: { __ref: string }[] = []) {
            return [...existing, ref];
          },
        },
      });
    },
  });
  if (!data?.createChecklist) throw new Error('Failed to create checklist');
  return data.createChecklist;
}

export async function updateChecklist(
  id: string,
  title: string,
  _boardId: string
): Promise<ChecklistModel> {
  const { data } = await apolloClient.mutate({
    mutation: UpdateChecklistDocument,
    variables: { input: { id, title } },
    update(cache, { data: result }) {
      if (!result?.updateChecklist) return;
      cache.modify({
        id: checklistCacheId(id),
        fields: {
          title() {
            return result!.updateChecklist!.title;
          },
        },
      });
    },
  });
  if (!data?.updateChecklist) throw new Error('Failed to update checklist');
  return data.updateChecklist;
}

export async function deleteChecklist(id: string, _boardId: string): Promise<boolean> {
  const { data } = await apolloClient.mutate({
    mutation: DeleteChecklistDocument,
    variables: { input: { id } },
    update(cache) {
      const checklist = cache.readFragment<{ cardId: string }>({
        id: checklistCacheId(id),
        fragment: CHECKLIST_CARD_ID_FRAGMENT,
        fragmentName: 'ChecklistCardId',
      });
      if (checklist?.cardId) {
        cache.modify({
          id: cardCacheId(checklist.cardId),
          fields: {
            checklists(existing: { __ref: string }[] = []) {
              return existing.filter((r) => r.__ref !== checklistCacheId(id));
            },
          },
        });
      }
      cache.evict({ id: checklistCacheId(id) });
      cache.gc();
    },
  });
  return data?.deleteChecklist ?? false;
}

/** Reorders checklists on the server and in Apollo cache (no refetch, so no scroll jump). */
export async function reorderChecklists(
  cardId: string,
  checklistIds: string[],
  _boardId: string
): Promise<boolean> {
  const { data } = await apolloClient.mutate({
    mutation: ReorderChecklistsDocument,
    variables: { input: { cardId, checklistIds } },
    update(cache) {
      const refs = checklistIds.map((cid) => ({ __ref: checklistCacheId(cid) }));
      cache.modify({
        id: cardCacheId(cardId),
        fields: {
          checklists() {
            return refs;
          },
        },
      });
    },
  });
  return data?.reorderChecklists ?? false;
}

/** Creates a checklist item and updates Apollo cache (no refetch, so no scroll jump). Caller can also update local state for immediate UI. */
export async function createChecklistItem(
  checklistId: string,
  content: string,
  _boardId: string
): Promise<ChecklistItemModel> {
  const { data } = await apolloClient.mutate({
    mutation: CreateChecklistItemDocument,
    variables: { input: { checklistId, content } },
    update(cache, { data: result }) {
      if (!result?.createChecklistItem) return;
      const ref = { __ref: checklistItemCacheId(result.createChecklistItem.id) };
      cache.modify({
        id: checklistCacheId(checklistId),
        fields: {
          items(existing: { __ref: string }[] = []) {
            return [...existing, ref];
          },
        },
      });
    },
  });
  if (!data?.createChecklistItem) throw new Error('Failed to create checklist item');
  return data.createChecklistItem;
}

export async function updateChecklistItem(
  id: string,
  updates: { content?: string; checked?: boolean },
  _boardId: string
): Promise<ChecklistItemModel> {
  const { data } = await apolloClient.mutate({
    mutation: UpdateChecklistItemDocument,
    variables: { input: { id, ...updates } },
    update(cache, { data: result }) {
      if (!result?.updateChecklistItem) return;
      const item = result.updateChecklistItem;
      cache.modify({
        id: checklistItemCacheId(id),
        fields: {
          content() {
            return item.content;
          },
          checked() {
            return item.checked;
          },
        },
      });
    },
  });
  if (!data?.updateChecklistItem) throw new Error('Failed to update checklist item');
  return data.updateChecklistItem;
}

const ITEM_CHECKLIST_ID_FRAGMENT = gql`
  fragment ItemChecklistId on ChecklistItemModel {
    id
    checklistId
  }
`;

export async function deleteChecklistItem(id: string, _boardId: string): Promise<boolean> {
  const { data } = await apolloClient.mutate({
    mutation: DeleteChecklistItemDocument,
    variables: { input: { id } },
    update(cache) {
      const item = cache.readFragment<{ checklistId: string }>({
        id: checklistItemCacheId(id),
        fragment: ITEM_CHECKLIST_ID_FRAGMENT,
        fragmentName: 'ItemChecklistId',
      });
      if (item?.checklistId) {
        cache.modify({
          id: checklistCacheId(item.checklistId),
          fields: {
            items(existing: { __ref: string }[] = []) {
              return existing.filter((r) => r.__ref !== checklistItemCacheId(id));
            },
          },
        });
      }
      cache.evict({ id: checklistItemCacheId(id) });
      cache.gc();
    },
  });
  return data?.deleteChecklistItem ?? false;
}

/** Reorders checklist items on the server and in Apollo cache (no refetch, so no scroll jump). */
export async function reorderChecklistItems(
  checklistId: string,
  itemIds: string[],
  _boardId: string
): Promise<boolean> {
  const { data } = await apolloClient.mutate({
    mutation: ReorderChecklistItemsDocument,
    variables: { input: { checklistId, itemIds } },
    update(cache) {
      const refs = itemIds.map((iid) => ({ __ref: checklistItemCacheId(iid) }));
      cache.modify({
        id: checklistCacheId(checklistId),
        fields: {
          items() {
            return refs;
          },
        },
      });
    },
  });
  return data?.reorderChecklistItems ?? false;
}
