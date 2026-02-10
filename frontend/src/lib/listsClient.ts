import { apolloClient } from './apollo';
import {
  BoardDocument,
  CreateListDocument,
  UpdateListDocument,
  ArchiveListDocument,
  DeleteListDocument,
  ReorderListsDocument,
  BoardQuery,
  CreateListMutation,
  UpdateListMutation,
  ArchiveListMutation,
  DeleteListMutation,
  ReorderListsMutation,
  ListModel,
  BoardModel,
} from '../generated/graphql';

/**
 * Fetch a board with its lists
 * @param boardId Board ID
 * @returns Board with lists
 * @throws Error if query fails
 */
export async function getBoard(boardId: string): Promise<BoardModel | null> {
  try {
    const { data } = await apolloClient.query<BoardQuery>({
      query: BoardDocument,
      variables: { id: boardId },
      fetchPolicy: 'network-only',
    });

    return data?.board ?? null;
  } catch (error: any) {
    throw error;
  }
}

/**
 * Create a new list in a board
 * @param boardId Board ID
 * @param title List title
 * @returns Created list
 * @throws Error if creation fails
 */
export async function createList(boardId: string, title: string): Promise<ListModel> {
  try {
    const { data } = await apolloClient.mutate<CreateListMutation>({
      mutation: CreateListDocument,
      variables: {
        input: { boardId, title },
      },
      refetchQueries: [{ query: BoardDocument, variables: { id: boardId } }],
    });

    if (!data?.createList) {
      throw new Error('List creation failed: No data returned');
    }

    return data.createList;
  } catch (error: any) {
    throw error;
  }
}

/**
 * Update a list (rename)
 * @param id List ID
 * @param title New title
 * @param boardId Board ID (for refetch)
 * @returns Updated list
 * @throws Error if update fails
 */
export async function updateList(id: string, title: string, boardId: string): Promise<ListModel> {
  try {
    const { data } = await apolloClient.mutate<UpdateListMutation>({
      mutation: UpdateListDocument,
      variables: {
        input: { id, title },
      },
      refetchQueries: [{ query: BoardDocument, variables: { id: boardId } }],
    });

    if (!data?.updateList) {
      throw new Error('List update failed: No data returned');
    }

    return data.updateList;
  } catch (error: any) {
    throw error;
  }
}

/**
 * Archive or unarchive a list
 * @param id List ID
 * @param archived Archive status
 * @param boardId Board ID (for refetch)
 * @returns Updated list
 * @throws Error if archive fails
 */
export async function archiveList(id: string, archived: boolean, boardId: string): Promise<ListModel> {
  try {
    const { data } = await apolloClient.mutate<ArchiveListMutation>({
      mutation: ArchiveListDocument,
      variables: {
        input: { id, archived },
      },
      refetchQueries: [{ query: BoardDocument, variables: { id: boardId } }],
    });

    if (!data?.archiveList) {
      throw new Error('List archive failed: No data returned');
    }

    return data.archiveList;
  } catch (error: any) {
    throw error;
  }
}

/**
 * Delete a list
 * @param id List ID
 * @param boardId Board ID (for refetch)
 * @returns True if deletion succeeded
 * @throws Error if deletion fails
 */
export async function deleteList(id: string, boardId: string): Promise<boolean> {
  try {
    const { data } = await apolloClient.mutate<DeleteListMutation>({
      mutation: DeleteListDocument,
      variables: { id },
      refetchQueries: [{ query: BoardDocument, variables: { id: boardId } }],
    });

    return data?.deleteList ?? false;
  } catch (error: any) {
    throw error;
  }
}

/**
 * Reorder lists in a board
 * @param boardId Board ID
 * @param orderedListIds Array of list IDs in the desired order
 * @returns True if reorder succeeded
 * @throws Error if reorder fails
 */
export async function reorderLists(boardId: string, orderedListIds: string[]): Promise<boolean> {
  try {
    const { data } = await apolloClient.mutate<ReorderListsMutation>({
      mutation: ReorderListsDocument,
      variables: {
        input: { boardId, orderedListIds },
      },
      refetchQueries: [{ query: BoardDocument, variables: { id: boardId } }],
    });

    return data?.reorderLists ?? false;
  } catch (error: any) {
    throw error;
  }
}

// Re-export types for convenience
export type { ListModel, BoardModel } from '../generated/graphql';

