import { apolloClient } from './apollo';
import {
  WorkspaceBoardsDocument,
  CreateBoardDocument,
  UpdateBoardDocument,
  DeleteBoardDocument,
  WorkspaceBoardsQuery,
  CreateBoardMutation,
  UpdateBoardMutation,
  DeleteBoardMutation,
  BoardModel,
} from '../generated/graphql';

/**
 * Fetch all boards for a workspace
 * @param workspaceId Workspace ID
 * @returns Array of boards
 * @throws Error if query fails
 */
export async function workspaceBoards(workspaceId: string): Promise<BoardModel[]> {
  try {
    const { data } = await apolloClient.query<WorkspaceBoardsQuery>({
      query: WorkspaceBoardsDocument,
      variables: { workspaceId },
      fetchPolicy: 'network-only',
    });

    return data?.workspaceBoards ?? [];
  } catch (error: any) {
    throw error;
  }
}

/**
 * Create a new board in a workspace
 * @param workspaceId Workspace ID
 * @param title Board title
 * @returns Created board
 * @throws Error if creation fails
 */
export async function createBoard(workspaceId: string, title: string): Promise<BoardModel> {
  try {
    const { data } = await apolloClient.mutate<CreateBoardMutation>({
      mutation: CreateBoardDocument,
      variables: {
        input: { workspaceId, title },
      },
      refetchQueries: [{ query: WorkspaceBoardsDocument, variables: { workspaceId } }],
    });

    if (!data?.createBoard) {
      throw new Error('Board creation failed: No data returned');
    }

    return data.createBoard;
  } catch (error: any) {
    throw error;
  }
}

/**
 * Update a board
 * @param id Board ID
 * @param title Board title
 * @param description Optional board description
 * @param background Optional board background color
 * @returns Updated board
 * @throws Error if update fails
 */
export async function updateBoard(
  id: string,
  title: string,
  description?: string | null,
  background?: string,
  workspaceId?: string
): Promise<BoardModel> {
  try {
    const { data } = await apolloClient.mutate<UpdateBoardMutation>({
      mutation: UpdateBoardDocument,
      variables: {
        input: { id, title, description, background },
      },
      refetchQueries: workspaceId
        ? [{ query: WorkspaceBoardsDocument, variables: { workspaceId } }]
        : [],
    });

    if (!data?.updateBoard) {
      throw new Error('Board update failed: No data returned');
    }

    return data.updateBoard;
  } catch (error: any) {
    throw error;
  }
}

/**
 * Delete a board
 * @param id Board ID
 * @param workspaceId Workspace ID (for refetch)
 * @returns True if deletion succeeded
 * @throws Error if deletion fails
 */
export async function deleteBoard(id: string, workspaceId: string): Promise<boolean> {
  try {
    const { data } = await apolloClient.mutate<DeleteBoardMutation>({
      mutation: DeleteBoardDocument,
      variables: { id },
      refetchQueries: [{ query: WorkspaceBoardsDocument, variables: { workspaceId } }],
    });

    return data?.deleteBoard ?? false;
  } catch (error: any) {
    throw error;
  }
}

// Re-export types for convenience
export type { BoardModel } from '../generated/graphql';

